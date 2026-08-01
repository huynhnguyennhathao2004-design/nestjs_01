'use strict';

const accountTableBody =
  document.getElementById(
    'accountTableBody'
  );

const emptyAccounts =
  document.getElementById(
    'emptyAccounts'
  );

const accountResultLine =
  document.getElementById(
    'accountResultLine'
  );

const adminSearchInput =
  document.getElementById(
    'adminSearchInput'
  );

const roleFilter =
  document.getElementById(
    'roleFilter'
  );

const statusFilter =
  document.getElementById(
    'statusFilter'
  );

const providerFilter =
  document.getElementById(
    'providerFilter'
  );

const resetFilterBtn =
  document.getElementById(
    'resetFilterBtn'
  );

const accountModal =
  document.getElementById(
    'accountModal'
  );

const modalOverlay =
  document.getElementById(
    'modalOverlay'
  );

const modalCloseBtn =
  document.getElementById(
    'modalCloseBtn'
  );

const adminUsersState = {
  accounts: [],

  pagination: {
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1
  },

  loading: false,

  pendingStatusIds:
    new Set()
};

let searchTimer = null;

/* =====================================
   NGƯỜI DÙNG HIỆN TẠI
===================================== */

function getCurrentUser() {
  try {
    const rawUser =
      sessionStorage.getItem(
        'user'
      );

    return rawUser
      ? JSON.parse(rawUser)
      : null;
  } catch (error) {
    return null;
  }
}

function isAdmin(user) {
  return Boolean(
    user &&
    String(user.role || '')
      .toUpperCase() ===
      'ADMIN'
  );
}

function isSameAccount(
  firstId,
  secondId
) {
  return (
    String(firstId) ===
    String(secondId)
  );
}

/* =====================================
   HÀM HỖ TRỢ
===================================== */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getInitial(name) {
  return (
    String(name || 'U')
      .trim()
      .charAt(0)
      .toUpperCase() ||
    'U'
  );
}

function formatDate(value) {
  if (!value) {
    return 'Chưa xác định';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Chưa xác định';
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(date);
}

function normalizeAccount(source) {
  const account =
    source || {};

  return {
    id:
      String(
        account.id || ''
      ),

    name:
      String(
        account.name ||
        account.fullName ||
        'Chưa đặt tên'
      ),

    fullName:
      String(
        account.fullName ||
        account.name ||
        'Chưa đặt tên'
      ),

    email:
      String(
        account.email || ''
      ),

    avatar:
      String(
        account.avatar ||
        account.avatarUrl ||
        ''
      ),

    avatarUrl:
      account.avatarUrl || null,

    role:
      String(
        account.role ||
        'USER'
      ).toUpperCase(),

    status:
      String(
        account.status ||
        'ACTIVE'
      ).toUpperCase(),

    /*
     * API hiện chưa trả provider.
     * Tạm mặc định là LOCAL.
     */
    provider:
      String(
        account.provider ||
        'LOCAL'
      ).toUpperCase(),

    emailVerifiedAt:
      account.emailVerifiedAt ||
      null,

    lastLoginAt:
      account.lastLoginAt ||
      null,

    createdAt:
      account.createdAt ||
      null,

    updatedAt:
      account.updatedAt ||
      null
  };
}

async function readResponseData(
  response
) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function getErrorMessage(
  responseData,
  fallbackMessage
) {
  if (
    responseData &&
    Array.isArray(
      responseData.message
    )
  ) {
    return responseData.message
      .join(' ');
  }

  if (
    responseData &&
    typeof responseData.message ===
      'string'
  ) {
    return responseData.message;
  }

  return fallbackMessage;
}

function showMessage(
  message,
  type = 'info'
) {
  if (
    window.Toast &&
    typeof Toast[type] ===
      'function'
  ) {
    Toast[type](message);
    return;
  }

  console.log(message);
}

async function confirmAction(
  options
) {
  if (
    window.AppModal &&
    typeof AppModal.confirm ===
      'function'
  ) {
    return AppModal.confirm(
      options
    );
  }

  return window.confirm(
    options.message ||
    'Bạn có chắc muốn tiếp tục?'
  );
}

function setLoading(
  isLoading
) {
  adminUsersState.loading =
    isLoading;

  if (
    accountResultLine &&
    isLoading
  ) {
    accountResultLine.textContent =
      'Đang tải danh sách tài khoản...';
  }
}

/* =====================================
   THỐNG KÊ
===================================== */

function updateStatistics(
  accounts
) {
  const totalAccounts =
    document.getElementById(
      'totalAccounts'
    );

  const activeAccounts =
    document.getElementById(
      'activeAccounts'
    );

  const lockedAccounts =
    document.getElementById(
      'lockedAccounts'
    );

  const adminAccounts =
    document.getElementById(
      'adminAccounts'
    );

  const activeCount =
    accounts.filter(
      function (account) {
        return (
          account.status ===
          'ACTIVE'
        );
      }
    ).length;

  const lockedCount =
    accounts.filter(
      function (account) {
        return (
          account.status ===
          'LOCKED'
        );
      }
    ).length;

  const adminCount =
    accounts.filter(
      function (account) {
        return (
          account.role ===
          'ADMIN'
        );
      }
    ).length;

  if (totalAccounts) {
    totalAccounts.textContent =
      String(
        adminUsersState
          .pagination.total ||
        accounts.length
      );
  }

  if (activeAccounts) {
    activeAccounts.textContent =
      String(activeCount);
  }

  if (lockedAccounts) {
    lockedAccounts.textContent =
      String(lockedCount);
  }

  if (adminAccounts) {
    adminAccounts.textContent =
      String(adminCount);
  }
}

/* =====================================
   BỘ LỌC
===================================== */

function getFilteredAccounts() {
  const selectedRole =
    roleFilter
      ? roleFilter.value
      : 'ALL';

  const selectedStatus =
    statusFilter
      ? statusFilter.value
      : 'ALL';

  const selectedProvider =
    providerFilter
      ? providerFilter.value
      : 'ALL';

  return adminUsersState
    .accounts
    .filter(
      function (account) {
        const roleMatches =
          selectedRole ===
            'ALL' ||
          account.role ===
            selectedRole;

        const statusMatches =
          selectedStatus ===
            'ALL' ||
          account.status ===
            selectedStatus;

        const providerMatches =
          selectedProvider ===
            'ALL' ||
          account.provider ===
            selectedProvider;

        return (
          roleMatches &&
          statusMatches &&
          providerMatches
        );
      }
    );
}

/* =====================================
   HIỂN THỊ BẢNG
===================================== */

function createAvatar(account) {
  if (account.avatar) {
    return `
      <div class="table-avatar">
        <img
          src="${escapeHtml(
            account.avatar
          )}"
          alt="${escapeHtml(
            account.name
          )}"
        />
      </div>
    `;
  }

  return `
    <div class="table-avatar">
      ${escapeHtml(
        getInitial(
          account.name
        )
      )}
    </div>
  `;
}

function renderAccounts() {
  if (!accountTableBody) {
    return;
  }

  const currentUser =
    getCurrentUser();

  const filteredAccounts =
    getFilteredAccounts();

  updateStatistics(
    adminUsersState.accounts
  );

  accountTableBody.innerHTML =
    '';

  if (accountResultLine) {
    accountResultLine.textContent =
      `Đang hiển thị ` +
      `${filteredAccounts.length} ` +
      `trên ` +
      `${adminUsersState.pagination.total} ` +
      `tài khoản.`;
  }

  if (
    filteredAccounts.length ===
    0
  ) {
    emptyAccounts?.classList.add(
      'show'
    );

    return;
  }

  emptyAccounts?.classList.remove(
    'show'
  );

  filteredAccounts.forEach(
    function (account) {
      const isCurrentAccount =
        currentUser &&
        isSameAccount(
          account.id,
          currentUser.id
        );

      const isPending =
        adminUsersState
          .pendingStatusIds
          .has(account.id);

      const providerLabel =
        account.provider ===
        'GOOGLE'
          ? 'Google'
          : 'Tài khoản thường';

      const row =
        document.createElement(
          'tr'
        );

      row.innerHTML = `
        <td>
          <div class="account-cell">
            ${createAvatar(
              account
            )}

            <div>
              <strong>
                ${escapeHtml(
                  account.name
                )}
              </strong>

              <span>
                ${escapeHtml(
                  account.email
                )}
              </span>

              ${
                isCurrentAccount
                  ? `
                    <small
                      class="current-account-label"
                    >
                      Tài khoản hiện tại
                    </small>
                  `
                  : ''
              }
            </div>
          </div>
        </td>

        <td>
          <span
            class="account-badge ${
              account.provider ===
              'GOOGLE'
                ? 'provider-google'
                : 'provider-local'
            }"
          >
            ${providerLabel}
          </span>
        </td>

        <td>
          <span
            class="account-badge ${
              account.role ===
              'ADMIN'
                ? 'role-admin'
                : 'role-user'
            }"
          >
            ${
              account.role ===
              'ADMIN'
                ? 'Quản trị viên'
                : 'Người dùng'
            }
          </span>
        </td>

        <td>
          <span
            class="account-badge ${
              account.status ===
              'LOCKED'
                ? 'status-locked'
                : 'status-active'
            }"
          >
            ${
              account.status ===
              'LOCKED'
                ? 'Đã khóa'
                : 'Hoạt động'
            }
          </span>
        </td>

        <td>
          ${formatDate(
            account.createdAt
          )}
        </td>

        <td>
          <div class="account-actions">
            <button
              type="button"
              class="
                table-action-btn
                view-action
              "
              data-action="view"
              data-account-id="${escapeHtml(
                account.id
              )}"
            >
              Xem
            </button>

            <button
              type="button"
              class="
                table-action-btn
                ${
                  account.status ===
                  'LOCKED'
                    ? 'unlock-action'
                    : 'lock-action'
                }
              "
              data-action="status"
              data-account-id="${escapeHtml(
                account.id
              )}"
              ${
                isCurrentAccount ||
                isPending
                  ? 'disabled'
                  : ''
              }
            >
              ${
                isPending
                  ? 'Đang xử lý...'
                  : account.status ===
                    'LOCKED'
                    ? 'Mở khóa'
                    : 'Khóa'
              }
            </button>
          </div>
        </td>
      `;

      accountTableBody.appendChild(
        row
      );
    }
  );
}

/* =====================================
   GỌI API DANH SÁCH
===================================== */

async function loadAccounts() {
  if (
    !window.AuthStore ||
    typeof AuthStore.authFetch !==
      'function'
  ) {
    showMessage(
      'Thành phần xác thực chưa được tải.',
      'error'
    );

    return;
  }

  setLoading(true);

  try {
    const keyword =
      adminSearchInput
        ? adminSearchInput
            .value
            .trim()
        : '';

    const query =
      new URLSearchParams({
        page: '1',
        limit: '100'
      });

    if (keyword) {
      query.set(
        'search',
        keyword
      );
    }

    const response =
      await AuthStore.authFetch(
        `/api/admin/users?${query.toString()}`,
        {
          headers: {
            Accept:
              'application/json'
          }
        }
      );

    const responseData =
      await readResponseData(
        response
      );

    if (!response.ok) {
      if (
        response.status ===
        401
      ) {
        window.location.replace(
          '/login.html'
        );

        return;
      }

      if (
        response.status ===
        403
      ) {
        showMessage(
          getErrorMessage(
            responseData,
            'Bạn không có quyền quản trị hệ thống.'
          ),
          'error'
        );

        window.setTimeout(
          function () {
            window.location.replace(
              '/index.html'
            );
          },
          900
        );

        return;
      }

      throw new Error(
        getErrorMessage(
          responseData,
          'Không thể tải danh sách tài khoản.'
        )
      );
    }

    if (
      !responseData ||
      !Array.isArray(
        responseData.data
      )
    ) {
      throw new Error(
        'Backend không trả về danh sách tài khoản hợp lệ.'
      );
    }

    adminUsersState.accounts =
      responseData.data.map(
        normalizeAccount
      );

    adminUsersState.pagination = {
      page:
        responseData
          .pagination?.page ||
        1,

      limit:
        responseData
          .pagination?.limit ||
        100,

      total:
        responseData
          .pagination?.total ||
        0,

      totalPages:
        responseData
          .pagination
          ?.totalPages ||
        1
    };

    renderAccounts();
  } catch (error) {
    console.error(
      'Lỗi tải danh sách tài khoản:',
      error
    );

    adminUsersState.accounts =
      [];

    adminUsersState
      .pagination
      .total = 0;

    renderAccounts();

    showMessage(
      error instanceof Error
        ? error.message
        : 'Không thể tải danh sách tài khoản.',
      'error'
    );
  } finally {
    setLoading(false);
  }
}

/* =====================================
   XEM CHI TIẾT
===================================== */

function findAccount(accountId) {
  return (
    adminUsersState
      .accounts
      .find(
        function (account) {
          return isSameAccount(
            account.id,
            accountId
          );
        }
      ) ||
    null
  );
}

function openAccountModal(account) {
  if (
    !accountModal ||
    !account
  ) {
    return;
  }

  const modalAvatar =
    document.getElementById(
      'modalAvatar'
    );

  const modalAccountName =
    document.getElementById(
      'modalAccountName'
    );

  const modalAccountEmail =
    document.getElementById(
      'modalAccountEmail'
    );

  const modalAccountId =
    document.getElementById(
      'modalAccountId'
    );

  const modalAccountRole =
    document.getElementById(
      'modalAccountRole'
    );

  const modalAccountStatus =
    document.getElementById(
      'modalAccountStatus'
    );

  const modalAccountProvider =
    document.getElementById(
      'modalAccountProvider'
    );

  const modalAccountCreatedAt =
    document.getElementById(
      'modalAccountCreatedAt'
    );

  if (modalAvatar) {
    modalAvatar.textContent =
      getInitial(
        account.name
      );
  }

  if (modalAccountName) {
    modalAccountName.textContent =
      account.name;
  }

  if (modalAccountEmail) {
    modalAccountEmail.textContent =
      account.email ||
      'Không có email';
  }

  if (modalAccountId) {
    modalAccountId.textContent =
      account.id ||
      '—';
  }

  if (modalAccountRole) {
    modalAccountRole.textContent =
      account.role ===
      'ADMIN'
        ? 'Quản trị viên'
        : 'Người dùng';
  }

  if (modalAccountStatus) {
    modalAccountStatus.textContent =
      account.status ===
      'LOCKED'
        ? 'Đã bị khóa'
        : 'Đang hoạt động';
  }

  if (modalAccountProvider) {
    modalAccountProvider.textContent =
      account.provider ===
      'GOOGLE'
        ? 'Google'
        : 'Tài khoản thường';
  }

  if (modalAccountCreatedAt) {
    modalAccountCreatedAt.textContent =
      formatDate(
        account.createdAt
      );
  }

  accountModal.classList.add(
    'show'
  );

  accountModal.setAttribute(
    'aria-hidden',
    'false'
  );

  document.body.style.overflow =
    'hidden';
}

function closeAccountModal() {
  if (!accountModal) {
    return;
  }

  accountModal.classList.remove(
    'show'
  );

  accountModal.setAttribute(
    'aria-hidden',
    'true'
  );

  document.body.style.overflow =
    '';
}

/* =====================================
   KHÓA HOẶC MỞ KHÓA
===================================== */

async function toggleAccountStatus(
  accountId
) {
  const account =
    findAccount(accountId);

  const currentUser =
    getCurrentUser();

  if (!account) {
    showMessage(
      'Không tìm thấy tài khoản.',
      'error'
    );

    return;
  }

  if (
    currentUser &&
    isSameAccount(
      account.id,
      currentUser.id
    )
  ) {
    showMessage(
      'Bạn không thể tự khóa tài khoản đang đăng nhập.',
      'error'
    );

    return;
  }

  if (
    adminUsersState
      .pendingStatusIds
      .has(account.id)
  ) {
    return;
  }

  const newStatus =
    account.status ===
    'LOCKED'
      ? 'ACTIVE'
      : 'LOCKED';

  const confirmed =
    await confirmAction({
      type:
        newStatus ===
        'LOCKED'
          ? 'warning'
          : 'success',

      title:
        newStatus ===
        'LOCKED'
          ? 'Khóa tài khoản'
          : 'Mở khóa tài khoản',

      message:
        newStatus ===
        'LOCKED'
          ? `Tài khoản ${account.name} sẽ không thể đăng nhập sau khi bị khóa.`
          : `Tài khoản ${account.name} sẽ có thể đăng nhập lại.`,

      confirmText:
        newStatus ===
        'LOCKED'
          ? 'Khóa tài khoản'
          : 'Mở khóa',

      cancelText:
        'Hủy'
    });

  if (!confirmed) {
    return;
  }

  adminUsersState
    .pendingStatusIds
    .add(account.id);

  renderAccounts();

  try {
    const response =
      await AuthStore.authFetch(
        `/api/admin/users/${encodeURIComponent(
          account.id
        )}/status`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json'
          },

          body: JSON.stringify({
            status:
              newStatus
          })
        }
      );

    const responseData =
      await readResponseData(
        response
      );

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          responseData,
          'Không thể cập nhật trạng thái tài khoản.'
        )
      );
    }

    if (!responseData?.user) {
      throw new Error(
        'Backend không trả về tài khoản đã cập nhật.'
      );
    }

    const updatedAccount =
      normalizeAccount(
        responseData.user
      );

    adminUsersState.accounts =
      adminUsersState
        .accounts
        .map(
          function (item) {
            return isSameAccount(
              item.id,
              updatedAccount.id
            )
              ? updatedAccount
              : item;
          }
        );

    showMessage(
      responseData.message ||
        (
          newStatus ===
          'LOCKED'
            ? 'Khóa tài khoản thành công.'
            : 'Mở khóa tài khoản thành công.'
        ),
      'success'
    );
  } catch (error) {
    console.error(
      'Lỗi cập nhật trạng thái:',
      error
    );

    showMessage(
      error instanceof Error
        ? error.message
        : 'Không thể cập nhật trạng thái tài khoản.',
      'error'
    );
  } finally {
    adminUsersState
      .pendingStatusIds
      .delete(account.id);

    renderAccounts();
  }
}

/* =====================================
   SỰ KIỆN BẢNG
===================================== */

function setupTableActions() {
  accountTableBody
    ?.addEventListener(
      'click',
      async function (event) {
        const button =
          event.target.closest(
            '[data-action]'
          );

        if (
          !button ||
          button.disabled
        ) {
          return;
        }

        const action =
          button.dataset.action;

        const accountId =
          button.dataset.accountId;

        const account =
          findAccount(
            accountId
          );

        if (
          action ===
          'view'
        ) {
          openAccountModal(
            account
          );

          return;
        }

        if (
          action ===
          'status'
        ) {
          await toggleAccountStatus(
            accountId
          );
        }
      }
    );
}

/* =====================================
   SỰ KIỆN BỘ LỌC
===================================== */

function setupFilters() {
  adminSearchInput
    ?.addEventListener(
      'input',
      function () {
        window.clearTimeout(
          searchTimer
        );

        searchTimer =
          window.setTimeout(
            loadAccounts,
            350
          );
      }
    );

  roleFilter
    ?.addEventListener(
      'change',
      renderAccounts
    );

  statusFilter
    ?.addEventListener(
      'change',
      renderAccounts
    );

  providerFilter
    ?.addEventListener(
      'change',
      renderAccounts
    );

  resetFilterBtn
    ?.addEventListener(
      'click',
      async function () {
        if (adminSearchInput) {
          adminSearchInput.value =
            '';
        }

        if (roleFilter) {
          roleFilter.value =
            'ALL';
        }

        if (statusFilter) {
          statusFilter.value =
            'ALL';
        }

        if (providerFilter) {
          providerFilter.value =
            'ALL';
        }

        await loadAccounts();
      }
    );
}

/* =====================================
   SỰ KIỆN MODAL
===================================== */

function setupModalEvents() {
  modalCloseBtn
    ?.addEventListener(
      'click',
      closeAccountModal
    );

  modalOverlay
    ?.addEventListener(
      'click',
      closeAccountModal
    );

  document.addEventListener(
    'keydown',
    function (event) {
      if (
        event.key ===
        'Escape'
      ) {
        closeAccountModal();
      }
    }
  );
}

/* =====================================
   KHỞI TẠO
===================================== */

async function initializeAdminUsersPage() {
  try {
    if (
      window.AuthGuard?.ready
    ) {
      await window.AuthGuard
        .ready;
    }

    const currentUser =
      getCurrentUser();

    if (!currentUser) {
      window.location.replace(
        '/login.html'
      );

      return;
    }

    if (
      !isAdmin(currentUser)
    ) {
      showMessage(
        'Bạn không có quyền truy cập trang quản trị.',
        'error'
      );

      window.setTimeout(
        function () {
          window.location.replace(
            '/index.html'
          );
        },
        800
      );

      return;
    }

    setupTableActions();
    setupFilters();
    setupModalEvents();

    await loadAccounts();
  } catch (error) {
    console.error(
      'Lỗi khởi tạo trang quản lý tài khoản:',
      error
    );

    showMessage(
      'Không thể mở trang quản lý tài khoản.',
      'error'
    );
  }
}

initializeAdminUsersPage();