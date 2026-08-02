(function initDestinationsPage() {
  const destinationGrid =
    document.getElementById(
      'destinationGrid'
    );

  const resultLine =
    document.getElementById(
      'resultLine'
    );

  const emptyState =
    document.getElementById(
      'emptyState'
    );

  /*
   * File này chỉ chạy chức năng tải danh sách
   * khi trang có destinationGrid.
   */
  if (!destinationGrid) {
    return;
  }

  /*
   * Giữ biến toàn cục tạm thời để site-navbar.js
   * vẫn có thể sử dụng dữ liệu sau khi API tải xong.
   *
   * Các bước sau sẽ chuyển navbar sang gọi API riêng.
   */


  /**
   * Chuyển dữ liệu thành nội dung an toàn
   * trước khi đưa vào innerHTML.
   */
  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function getMainImage(item) {
    if (
      Array.isArray(item.images) &&
      item.images.length > 0
    ) {
      return item.images[0];
    }

    if (item.image) {
      return item.image;
    }

    return '/assets/images/bg-vietnam.jpg';
  }

  function getCategories(item) {
    if (
      Array.isArray(item.categories) &&
      item.categories.length > 0
    ) {
      return item.categories;
    }

    if (item.type) {
      return [item.type];
    }

    return [];
  }

  function getFilterState() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    return {
      q:
        params.get('q')?.trim() || '',

      region:
        params.get('region')?.trim() ||
        'all',

      category:
        params.get('category')?.trim() ||
        'all'
    };
  }

  /**
   * Tạo URL API dựa trên bộ lọc hiện tại.
   */
  function buildApiUrl(filters) {
    const apiUrl =
      new URL(
        '/api/destinations',
        window.location.origin
      );

    if (filters.q) {
      apiUrl.searchParams.set(
        'q',
        filters.q
      );
    }

    if (
      filters.region &&
      filters.region !== 'all'
    ) {
      apiUrl.searchParams.set(
        'region',
        filters.region
      );
    }

    if (
      filters.category &&
      filters.category !== 'all'
    ) {
      apiUrl.searchParams.set(
        'category',
        filters.category
      );
    }

    return apiUrl;
  }

  function setEmptyState(
    title,
    description
  ) {
    if (!emptyState) {
      return;
    }

    const titleElement =
      emptyState.querySelector('h3');

    const descriptionElement =
      emptyState.querySelector('p');

    if (titleElement) {
      titleElement.textContent = title;
    }

    if (descriptionElement) {
      descriptionElement.textContent =
        description;
    }
  }

  function showLoadingState() {
    destinationGrid.innerHTML = '';

    destinationGrid.setAttribute(
      'aria-busy',
      'true'
    );

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    if (resultLine) {
      resultLine.textContent =
        'Đang tải dữ liệu địa điểm...';
    }
  }

  function showErrorState(error) {
    destinationGrid.innerHTML = '';

    destinationGrid.setAttribute(
      'aria-busy',
      'false'
    );

    if (resultLine) {
      resultLine.textContent =
        'Không thể tải dữ liệu địa điểm.';
    }

    setEmptyState(
      'Không thể kết nối đến máy chủ',
      'Hãy kiểm tra backend, kết nối cơ sở dữ liệu và thử tải lại trang.'
    );

    if (emptyState) {
      emptyState.style.display = 'block';
    }

    console.error(
      '[DESTINATIONS] Lỗi tải dữ liệu:',
      error
    );
  }

  function updateResultLine(
    itemCount,
    filters
  ) {
    if (!resultLine) {
      return;
    }

    const descriptions = [];

    if (filters.q) {
      descriptions.push(
        `từ khóa “${filters.q}”`
      );
    }

    if (
      filters.region !== 'all'
    ) {
      descriptions.push(
        `khu vực ${filters.region}`
      );
    }

    if (
      filters.category !== 'all'
    ) {
      descriptions.push(
        `danh mục ${filters.category}`
      );
    }

    if (descriptions.length > 0) {
      resultLine.textContent =
        `Đang hiển thị ${itemCount} địa điểm theo ` +
        descriptions.join(' và ') +
        '.';

      return;
    }

    resultLine.textContent =
      `Đang hiển thị ${itemCount} địa điểm nổi bật.`;
  }

  function renderDestinations(items) {
    destinationGrid.innerHTML = '';

    destinationGrid.setAttribute(
      'aria-busy',
      'false'
    );

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      setEmptyState(
        'Không tìm thấy địa điểm phù hợp',
        'Hãy thử nhập từ khóa khác hoặc thay đổi khu vực và danh mục.'
      );

      if (emptyState) {
        emptyState.style.display =
          'block';
      }

      return;
    }

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    const cards = items.map(
      function createDestinationCard(
        item
      ) {
        const mainImage =
          getMainImage(item);

        const categories =
          getCategories(item);

        const categoryTags =
          categories
            .slice(0, 2)
            .map(function (category) {
              return `
                <span class="tag">
                  ${escapeHtml(category)}
                </span>
              `;
            })
            .join('');

        const destinationId =
          item.id ||
          item.slug ||
          '';

        const detailUrl =
          '/destinations-detail.html?id=' +
          encodeURIComponent(
            destinationId
          );

        const ttsUrl =
          '/tts.html?id=' +
          encodeURIComponent(
            destinationId
          );

        return `
          <article class="destination-card">
            <div
              class="destination-img media-frame"
            >
              <img
                src="${escapeHtml(mainImage)}"
                alt="${escapeHtml(
                  item.name ||
                  'Địa điểm du lịch'
                )}"
                width="800"
                height="500"
                loading="lazy"
                decoding="async"
                data-fallback="/assets/images/default-place.jpg"
              />

              <div class="tag-row">
                <span class="tag">
                  ${escapeHtml(
                    item.region ||
                    'Chưa xác định'
                  )}
                </span>

                ${categoryTags}
              </div>
            </div>

            <div class="destination-content">
              <h3>
                ${escapeHtml(
                  item.name ||
                  'Địa điểm'
                )}
              </h3>

              <p>
                ${escapeHtml(
                  item.shortDescription ||
                  item.description ||
                  'Thông tin đang được cập nhật.'
                )}
              </p>

              <div class="destination-meta">
                <span>
                  ${escapeHtml(
                    item.province ||
                    item.region ||
                    'Đang cập nhật'
                  )}
                </span>

                <span>
                  ${escapeHtml(
                    item.time ||
                    'Đang cập nhật'
                  )}
                </span>
              </div>

              <div class="card-actions">
                <a
                  class="small-btn"
                  href="${detailUrl}"
                >
                  Xem chi tiết
                </a>

                <a
                  class="small-btn tts-card-btn"
                  href="${ttsUrl}"
                >
                  Tạo giọng đọc
                </a>
              </div>
            </div>
          </article>
        `;
      }
    );

    destinationGrid.innerHTML =
      cards.join('');

    if (window.ImageUtils) {
      window.ImageUtils.scan(
        destinationGrid
      );
    }
  }

  /**
   * Gọi API lấy dữ liệu địa điểm.
   */
  async function loadDestinations() {
    const filters =
      getFilterState();

    const apiUrl =
      buildApiUrl(filters);

    showLoadingState();

    try {
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
        throw new Error(
          `API trả về HTTP ${response.status}.`
        );
      }

      const destinations =
        await response.json();

      if (
        !Array.isArray(destinations)
      ) {
        throw new Error(
          'Dữ liệu API trả về không phải là một mảng.'
        );
      }





      updateResultLine(
        destinations.length,
        filters
      );

      renderDestinations(
        destinations
      );

      /*
       * Phát sự kiện để các file JavaScript khác
       * biết dữ liệu đã tải xong.
       */
      window.dispatchEvent(
        new CustomEvent(
          'destinations:loaded',
          {
            detail: {
              destinations,
              filters
            }
          }
        )
      );
    } catch (error) {
      showErrorState(error);
    }
  }

  loadDestinations();
})();