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
   TÌM KIẾM ĐỊA ĐIỂM
===================================== */

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


function getDestinationSearchValues(item) {
  const aliases =
    Array.isArray(item.aliases)
      ? item.aliases
      : [];

  return [
    item.name,
    item.id,
    item.province,
    ...aliases
  ]
    .filter(Boolean)
    .map(normalizeSearchText);
}


function findDestinationByKeyword(keyword) {
  const destinations =
    window.destinations || [];

  const normalizedKeyword =
    normalizeSearchText(keyword);

  if (!normalizedKeyword) {
    return null;
  }

  const exactMatch =
    destinations.find(
      function (item) {
        return getDestinationSearchValues(
          item
        ).includes(
          normalizedKeyword
        );
      }
    );

  if (exactMatch) {
    return exactMatch;
  }

  const startMatch =
    destinations.find(
      function (item) {
        return getDestinationSearchValues(
          item
        ).some(function (value) {
          return value.startsWith(
            normalizedKeyword
          );
        });
      }
    );

  if (startMatch) {
    return startMatch;
  }

  return (
    destinations.find(
      function (item) {
        return getDestinationSearchValues(
          item
        ).some(function (value) {
          return value.includes(
            normalizedKeyword
          );
        });
      }
    ) || null
  );
}


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

  if (!form || !input) {
    return;
  }

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

  input.addEventListener(
    'input',
    hideMessage
  );

  form.addEventListener(
    'submit',
    function (event) {
      event.preventDefault();

      const keyword =
        input.value.trim();

      if (!keyword) {
        input.focus();

        showMessage(
          'Hãy nhập tên địa điểm cần tìm.'
        );

        return;
      }

      const destination =
        findDestinationByKeyword(
          keyword
        );

      if (!destination) {
        showMessage(
          `Không tìm thấy địa điểm “${keyword}”.`
        );

        return;
      }

      window.location.href =
        '/destinations-detail.html?id=' +
        encodeURIComponent(
          destination.id
        );
    }
  );
}