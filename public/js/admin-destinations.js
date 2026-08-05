'use strict';

const destinationTableBody =
  document.getElementById(
    'destinationTableBody'
  );

const emptyDestinations =
  document.getElementById(
    'emptyDestinations'
  );

const destinationResultLine =
  document.getElementById(
    'destinationResultLine'
  );

const destinationSearchInput =
  document.getElementById(
    'destinationSearchInput'
  );

const destinationStatusFilter =
  document.getElementById(
    'destinationStatusFilter'
  );

const destinationDeletedFilter =
  document.getElementById(
    'destinationDeletedFilter'
  );

const destinationRegionFilter =
  document.getElementById(
    'destinationRegionFilter'
  );

const destinationCategoryFilter =
  document.getElementById(
    'destinationCategoryFilter'
  );

const resetDestinationFilterBtn =
  document.getElementById(
    'resetDestinationFilterBtn'
  );

const refreshDestinationBtn =
  document.getElementById(
    'refreshDestinationBtn'
  );
const deleteAllTrashedDestinationsBtn =
  document.getElementById(
    'deleteAllTrashedDestinationsBtn'
  );

const previousDestinationPageBtn =
  document.getElementById(
    'previousDestinationPageBtn'
  );

const nextDestinationPageBtn =
  document.getElementById(
    'nextDestinationPageBtn'
  );

const destinationPageInfo =
  document.getElementById(
    'destinationPageInfo'
  );

const destinationState = {
  destinations: [],

  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  },

    loading: false,

    bulkDeleting: false,

    pendingIds: new Set()
};

let destinationSearchTimer = null;

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
  } catch {
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

function formatDate(value) {
  if (!value) {
    return 'Chưa xác định';
  }

  const date = new Date(value);

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

function readResponseData(response) {
  return response
    .json()
    .catch(function () {
      return null;
    });
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
    return responseData.message.join(
      ' '
    );
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
    typeof window.Toast[type] ===
      'function'
  ) {
    window.Toast[type](message);
    return;
  }

  console.log(message);
}

async function confirmAction(
  options
) {
  if (
    window.AppModal &&
    typeof window.AppModal.confirm ===
      'function'
  ) {
    return window.AppModal.confirm(
      options
    );
  }

  console.error(
    '[ADMIN DESTINATIONS] AppModal chưa được tải.'
  );

  showMessage(
    'Không thể mở cửa sổ xác nhận. Hãy tải lại trang.',
    'error'
  );

  return false;
}

function normalizeDestination(source) {
  const destination =
    source || {};

  return {
    id:
      String(
        destination.id || ''
      ),

    slug:
      String(
        destination.slug || ''
      ),

    name:
      String(
        destination.name ||
        'Địa điểm chưa đặt tên'
      ),

    shortDescription:
      String(
        destination.shortDescription ||
        ''
      ),

    status:
      String(
        destination.status ||
        'DRAFT'
      ).toUpperCase(),

    isFeatured:
      Boolean(
        destination.isFeatured
      ),

    publishedAt:
      destination.publishedAt ||
      null,

    createdAt:
      destination.createdAt ||
      null,

    updatedAt:
      destination.updatedAt ||
      null,

    deletedAt:
      destination.deletedAt ||
      null,

    province:
      destination.province ||
      null,

    region:
      destination.region ||
      destination.province?.region ||
      null,

    primaryCategory:
      destination.primaryCategory ||
      null,

    categories:
      Array.isArray(
        destination.categories
      )
        ? destination.categories
        : [],

    coverImage:
      destination.coverImage ||
      null,

    counts:
      destination.counts ||
      {}
  };
}

function getStatusInfo(status) {
  const statusMap = {
    DRAFT: {
      label: 'Bản nháp',
      className:
        'status-draft'
    },

    PUBLISHED: {
      label: 'Đã xuất bản',
      className:
        'status-published'
    },

    HIDDEN: {
      label: 'Đang ẩn',
      className:
        'status-hidden'
    },

    ARCHIVED: {
      label: 'Lưu trữ',
      className:
        'status-archived'
    }
  };

  return (
    statusMap[status] ||
    statusMap.DRAFT
  );
}

async function requestAdminJson(
  url,
  options = {}
) {
  if (
    !window.AuthStore ||
    typeof window.AuthStore
      .authFetch !== 'function'
  ) {
    throw new Error(
      'Thành phần xác thực chưa được tải.'
    );
  }

  const response =
    await window.AuthStore.authFetch(
      url,
      options
    );

  const responseData =
    await readResponseData(
      response
    );

  if (response.status === 401) {
    window.location.replace(
      '/login.html'
    );

    throw new Error(
      'Phiên đăng nhập đã hết hạn.'
    );
  }

  if (response.status === 403) {
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
      800
    );

    throw new Error(
      'Không có quyền quản trị.'
    );
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        responseData,
        'Không thể thực hiện yêu cầu.'
      )
    );
  }

  return responseData;
}

/* =====================================
   THỐNG KÊ VÀ BỘ LỌC
===================================== */

function updateStatisticElement(
  id,
  value
) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      String(value || 0);
  }
}

function populateSelect(
  selectElement,
  defaultLabel,
  items
) {
  if (!selectElement) {
    return;
  }

  const previousValue =
    selectElement.value;

  selectElement.innerHTML = `
    <option value="ALL">
      ${escapeHtml(defaultLabel)}
    </option>
  `;

  items.forEach(
    function (item) {
      const option =
        document.createElement(
          'option'
        );

      option.value =
        item.value;

      option.textContent =
        item.label;

      selectElement.appendChild(
        option
      );
    }
  );

  const hasPreviousValue =
    Array.from(
      selectElement.options
    ).some(
      function (option) {
        return (
          option.value ===
          previousValue
        );
      }
    );

  selectElement.value =
    hasPreviousValue
      ? previousValue
      : 'ALL';
}

async function loadDestinationSummary() {
  try {
    const [
      allResult,
      publishedResult,
      draftResult,
      deletedResult
    ] = await Promise.all([
      requestAdminJson(
        '/api/admin/destinations?deleted=ALL&page=1&limit=100'
      ),

      requestAdminJson(
        '/api/admin/destinations?deleted=ACTIVE&status=PUBLISHED&page=1&limit=1'
      ),

      requestAdminJson(
        '/api/admin/destinations?deleted=ACTIVE&status=DRAFT&page=1&limit=1'
      ),

      requestAdminJson(
        '/api/admin/destinations?deleted=DELETED&page=1&limit=1'
      )
    ]);

    updateStatisticElement(
      'totalDestinations',
      allResult?.pagination
        ?.total || 0
    );

    updateStatisticElement(
      'publishedDestinations',
      publishedResult
        ?.pagination
        ?.total || 0
    );

    updateStatisticElement(
      'draftDestinations',
      draftResult?.pagination
        ?.total || 0
    );

    updateStatisticElement(
      'deletedDestinations',
      deletedResult?.pagination
        ?.total || 0
    );

    const allDestinations =
      Array.isArray(allResult?.data)
        ? allResult.data.map(
            normalizeDestination
          )
        : [];

    const regionMap =
      new Map();

    const categoryMap =
      new Map();

    allDestinations.forEach(
      function (destination) {
        if (
          destination.region?.slug &&
          destination.region?.name
        ) {
          regionMap.set(
            destination.region.slug,
            destination.region.name
          );
        }

        destination.categories.forEach(
          function (category) {
            if (
              category?.slug &&
              category?.name
            ) {
              categoryMap.set(
                category.slug,
                category.name
              );
            }
          }
        );
      }
    );

    const regions =
      Array.from(
        regionMap.entries()
      )
        .map(
          function (entry) {
            return {
              value: entry[0],
              label: entry[1]
            };
          }
        )
        .sort(
          function (first, second) {
            return first.label.localeCompare(
              second.label,
              'vi'
            );
          }
        );

    const categories =
      Array.from(
        categoryMap.entries()
      )
        .map(
          function (entry) {
            return {
              value: entry[0],
              label: entry[1]
            };
          }
        )
        .sort(
          function (first, second) {
            return first.label.localeCompare(
              second.label,
              'vi'
            );
          }
        );

    populateSelect(
      destinationRegionFilter,
      'Tất cả vùng miền',
      regions
    );

    populateSelect(
      destinationCategoryFilter,
      'Tất cả danh mục',
      categories
    );
  } catch (error) {
    console.error(
      'Lỗi tải thống kê địa điểm:',
      error
    );
  }
}

function buildDestinationQuery() {
  const query =
    new URLSearchParams();

  query.set(
    'page',
    String(
      destinationState
        .pagination.page
    )
  );

  query.set(
    'limit',
    String(
      destinationState
        .pagination.limit
    )
  );

  const search =
    destinationSearchInput
      ?.value
      .trim() || '';

  const status =
    destinationStatusFilter
      ?.value || 'ALL';

  const deleted =
    destinationDeletedFilter
      ?.value || 'ACTIVE';

  const region =
    destinationRegionFilter
      ?.value || 'ALL';

  const category =
    destinationCategoryFilter
      ?.value || 'ALL';

  if (search) {
    query.set(
      'search',
      search
    );
  }

  if (status !== 'ALL') {
    query.set(
      'status',
      status
    );
  }

  query.set(
    'deleted',
    deleted
  );

  if (region !== 'ALL') {
    query.set(
      'region',
      region
    );
  }

  if (category !== 'ALL') {
    query.set(
      'category',
      category
    );
  }

  return query;
}

/* =====================================
   HIỂN THỊ BẢNG
===================================== */

function renderLoadingRow() {
  if (!destinationTableBody) {
    return;
  }

  destinationTableBody.innerHTML = `
    <tr class="destination-loading-row">
      <td colspan="7">
        Đang tải danh sách địa điểm...
      </td>
    </tr>
  `;
}

function renderCategoryTags(
  categories
) {
  if (
    !Array.isArray(categories) ||
    categories.length === 0
  ) {
    return `
      <span>
        Chưa có danh mục
      </span>
    `;
  }

  return `
    <div class="destination-category-list">
      ${categories
        .slice(0, 3)
        .map(
          function (category) {
            return `
              <span
                class="destination-category-tag"
              >
                ${escapeHtml(
                  category.name
                )}
              </span>
            `;
          }
        )
        .join('')}

      ${
        categories.length > 3
          ? `
            <span
              class="destination-category-tag"
            >
              +${categories.length - 3}
            </span>
          `
          : ''
      }
    </div>
  `;
}

function renderDestinationActions(
  destination
) {
  const isPending =
    destinationState.pendingIds
      .has(destination.id);

  const destinationSlug =
    String(
      destination.slug || ''
    ).trim();

  /*
   * Tạo URL xem địa điểm từ slug.
   * Không dùng UUID database cho trang public.
   */
  const detailUrl =
    destinationSlug
      ? (
          '/destinations-detail.html?id=' +
          encodeURIComponent(
            destinationSlug
          )
        )
      : '';

  if (destination.deletedAt) {
  return `
    <button
      type="button"
      class="
        destination-action-btn
        destination-restore-btn
      "
      data-action="restore"
      data-destination-id="${escapeHtml(
        destination.id
      )}"
      ${isPending ? 'disabled' : ''}
    >
      ${
        isPending
          ? 'Đang xử lý...'
          : 'Khôi phục'
      }
    </button>

    <button
      type="button"
      class="
        destination-action-btn
        destination-hard-delete-btn
      "
      data-action="hard-delete"
      data-destination-id="${escapeHtml(
        destination.id
      )}"
      ${isPending ? 'disabled' : ''}
    >
      ${
        isPending
          ? 'Đang xử lý...'
          : 'Xóa vĩnh viễn'
      }
    </button>
  `;
}

  const isPublished =
    destination.status ===
    'PUBLISHED';

  return `<a
  class="
    destination-action-link
    destination-edit-link
  "
  href="/admin-destination-editor.html?id=${encodeURIComponent(
    destination.id
  )}"
>
  Chỉnh sửa
</a>
    ${
  isPublished &&
  detailUrl
    ? `
      <a
        class="destination-action-link"
        href="${escapeHtml(
          detailUrl
        )}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Xem
      </a>
    `
    : ''
}

    <button
      type="button"
      class="
        destination-action-btn
        ${
          isPublished
            ? 'destination-hide-btn'
            : 'destination-publish-btn'
        }
      "
      data-action="status"
      data-destination-id="${escapeHtml(
        destination.id
      )}"
      ${isPending ? 'disabled' : ''}
    >
      ${
        isPending
          ? 'Đang xử lý...'
          : isPublished
            ? 'Ẩn'
            : 'Xuất bản'
      }
    </button>

    ${
      isPublished
        ? `
          <button
            type="button"
            class="
              destination-action-btn
              ${
                destination.isFeatured
                  ? 'destination-unfeature-btn'
                  : 'destination-feature-btn'
              }
            "
            data-action="featured"
            data-destination-id="${escapeHtml(
              destination.id
            )}"
            ${isPending ? 'disabled' : ''}
          >
            ${
              destination.isFeatured
                ? 'Bỏ nổi bật'
                : 'Nổi bật'
            }
          </button>
        `
        : ''
    }

    <button
      type="button"
      class="
        destination-action-btn
        destination-delete-btn
      "
      data-action="delete"
      data-destination-id="${escapeHtml(
        destination.id
      )}"
      ${isPending ? 'disabled' : ''}
    >
      Xóa
    </button>
  `;
}

function renderDestinations() {
  if (!destinationTableBody) {
    return;
  }

  destinationTableBody.innerHTML =
    '';

  const destinations =
    destinationState.destinations;

  if (destinationResultLine) {
    destinationResultLine.textContent =
      `Đang hiển thị ` +
      `${destinations.length} trên ` +
      `${destinationState.pagination.total} địa điểm.`;
  }

  if (destinations.length === 0) {
    emptyDestinations?.classList.add(
      'show'
    );

    renderPagination();

    return;
  }

  emptyDestinations?.classList.remove(
    'show'
  );

  destinations.forEach(
    function (destination) {
      const statusInfo =
        getStatusInfo(
          destination.status
        );

      const row =
        document.createElement(
          'tr'
        );

      if (destination.deletedAt) {
        row.classList.add(
          'destination-row-deleted'
        );
      }

      const coverUrl =
        destination.coverImage?.url ||
        '';

      row.innerHTML = `
        <td>
          <div class="destination-cell">
            <div class="destination-cover">
              ${
                coverUrl
                  ? `
                    <img
                      src="${escapeHtml(
                        coverUrl
                      )}"
                      alt="${escapeHtml(
                        destination.coverImage
                          ?.altText ||
                        destination.name
                      )}"
                      loading="lazy"
                      data-fallback="/assets/images/bg-vietnam.jpg"
                    />
                  `
                  : `
                    <div
                      class="destination-cover-placeholder"
                    >
                      📍
                    </div>
                  `
              }
            </div>

            <div
              class="destination-cell-content"
            >
              <strong>
                ${escapeHtml(
                  destination.name
                )}
              </strong>

              <span>
                ${escapeHtml(
                  destination.slug
                )}
              </span>

              <small>
                ${
                  destination.deletedAt
                    ? `Đã xóa: ${escapeHtml(
                        formatDate(
                          destination.deletedAt
                        )
                      )}`
                    : escapeHtml(
                        destination
                          .shortDescription ||
                        'Chưa có mô tả ngắn'
                      )
                }
              </small>
            </div>
          </div>
        </td>

        <td>
          <div class="destination-location">
            <strong>
              ${escapeHtml(
                destination.province
                  ?.name ||
                'Chưa xác định'
              )}
            </strong>

            <span>
              ${escapeHtml(
                destination.region
                  ?.name ||
                'Chưa xác định'
              )}
            </span>
          </div>
        </td>

        <td>
          <div
            class="destination-category-cell"
          >
            <strong>
              ${escapeHtml(
                destination
                  .primaryCategory
                  ?.name ||
                'Chưa có'
              )}
            </strong>

            ${renderCategoryTags(
              destination.categories
            )}
          </div>
        </td>

        <td>
          <span
            class="
              destination-status
              ${statusInfo.className}
            "
          >
            ${statusInfo.label}
          </span>
        </td>

        <td>
          <span
            class="
              destination-featured-badge
              ${
                destination.isFeatured
                  ? ''
                  : 'not-featured'
              }
            "
          >
            ${
              destination.isFeatured
                ? '★ Nổi bật'
                : 'Không'
            }
          </span>
        </td>

        <td>
          ${escapeHtml(
            formatDate(
              destination.updatedAt
            )
          )}
        </td>

        <td>
          <div class="destination-actions">
            ${renderDestinationActions(
              destination
            )}
          </div>
        </td>
      `;

      destinationTableBody
        .appendChild(row);
    }
  );

  window.ImageUtils?.scan(
    destinationTableBody
  );

  renderPagination();
}

function renderPagination() {
  const pagination =
    destinationState.pagination;

  if (destinationPageInfo) {
    destinationPageInfo.textContent =
      `Trang ${pagination.page} / ` +
      `${pagination.totalPages}`;
  }

  if (previousDestinationPageBtn) {
    previousDestinationPageBtn.disabled =
      destinationState.loading ||
      !pagination.hasPreviousPage;
  }

  if (nextDestinationPageBtn) {
    nextDestinationPageBtn.disabled =
      destinationState.loading ||
      !pagination.hasNextPage;
  }
}

/* =====================================
   TẢI DANH SÁCH
===================================== */

function setDestinationLoading(
  isLoading
) {
  destinationState.loading =
    isLoading;

  if (refreshDestinationBtn) {
    refreshDestinationBtn.disabled =
      isLoading;

    refreshDestinationBtn.textContent =
      isLoading
        ? 'Đang tải...'
        : 'Làm mới';
  }

  if (isLoading) {
    if (destinationResultLine) {
      destinationResultLine.textContent =
        'Đang tải danh sách địa điểm...';
    }

    renderLoadingRow();
  }

  renderPagination();
}

function updateDeleteAllDestinationsButton() {
  if (
    !deleteAllTrashedDestinationsBtn
  ) {
    return;
  }

  const isTrashView =
    destinationDeletedFilter
      ?.value === 'DELETED';

  const total =
    Number(
      destinationState
        .pagination
        .total
    ) || 0;

  deleteAllTrashedDestinationsBtn.hidden =
    !isTrashView;

  deleteAllTrashedDestinationsBtn.disabled =
    destinationState.loading ||
    destinationState.bulkDeleting ||
    total === 0;

  deleteAllTrashedDestinationsBtn.textContent =
    destinationState.bulkDeleting
      ? 'Đang xóa...'
      : 'Xóa tất cả';
}

async function loadDestinations() {
  setDestinationLoading(true);

  try {
    const query =
      buildDestinationQuery();

    const result =
      await requestAdminJson(
        `/api/admin/destinations?${query.toString()}`
      );

    if (
      !result ||
      !Array.isArray(result.data)
    ) {
      throw new Error(
        'Backend không trả về danh sách địa điểm hợp lệ.'
      );
    }

    destinationState.destinations =
      result.data.map(
        normalizeDestination
      );

    destinationState.pagination = {
      page:
        result.pagination?.page ||
        1,

      limit:
        result.pagination?.limit ||
        10,

      total:
        result.pagination?.total ||
        0,

      totalPages:
        result.pagination
          ?.totalPages ||
        1,

      hasPreviousPage:
        Boolean(
          result.pagination
            ?.hasPreviousPage
        ),

      hasNextPage:
        Boolean(
          result.pagination
            ?.hasNextPage
        )
    };

    renderDestinations();
  } catch (error) {
    console.error(
      'Lỗi tải danh sách địa điểm:',
      error
    );

    destinationState.destinations =
      [];

    destinationState.pagination = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    };

    renderDestinations();

    showMessage(
      error instanceof Error
        ? error.message
        : 'Không thể tải danh sách địa điểm.',
      'error'
    );
  } finally {
    setDestinationLoading(false);
    updateDeleteAllDestinationsButton();
    renderDestinations();
  }
}

/* =====================================
   THAO TÁC
===================================== */

function findDestination(
  destinationId
) {
  return (
    destinationState.destinations.find(
      function (destination) {
        return (
          destination.id ===
          destinationId
        );
      }
    ) ||
    null
  );
}

async function runPendingAction(
  destinationId,
  callback
) {
  if (
    destinationState.pendingIds.has(
      destinationId
    )
  ) {
    return;
  }

  destinationState.pendingIds.add(
    destinationId
  );

  renderDestinations();

  try {
    await callback();
  } finally {
    destinationState.pendingIds.delete(
      destinationId
    );

    renderDestinations();
  }
}

async function toggleDestinationStatus(
  destination
) {
  const nextStatus =
    destination.status ===
    'PUBLISHED'
      ? 'HIDDEN'
      : 'PUBLISHED';

  const confirmed =
    await confirmAction({
      type:
        nextStatus === 'PUBLISHED'
          ? 'success'
          : 'warning',

      title:
        nextStatus === 'PUBLISHED'
          ? 'Xuất bản địa điểm'
          : 'Ẩn địa điểm',

      message:
        nextStatus === 'PUBLISHED'
          ? `Địa điểm "${destination.name}" sẽ xuất hiện trên website.`
          : `Địa điểm "${destination.name}" sẽ bị ẩn khỏi website.`,

      confirmText:
        nextStatus === 'PUBLISHED'
          ? 'Xuất bản'
          : 'Ẩn địa điểm',

      cancelText: 'Hủy'
    });

  if (!confirmed) {
    return;
  }

  await runPendingAction(
    destination.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destination.id
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
              status: nextStatus
            })
          }
        );

      showMessage(
        result?.message ||
        'Cập nhật trạng thái thành công.',
        'success'
      );

      await Promise.all([
        loadDestinations(),
        loadDestinationSummary()
      ]);
    }
  );
}

async function toggleDestinationFeatured(
  destination
) {
  const nextFeatured =
    !destination.isFeatured;

  const confirmed =
    await confirmAction({
      type: 'info',

      title:
        nextFeatured
          ? 'Đánh dấu nổi bật'
          : 'Bỏ đánh dấu nổi bật',

      message:
        nextFeatured
          ? `Địa điểm "${destination.name}" sẽ được ưu tiên hiển thị.`
          : `Địa điểm "${destination.name}" sẽ không còn được ưu tiên hiển thị.`,

      confirmText:
        nextFeatured
          ? 'Đánh dấu nổi bật'
          : 'Bỏ nổi bật',

      cancelText: 'Hủy'
    });

  if (!confirmed) {
    return;
  }

  await runPendingAction(
    destination.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destination.id
          )}/featured`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json'
            },

            body: JSON.stringify({
              isFeatured:
                nextFeatured
            })
          }
        );

      showMessage(
        result?.message ||
        'Cập nhật trạng thái nổi bật thành công.',
        'success'
      );

      await loadDestinations();
    }
  );
}

async function deleteDestination(
  destination
) {
  const confirmed =
    await confirmAction({
      type: 'danger',

      title:
        'Chuyển vào thùng rác',

      message:
        `Địa điểm "${destination.name}" sẽ bị ẩn khỏi website và chuyển vào thùng rác.`,

      confirmText:
        'Chuyển vào thùng rác',

      cancelText:
        'Hủy'
    });

  if (!confirmed) {
    return;
  }

  await runPendingAction(
    destination.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destination.id
          )}`,
          {
            method: 'DELETE',

            headers: {
              Accept:
                'application/json'
            }
          }
        );

      showMessage(
        result?.message ||
        'Đã chuyển địa điểm vào thùng rác.',
        'success'
      );

      await Promise.all([
        loadDestinations(),
        loadDestinationSummary()
      ]);
    }
  );
}

async function restoreDestination(
  destination
) {
  const confirmed =
    await confirmAction({
      type: 'success',

      title:
        'Khôi phục địa điểm',

      message:
        `Địa điểm "${destination.name}" sẽ được khôi phục về trạng thái bản nháp.`,

      confirmText:
        'Khôi phục',

      cancelText:
        'Hủy'
    });

  if (!confirmed) {
    return;
  }

  await runPendingAction(
    destination.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destination.id
          )}/restore`,
          {
            method: 'PATCH',

            headers: {
              Accept:
                'application/json'
            }
          }
        );

      showMessage(
        result?.message ||
        'Khôi phục địa điểm thành công.',
        'success'
      );

      await Promise.all([
        loadDestinations(),
        loadDestinationSummary()
      ]);
    }
  );
}
async function hardDeleteDestination(
  destination
) {
  const confirmed =
    await confirmAction({
      type:
        'danger',

      title:
        'Xóa vĩnh viễn địa điểm',

      message:
        `Địa điểm "${destination.name}" cùng ảnh, đặc điểm, điểm khám phá và món ăn liên quan sẽ bị xóa khỏi cơ sở dữ liệu. Thao tác này không thể hoàn tác.`,

      confirmText:
        'Xóa vĩnh viễn',

      cancelText:
        'Hủy'
    });

  if (!confirmed) {
    return;
  }



  await runPendingAction(
    destination.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destination.id
          )}/permanent`,
          {
            method:
              'DELETE',

            headers: {
              Accept:
                'application/json'
            }
          }
        );

      showMessage(
        result?.message ||
        'Đã xóa vĩnh viễn địa điểm.',
        'success'
      );

      await Promise.all([
        loadDestinations(),
        loadDestinationSummary()
      ]);
    }
  );
}

/* =====================================
   SỰ KIỆN
===================================== */

function setupDestinationTableEvents() {
  destinationTableBody
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

        const destinationId =
          button.dataset
            .destinationId;

        const destination =
          findDestination(
            destinationId
          );

        if (!destination) {
          showMessage(
            'Không tìm thấy địa điểm.',
            'error'
          );

          return;
        }

        try {
          if (action === 'status') {
            await toggleDestinationStatus(
              destination
            );
          }

          if (action === 'featured') {
            await toggleDestinationFeatured(
              destination
            );
          }

          if (action === 'delete') {
            await deleteDestination(
              destination
            );
          }

          if (action === 'restore') {
            await restoreDestination(
              destination
            );
          }
          if (action === 'hard-delete') {
              await hardDeleteDestination(
                destination
              );
            }
        } catch (error) {
          console.error(
            'Lỗi thao tác địa điểm:',
            error
          );

          showMessage(
            error instanceof Error
              ? error.message
              : 'Không thể thực hiện thao tác.',
            'error'
          );
        }
      }
    );
}

async function deleteAllTrashedDestinations() {
  const isTrashView =
    destinationDeletedFilter
      ?.value === 'DELETED';

  if (!isTrashView) {
    return;
  }

  const total =
    Number(
      destinationState
        .pagination
        .total
    ) || 0;

  if (total <= 0) {
    showMessage(
      'Thùng rác địa điểm đang trống.',
      'info'
    );

    updateDeleteAllDestinationsButton();

    return;
  }

  const confirmed =
    await confirmAction({
      type:
        'danger',

      title:
        'Xóa toàn bộ thùng rác',

      message:
        `Toàn bộ ${total} địa điểm trong thùng rác cùng hình ảnh và dữ liệu liên quan sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.`,

      confirmText:
        'Xóa tất cả',

      cancelText:
        'Hủy'
    });

  if (!confirmed) {
    return;
  }

  destinationState.bulkDeleting =
    true;

  updateDeleteAllDestinationsButton();

  try {
    const result =
      await requestAdminJson(
        '/api/admin/destinations/trash/permanent',
        {
          method:
            'DELETE',

          headers: {
            Accept:
              'application/json'
          }
        }
      );

    showMessage(
      result?.message ||
        'Đã xóa toàn bộ địa điểm trong thùng rác.',

      result?.success === false
        ? 'error'
        : 'success'
    );

    destinationState
      .pagination
      .page = 1;

    await Promise.all([
      loadDestinations(),
      loadDestinationSummary()
    ]);
  } catch (error) {
    console.error(
      'Lỗi xóa toàn bộ thùng rác địa điểm:',
      error
    );

    showMessage(
      error instanceof Error
        ? error.message
        : 'Không thể xóa toàn bộ thùng rác địa điểm.',
      'error'
    );
  } finally {
    destinationState.bulkDeleting =
      false;

    updateDeleteAllDestinationsButton();
  }
}

function setupDestinationFilters() {
  destinationSearchInput
    ?.addEventListener(
      'input',
      function () {
        window.clearTimeout(
          destinationSearchTimer
        );

        destinationSearchTimer =
          window.setTimeout(
            function () {
              destinationState
                .pagination
                .page = 1;

              loadDestinations();
            },
            450
          );
      }
    );

  [
    destinationStatusFilter,
    destinationDeletedFilter,
    destinationRegionFilter,
    destinationCategoryFilter
  ].forEach(
    function (element) {
      element?.addEventListener(
        'change',
        function () {
          destinationState
            .pagination
            .page = 1;

          loadDestinations();
        }
      );
    }
  );

  resetDestinationFilterBtn
    ?.addEventListener(
      'click',
      async function () {
        if (destinationSearchInput) {
          destinationSearchInput.value =
            '';
        }

        if (destinationStatusFilter) {
          destinationStatusFilter.value =
            'ALL';
        }

        if (destinationDeletedFilter) {
          destinationDeletedFilter.value =
            'ACTIVE';
        }

        if (destinationRegionFilter) {
          destinationRegionFilter.value =
            'ALL';
        }

        if (destinationCategoryFilter) {
          destinationCategoryFilter.value =
            'ALL';
        }

        destinationState
          .pagination
          .page = 1;

        await loadDestinations();
      }
    );

  refreshDestinationBtn
    ?.addEventListener(
      'click',
      async function () {
        await Promise.all([
          loadDestinations(),
          loadDestinationSummary()
        ]);
      }
    );
    deleteAllTrashedDestinationsBtn
      ?.addEventListener(
        'click',
        deleteAllTrashedDestinations
      );
}

function setupDestinationPagination() {
  previousDestinationPageBtn
    ?.addEventListener(
      'click',
      async function () {
        if (
          !destinationState
            .pagination
            .hasPreviousPage
        ) {
          return;
        }

        destinationState
          .pagination
          .page -= 1;

        await loadDestinations();

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    );

  nextDestinationPageBtn
    ?.addEventListener(
      'click',
      async function () {
        if (
          !destinationState
            .pagination
            .hasNextPage
        ) {
          return;
        }

        destinationState
          .pagination
          .page += 1;

        await loadDestinations();

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    );
}

/* =====================================
   KHỞI TẠO
===================================== */

async function initializeAdminDestinationsPage() {
  try {
    if (window.AuthGuard?.ready) {
      await window.AuthGuard.ready;
    }

    const currentUser =
      getCurrentUser();

    if (!currentUser) {
      window.location.replace(
        '/login.html'
      );

      return;
    }

    if (!isAdmin(currentUser)) {
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

    setupDestinationTableEvents();
    setupDestinationFilters();
    setupDestinationPagination();

    await loadDestinationSummary();
    await loadDestinations();
  } catch (error) {
    console.error(
      'Lỗi khởi tạo trang quản lý địa điểm:',
      error
    );

    showMessage(
      error instanceof Error
        ? error.message
        : 'Không thể mở trang quản lý địa điểm.',
      'error'
    );
  }
}

initializeAdminDestinationsPage();