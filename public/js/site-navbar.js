(function initSharedNavbar() {
  const navbarMount =
    document.getElementById('siteNavbar');

  if (!navbarMount) {
    return;
  }

  const regions = [
    'Miền Bắc',
    'Miền Trung',
    'Tây Nguyên',
    'Miền Nam'
  ];

  const categories = [
    'Thiên nhiên',
    'Biển đảo',
    'Di sản',
    'Văn hóa - Lịch sử',
    'Ẩm thực',
    'Nghỉ dưỡng',
    'Khám phá',
    'Tâm linh',
    'Đô thị'
  ];

  const currentParams =
    new URLSearchParams(
      window.location.search
    );

  let selectedRegion =
    currentParams.get('region') ||
    'all';

  let selectedCategory =
    currentParams.get('category') ||
    'all';


  function createFilterButtons(
    items,
    filterType,
    selectedValue
  ) {
    const allButton = `
      <button
        type="button"
        class="mega-filter-option ${
          selectedValue === 'all'
            ? 'active'
            : ''
        }"
        data-filter-type="${filterType}"
        data-filter-value="all"
      >
        <span class="mega-arrow">
          ›
        </span>

        <span>
          Tất cả
        </span>
      </button>
    `;

    const itemButtons = items
      .map(function (item) {
        return `
          <button
            type="button"
            class="mega-filter-option ${
              selectedValue === item
                ? 'active'
                : ''
            }"
            data-filter-type="${filterType}"
            data-filter-value="${item}"
          >
            <span class="mega-arrow">
              ›
            </span>

            <span>
              ${item}
            </span>
          </button>
        `;
      })
      .join('');

    return allButton + itemButtons;
  }


  navbarMount.innerHTML = `
    <header class="navbar">
      <a
        class="logo"
        href="/index.html"
      >
        Vietnam
        <span>Travel TTS</span>
      </a>

      <nav class="nav-links">
        <a href="/index.html">
          Trang chủ
        </a>

        <a href="/index.html#features">
          Tính năng
        </a>

        <div class="nav-dropdown">
          <a
            href="/index.html#destinations"
            class="nav-dropdown-trigger"
          >
            Địa điểm

            <span class="dropdown-arrow">
              ▾
            </span>
          </a>

          <div class="nav-dropdown-panel">
            <div class="dropdown-card">
              <div class="mega-menu-heading">
                <div>
                  <strong>
                    Lọc địa điểm
                  </strong>

                  <p>
                    Chọn đồng thời khu vực và
                    danh mục du lịch.
                  </p>
                </div>

                <span class="mega-filter-count">
                  2 bộ lọc
                </span>
              </div>

              <div class="nav-mega-menu">
                <section class="mega-column">
                  <h3>KHU VỰC</h3>

                  <div
                    class="mega-option-list"
                    id="regionOptions"
                  >
                    ${createFilterButtons(
                      regions,
                      'region',
                      selectedRegion
                    )}
                  </div>
                </section>

                <section class="mega-column">
                  <h3>DANH MỤC</h3>

                  <div
                    class="mega-option-list"
                    id="categoryOptions"
                  >
                    ${createFilterButtons(
                      categories,
                      'category',
                      selectedCategory
                    )}
                  </div>
                </section>
              </div>

              <div class="mega-current-filter">
                <div>
                  <span>Khu vực</span>

                  <strong id="selectedRegionText">
                    ${
                      selectedRegion === 'all'
                        ? 'Tất cả'
                        : selectedRegion
                    }
                  </strong>
                </div>

                <div>
                  <span>Danh mục</span>

                  <strong id="selectedCategoryText">
                    ${
                      selectedCategory === 'all'
                        ? 'Tất cả'
                        : selectedCategory
                    }
                  </strong>
                </div>
              </div>

              <div class="mega-actions">
                <button
                  type="button"
                  class="mega-reset-btn"
                  id="resetDestinationFilters"
                >
                  Xóa bộ lọc
                </button>

                <button
                  type="button"
                  class="mega-apply-btn"
                  id="applyDestinationFilters"
                >
                  Áp dụng bộ lọc
                </button>
              </div>
            </div>
          </div>
        </div>

        <a href="/tts.html">
          Tạo giọng đọc
        </a>
      </nav>

      <div class="nav-actions">
        <div class="nav-search-wrap">
          <form
            class="nav-search"
            id="navSearchForm"
            autocomplete="off"
          >
            <button
              type="submit"
              class="search-icon"
              aria-label="Tìm địa điểm"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                ></circle>

                <path
                  d="M20 20L16.2 16.2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                ></path>
              </svg>
            </button>

            <input
              id="searchInput"
              type="text"
              placeholder="Nhập địa điểm rồi nhấn Enter..."
              aria-label="Nhập tên địa điểm"
            />
          </form>

          <div
            class="nav-search-message"
            id="navSearchMessage"
          ></div>
        </div>

        <div
          class="auth-box"
          id="authBox"
        >
          <a
            href="/login.html"
            class="login-btn"
          >
            Đăng nhập
          </a>
        </div>
      </div>
    </header>
  `;

  setupMegaMenuFilters();
  setupDestinationSearch();


  function updateSelectedFilterText() {
    const regionText =
      document.getElementById(
        'selectedRegionText'
      );

    const categoryText =
      document.getElementById(
        'selectedCategoryText'
      );

    if (regionText) {
      regionText.textContent =
        selectedRegion === 'all'
          ? 'Tất cả'
          : selectedRegion;
    }

    if (categoryText) {
      categoryText.textContent =
        selectedCategory === 'all'
          ? 'Tất cả'
          : selectedCategory;
    }
  }


  function updateActiveFilterButtons(
    filterType,
    selectedValue
  ) {
    const buttons =
      document.querySelectorAll(
        `.mega-filter-option[data-filter-type="${filterType}"]`
      );

    buttons.forEach(function (button) {
      const buttonValue =
        button.dataset.filterValue;

      button.classList.toggle(
        'active',
        buttonValue === selectedValue
      );
    });
  }


  function setupMegaMenuFilters() {
    const filterButtons =
      document.querySelectorAll(
        '.mega-filter-option'
      );

    const applyButton =
      document.getElementById(
        'applyDestinationFilters'
      );

    const resetButton =
      document.getElementById(
        'resetDestinationFilters'
      );

    filterButtons.forEach(
      function (button) {
        button.addEventListener(
          'click',
          function () {
            const filterType =
              this.dataset.filterType;

            const filterValue =
              this.dataset.filterValue;

            if (
              filterType === 'region'
            ) {
              selectedRegion =
                filterValue;

              updateActiveFilterButtons(
                'region',
                selectedRegion
              );
            }

            if (
              filterType === 'category'
            ) {
              selectedCategory =
                filterValue;

              updateActiveFilterButtons(
                'category',
                selectedCategory
              );
            }

            updateSelectedFilterText();
          }
        );
      }
    );


    if (resetButton) {
      resetButton.addEventListener(
        'click',
        function () {
          selectedRegion = 'all';
          selectedCategory = 'all';

          updateActiveFilterButtons(
            'region',
            selectedRegion
          );

          updateActiveFilterButtons(
            'category',
            selectedCategory
          );

          updateSelectedFilterText();
        }
      );
    }


    if (applyButton) {
      applyButton.addEventListener(
        'click',
        function () {
          const params =
            new URLSearchParams();

          if (
            selectedRegion !== 'all'
          ) {
            params.set(
              'region',
              selectedRegion
            );
          }

          if (
            selectedCategory !== 'all'
          ) {
            params.set(
              'category',
              selectedCategory
            );
          }

          const query =
            params.toString();

          window.location.href =
            `/index.html${
              query
                ? `?${query}`
                : ''
            }#destinations`;
        }
      );
    }
  }
})();


/* =====================================
   TÌM KIẾM ĐỊA ĐIỂM BẰNG API
===================================== */

/**
 * Chuẩn hóa chuỗi tiếng Việt để so sánh.
 *
 * Ví dụ:
 * "Đà Lạt" -> "da lat"
 * "da-lat" -> "da lat"
 */
function normalizeSearchText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lấy slug hoặc id dùng để mở trang chi tiết.
 */
function getDestinationSlug(destination) {
  return (
    destination?.slug ||
    destination?.id ||
    ''
  );
}

/**
 * Tìm kết quả khớp chính xác theo:
 * - Tên địa điểm
 * - Slug
 * - ID
 */
function findExactDestination(
  destinations,
  keyword
) {
  const normalizedKeyword =
    normalizeSearchText(keyword);

  if (
    !normalizedKeyword ||
    !Array.isArray(destinations)
  ) {
    return null;
  }

  return (
    destinations.find(
      function (destination) {
        const values = [
          destination?.name,
          destination?.slug,
          destination?.id
        ]
          .filter(Boolean)
          .map(normalizeSearchText);

        return values.includes(
          normalizedKeyword
        );
      }
    ) || null
  );
}

/**
 * Gọi API tìm kiếm địa điểm.
 */
async function searchDestinations(
  keyword
) {
  const apiUrl = new URL(
    '/api/destinations',
    window.location.origin
  );

  apiUrl.searchParams.set(
    'q',
    keyword
  );

  const response = await fetch(
    apiUrl.toString(),
    {
      method: 'GET',

      headers: {
        Accept: 'application/json'
      },

      cache: 'no-store'
    }
  );

  if (!response.ok) {
    let errorMessage =
      `API trả về HTTP ${response.status}.`;

    try {
      const body =
        await response.json();

      if (
        typeof body?.message ===
        'string'
      ) {
        errorMessage =
          body.message;
      } else if (
        Array.isArray(body?.message)
      ) {
        errorMessage =
          body.message.join(', ');
      }
    } catch {
      // Giữ thông báo mặc định nếu
      // phản hồi không phải JSON.
    }

    throw new Error(errorMessage);
  }

  const destinations =
    await response.json();

  if (!Array.isArray(destinations)) {
    throw new Error(
      'Dữ liệu tìm kiếm không hợp lệ.'
    );
  }

  return destinations;
}

/**
 * Khởi tạo ô tìm kiếm dùng chung trên Navbar.
 */
function setupDestinationSearch() {
  const form =
    document.getElementById(
      'navSearchForm'
    );

  const input =
    document.getElementById(
      'searchInput'
    );

  const message =
    document.getElementById(
      'navSearchMessage'
    );

  const submitButton =
    form?.querySelector(
      'button[type="submit"]'
    );

  if (!form || !input) {
    return;
  }

  let isSearching = false;

  function showMessage(text) {
    if (!message) {
      return;
    }

    message.textContent = text;
    message.classList.add('show');
  }

  function hideMessage() {
    if (!message) {
      return;
    }

    message.textContent = '';
    message.classList.remove('show');
  }

  function setSearchingState(
    searching
  ) {
    isSearching = searching;

    input.disabled = searching;

    if (submitButton) {
      submitButton.disabled =
        searching;

      submitButton.setAttribute(
        'aria-busy',
        String(searching)
      );
    }
  }

  input.addEventListener(
    'input',
    hideMessage
  );

  form.addEventListener(
    'submit',
    async function (event) {
      event.preventDefault();

      if (isSearching) {
        return;
      }

      const keyword =
        input.value.trim();

      if (!keyword) {
        input.focus();

        showMessage(
          'Hãy nhập tên địa điểm cần tìm.'
        );

        return;
      }

      setSearchingState(true);

      showMessage(
        'Đang tìm kiếm địa điểm...'
      );

      try {
        const destinations =
          await searchDestinations(
            keyword
          );

        if (
          destinations.length === 0
        ) {
          showMessage(
            `Không tìm thấy địa điểm “${keyword}”.`
          );

          return;
        }

        /*
         * Ưu tiên kết quả trùng chính xác.
         *
         * Ví dụ:
         * Nhập "Đà Lạt" sẽ mở ngay Đà Lạt,
         * kể cả API có trả thêm kết quả khác.
         */
        const exactDestination =
          findExactDestination(
            destinations,
            keyword
          );

        if (exactDestination) {
          const destinationSlug =
            getDestinationSlug(
              exactDestination
            );

          if (!destinationSlug) {
            throw new Error(
              'Địa điểm không có slug hợp lệ.'
            );
          }

          window.location.href =
            '/destinations-detail.html?id=' +
            encodeURIComponent(
              destinationSlug
            );

          return;
        }

        /*
         * Nếu API chỉ trả một địa điểm,
         * mở thẳng trang chi tiết.
         */
        if (
          destinations.length === 1
        ) {
          const destinationSlug =
            getDestinationSlug(
              destinations[0]
            );

          if (!destinationSlug) {
            throw new Error(
              'Địa điểm không có slug hợp lệ.'
            );
          }

          window.location.href =
            '/destinations-detail.html?id=' +
            encodeURIComponent(
              destinationSlug
            );

          return;
        }

        /*
         * Nếu có nhiều kết quả,
         * chuyển về danh sách địa điểm
         * và giữ từ khóa trong URL.
         */
        const params =
          new URLSearchParams();

        params.set('q', keyword);

        window.location.href =
          '/index.html?' +
          params.toString() +
          '#destinations';
      } catch (error) {
        console.error(
          '[NAVBAR SEARCH]',
          error
        );

        showMessage(
          error instanceof Error
            ? error.message
            : 'Không thể tìm kiếm địa điểm.'
        );
      } finally {
        setSearchingState(false);
      }
    }
  );
}