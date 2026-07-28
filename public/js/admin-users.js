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

const adminMessage =
  document.getElementById(
    'adminMessage'
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


const DEFAULT_ADMIN = {
  id: 1,
  name: 'Admin',
  email: 'admin@gmail.com',
  password: '123456',
  role: 'ADMIN',
  status: 'ACTIVE',
  provider: 'LOCAL',
  avatar: '',
  createdAt:
    new Date().toISOString()
};


/* =====================================
   ĐỌC VÀ LƯU DỮ LIỆU
===================================== */

function getCurrentUser() {
  const savedUser =
    sessionStorage.getItem('user');

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    sessionStorage.removeItem('user');

    return null;
  }
}


function getAccounts() {
  const savedAccounts =
    localStorage.getItem(
      'travelTtsAccounts'
    );

  if (savedAccounts) {
    try {
      const accounts =
        JSON.parse(savedAccounts);

      if (Array.isArray(accounts)) {
        return accounts;
      }
    } catch (error) {
      localStorage.removeItem(
        'travelTtsAccounts'
      );
    }
  }

  const accounts = [
    DEFAULT_ADMIN
  ];

  saveAccounts(accounts);

  return accounts;
}


function saveAccounts(accounts) {
  localStorage.setItem(
    'travelTtsAccounts',
    JSON.stringify(accounts)
  );
}


/* =====================================
   BẢO VỆ TRANG ADMIN
===================================== */

function protectAdminPage() {
  const currentUser =
    getCurrentUser();

  if (!currentUser) {
    window.location.replace(
      '/login.html'
    );

    return false;
  }

  if (
    String(currentUser.role)
      .toUpperCase() !== 'ADMIN'
  ) {
    window.alert(
      'Bạn không có quyền truy cập trang quản trị.'
    );

    window.location.replace(
      '/index.html'
    );

    return false;
  }

  if (
    String(currentUser.status)
      .toUpperCase() === 'LOCKED'
  ) {
    sessionStorage.removeItem('user');

    window.location.replace(
      '/login.html'
    );

    return false;
  }

  return true;
}


/* =====================================
   HÀM HỖ TRỢ
===================================== */

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(/đ/g, 'd');
}


function getInitial(name) {
  return String(name || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();
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


function isSameAccount(
  firstId,
  secondId
) {
  return (
    String(firstId) ===
    String(secondId)
  );
}


function countAdmins(accounts) {
  return accounts.filter(
    function (account) {
      return (
        String(account.role)
          .toUpperCase() ===
          'ADMIN'
      );
    }
  ).length;
}


function showMessage(
  message,
  type
) {
  if (!adminMessage) {
    return;
  }

  adminMessage.textContent =
    message;

  adminMessage.className =
    `admin-message show ${type}`;

  window.clearTimeout(
    showMessage.timeoutId
  );

  showMessage.timeoutId =
    window.setTimeout(
      function () {
        adminMessage.className =
          'admin-message';

        adminMessage.textContent =
          '';
      },
      3500
    );
}


/* =====================================
   THỐNG KÊ
===================================== */

function updateStatistics(accounts) {
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
          String(account.status)
            .toUpperCase() ===
          'ACTIVE'
        );
      }
    ).length;

  const lockedCount =
    accounts.filter(
      function (account) {
        return (
          String(account.status)
            .toUpperCase() ===
          'LOCKED'
        );
      }
    ).length;

  const adminCount =
    countAdmins(accounts);

  if (totalAccounts) {
    totalAccounts.textContent =
      accounts.length;
  }

  if (activeAccounts) {
    activeAccounts.textContent =
      activeCount;
  }

  if (lockedAccounts) {
    lockedAccounts.textContent =
      lockedCount;
  }

  if (adminAccounts) {
    adminAccounts.textContent =
      adminCount;
  }
}


/* =====================================
   LỌC TÀI KHOẢN
===================================== */

function getFilteredAccounts(
  accounts
) {
  const keyword =
    normalizeText(
      adminSearchInput
        ? adminSearchInput.value
        : ''
    );

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

  return accounts.filter(
    function (account) {
      const searchableText =
        normalizeText(
          [
            account.name,
            account.email,
            account.id
          ].join(' ')
        );

      const matchKeyword =
        !keyword ||
        searchableText.includes(
          keyword
        );

      const accountRole =
        String(
          account.role || 'USER'
        ).toUpperCase();

      const accountStatus =
        String(
          account.status ||
          'ACTIVE'
        ).toUpperCase();

      const accountProvider =
        String(
          account.provider ||
          'LOCAL'
        ).toUpperCase();

      const matchRole =
        selectedRole === 'ALL' ||
        accountRole ===
          selectedRole;

      const matchStatus =
        selectedStatus === 'ALL' ||
        accountStatus ===
          selectedStatus;

      const matchProvider =
        selectedProvider === 'ALL' ||
        accountProvider ===
          selectedProvider;

      return (
        matchKeyword &&
        matchRole &&
        matchStatus &&
        matchProvider
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
          onerror="
            this.parentElement.textContent =
            '${getInitial(account.name)}';
          "
        />
      </div>
    `;
  }

  return `
    <div class="table-avatar">
      ${getInitial(account.name)}
    </div>
  `;
}


function renderAccounts() {
  if (!accountTableBody) {
    return;
  }

  const accounts =
    getAccounts();

  const currentUser =
    getCurrentUser();

  const filteredAccounts =
    getFilteredAccounts(accounts);

  updateStatistics(accounts);

  accountTableBody.innerHTML = '';

  if (
    accountResultLine
  ) {
    accountResultLine.textContent =
      `Đang hiển thị ${filteredAccounts.length} trên ${accounts.length} tài khoản.`;
  }

  if (
    filteredAccounts.length === 0
  ) {
    if (emptyAccounts) {
      emptyAccounts.classList.add(
        'show'
      );
    }

    return;
  }

  if (emptyAccounts) {
    emptyAccounts.classList.remove(
      'show'
    );
  }

  filteredAccounts.forEach(
    function (account) {
      const role =
        String(
          account.role || 'USER'
        ).toUpperCase();

      const status =
        String(
          account.status ||
          'ACTIVE'
        ).toUpperCase();

      const provider =
        String(
          account.provider ||
          'LOCAL'
        ).toUpperCase();

      const isCurrentAccount =
        currentUser &&
        isSameAccount(
          account.id,
          currentUser.id
        );

      const row =
        document.createElement('tr');

      row.innerHTML = `
        <td>
          <div class="account-cell">
            ${createAvatar(account)}

            <div>
              <strong>
                ${escapeHtml(
                  account.name ||
                  'Chưa đặt tên'
                )}
              </strong>

              <span>
                ${escapeHtml(
                  account.email ||
                  'Không có email'
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
              provider === 'GOOGLE'
                ? 'provider-google'
                : 'provider-local'
            }"
          >
            ${
              provider === 'GOOGLE'
                ? 'Google'
                : 'Tài khoản thường'
            }
          </span>
        </td>

        <td>
          <span
            class="account-badge ${
              role === 'ADMIN'
                ? 'role-admin'
                : 'role-user'
            }"
          >
            ${
              role === 'ADMIN'
                ? 'Quản trị viên'
                : 'Người dùng'
            }
          </span>
        </td>

        <td>
          <span
            class="account-badge ${
              status === 'LOCKED'
                ? 'status-locked'
                : 'status-active'
            }"
          >
            ${
              status === 'LOCKED'
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
              class="table-action-btn view-action"
              data-action="view"
              data-account-id="${escapeHtml(
                account.id
              )}"
            >
              Xem
            </button>

            <button
              type="button"
              class="table-action-btn role-action"
              data-action="role"
              data-account-id="${escapeHtml(
                account.id
              )}"
              ${
                isCurrentAccount
                  ? 'disabled'
                  : ''
              }
            >
              ${
                role === 'ADMIN'
                  ? 'Hạ quyền'
                  : 'Cấp Admin'
              }
            </button>

            <button
              type="button"
              class="table-action-btn ${
                status === 'LOCKED'
                  ? 'unlock-action'
                  : 'lock-action'
              }"
              data-action="status"
              data-account-id="${escapeHtml(
                account.id
              )}"
              ${
                isCurrentAccount
                  ? 'disabled'
                  : ''
              }
            >
              ${
                status === 'LOCKED'
                  ? 'Mở khóa'
                  : 'Khóa'
              }
            </button>

            <button
              type="button"
              class="table-action-btn delete-action"
              data-action="delete"
              data-account-id="${escapeHtml(
                account.id
              )}"
              ${
                isCurrentAccount
                  ? 'disabled'
                  : ''
              }
            >
              Xóa
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
   XEM CHI TIẾT
===================================== */

function openAccountModal(account) {
  if (!accountModal || !account) {
    return;
  }

  const role =
    String(
      account.role || 'USER'
    ).toUpperCase();

  const status =
    String(
      account.status || 'ACTIVE'
    ).toUpperCase();

  const provider =
    String(
      account.provider || 'LOCAL'
    ).toUpperCase();

  document.getElementById(
    'modalAvatar'
  ).textContent =
    getInitial(account.name);

  document.getElementById(
    'modalAccountName'
  ).textContent =
    account.name ||
    'Chưa đặt tên';

  document.getElementById(
    'modalAccountEmail'
  ).textContent =
    account.email ||
    'Không có email';

  document.getElementById(
    'modalAccountId'
  ).textContent =
    account.id || '—';

  document.getElementById(
    'modalAccountRole'
  ).textContent =
    role === 'ADMIN'
      ? 'Quản trị viên'
      : 'Người dùng';

  document.getElementById(
    'modalAccountStatus'
  ).textContent =
    status === 'LOCKED'
      ? 'Đã bị khóa'
      : 'Đang hoạt động';

  document.getElementById(
    'modalAccountProvider'
  ).textContent =
    provider === 'GOOGLE'
      ? 'Google'
      : 'Tài khoản thường';

  document.getElementById(
    'modalAccountCreatedAt'
  ).textContent =
    formatDate(
      account.createdAt
    );

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

  document.body.style.overflow = '';
}


/* =====================================
   THAY ĐỔI VAI TRÒ
===================================== */

function changeAccountRole(
  accountId
) {
  const accounts =
    getAccounts();

  const account =
    accounts.find(
      function (item) {
        return isSameAccount(
          item.id,
          accountId
        );
      }
    );

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
      'Bạn không thể tự thay đổi quyền của chính mình.',
      'error'
    );

    return;
  }

  const currentRole =
    String(
      account.role || 'USER'
    ).toUpperCase();

  if (
    currentRole === 'ADMIN' &&
    countAdmins(accounts) <= 1
  ) {
    showMessage(
      'Hệ thống phải có ít nhất một quản trị viên.',
      'error'
    );

    return;
  }

  const newRole =
    currentRole === 'ADMIN'
      ? 'USER'
      : 'ADMIN';

  const confirmation =
    window.confirm(
      newRole === 'ADMIN'
        ? `Cấp quyền quản trị cho ${account.name}?`
        : `Hạ quyền ${account.name} xuống người dùng?`
    );

  if (!confirmation) {
    return;
  }

  account.role = newRole;

  saveAccounts(accounts);
  renderAccounts();

  showMessage(
    newRole === 'ADMIN'
      ? 'Đã cấp quyền quản trị.'
      : 'Đã chuyển tài khoản về quyền người dùng.',
    'success'
  );
}


/* =====================================
   KHÓA HOẶC MỞ KHÓA
===================================== */

function toggleAccountStatus(
  accountId
) {
  const accounts =
    getAccounts();

  const account =
    accounts.find(
      function (item) {
        return isSameAccount(
          item.id,
          accountId
        );
      }
    );

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

  const currentStatus =
    String(
      account.status || 'ACTIVE'
    ).toUpperCase();

  const newStatus =
    currentStatus === 'LOCKED'
      ? 'ACTIVE'
      : 'LOCKED';

  const confirmation =
    window.confirm(
      newStatus === 'LOCKED'
        ? `Khóa tài khoản ${account.name}?`
        : `Mở khóa tài khoản ${account.name}?`
    );

  if (!confirmation) {
    return;
  }

  account.status = newStatus;

  saveAccounts(accounts);
  renderAccounts();

  showMessage(
    newStatus === 'LOCKED'
      ? 'Đã khóa tài khoản.'
      : 'Đã mở khóa tài khoản.',
    'success'
  );
}


/* =====================================
   XÓA TÀI KHOẢN
===================================== */

function deleteAccount(
  accountId
) {
  const accounts =
    getAccounts();

  const currentUser =
    getCurrentUser();

  const account =
    accounts.find(
      function (item) {
        return isSameAccount(
          item.id,
          accountId
        );
      }
    );

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
      'Bạn không thể xóa tài khoản đang đăng nhập.',
      'error'
    );

    return;
  }

  const accountRole =
    String(
      account.role || 'USER'
    ).toUpperCase();

  if (
    accountRole === 'ADMIN' &&
    countAdmins(accounts) <= 1
  ) {
    showMessage(
      'Không thể xóa quản trị viên cuối cùng.',
      'error'
    );

    return;
  }

  const confirmation =
    window.confirm(
      `Bạn có chắc muốn xóa tài khoản ${account.name}?\n\nThao tác này không thể hoàn tác trong bản demo.`
    );

  if (!confirmation) {
    return;
  }

  const updatedAccounts =
    accounts.filter(
      function (item) {
        return !isSameAccount(
          item.id,
          accountId
        );
      }
    );

  saveAccounts(updatedAccounts);
  renderAccounts();

  showMessage(
    'Đã xóa tài khoản.',
    'success'
  );
}


/* =====================================
   XỬ LÝ NÚT TRONG BẢNG
===================================== */

function setupTableActions() {
  if (!accountTableBody) {
    return;
  }

  accountTableBody.addEventListener(
    'click',
    function (event) {
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
        getAccounts().find(
          function (item) {
            return isSameAccount(
              item.id,
              accountId
            );
          }
        );

      if (action === 'view') {
        openAccountModal(account);
      }

      if (action === 'role') {
        changeAccountRole(accountId);
      }

      if (action === 'status') {
        toggleAccountStatus(
          accountId
        );
      }

      if (action === 'delete') {
        deleteAccount(accountId);
      }
    }
  );
}


/* =====================================
   SỰ KIỆN BỘ LỌC
===================================== */

function setupFilters() {
  [
    adminSearchInput,
    roleFilter,
    statusFilter,
    providerFilter
  ].forEach(function (element) {
    if (!element) {
      return;
    }

    const eventName =
      element.tagName === 'INPUT'
        ? 'input'
        : 'change';

    element.addEventListener(
      eventName,
      renderAccounts
    );
  });

  if (resetFilterBtn) {
    resetFilterBtn.addEventListener(
      'click',
      function () {
        if (adminSearchInput) {
          adminSearchInput.value = '';
        }

        if (roleFilter) {
          roleFilter.value = 'ALL';
        }

        if (statusFilter) {
          statusFilter.value = 'ALL';
        }

        if (providerFilter) {
          providerFilter.value =
            'ALL';
        }

        renderAccounts();
      }
    );
  }
}


/* =====================================
   SỰ KIỆN MODAL
===================================== */

function setupModalEvents() {
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener(
      'click',
      closeAccountModal
    );
  }

  if (modalOverlay) {
    modalOverlay.addEventListener(
      'click',
      closeAccountModal
    );
  }

  document.addEventListener(
    'keydown',
    function (event) {
      if (
        event.key === 'Escape'
      ) {
        closeAccountModal();
      }
    }
  );
}


/* =====================================
   KHỞI TẠO
===================================== */

if (protectAdminPage()) {
  setupTableActions();
  setupFilters();
  setupModalEvents();
  renderAccounts();
}