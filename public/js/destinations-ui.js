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


function renderDestinations(items) {
  if (!destinationGrid) {
    return;
  }

  destinationGrid.innerHTML = '';

  if (!items || items.length === 0) {
    if (emptyState) {
      emptyState.style.display =
        'block';
    }

    if (resultLine) {
      resultLine.textContent =
        'Không tìm thấy địa điểm phù hợp.';
    }

    return;
  }

  if (emptyState) {
    emptyState.style.display =
      'none';
  }

  items.forEach(function (item) {
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
              ${category}
            </span>
          `;
        })
        .join('');

    const card =
      document.createElement(
        'article'
      );

    card.className =
      'destination-card';

    card.innerHTML = `
      <div
        class="destination-img"
        style="
          background-image:
          url('${mainImage}');
        "
      >
        <div class="tag-row">
          <span class="tag">
            ${item.region || 'Chưa xác định'}
          </span>

          ${categoryTags}
        </div>
      </div>

      <div class="destination-content">
        <h3>
          ${item.name || 'Địa điểm'}
        </h3>

        <p>
          ${
            item.shortDescription ||
            item.description ||
            'Thông tin đang được cập nhật.'
          }
        </p>

        <div class="destination-meta">
          <span>
            ${
              item.province ||
              item.region ||
              'Đang cập nhật'
            }
          </span>

          <span>
            ${
              item.time ||
              'Đang cập nhật'
            }
          </span>
        </div>

        <div class="card-actions">
          <a
            class="small-btn"
            href="/destinations-detail.html?id=${item.id}"
          >
            Xem chi tiết
          </a>

          <a
            class="small-btn tts-card-btn"
            href="/tts.html?id=${item.id}"
          >
            Tạo giọng đọc
          </a>
        </div>
      </div>
    `;

    destinationGrid.appendChild(card);
  });
}


function getFilterState() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  return {
    region:
      params.get('region') || 'all',

    category:
      params.get('category') || 'all'
  };
}


function filterDestinationsFromUrl() {
  const destinations =
    window.destinations || [];

  const filters =
    getFilterState();

  const filtered =
    destinations.filter(
      function (item) {
        const categories =
          getCategories(item);

        const matchRegion =
          filters.region === 'all' ||
          item.region === filters.region;

        const matchCategory =
          filters.category === 'all' ||
          categories.includes(
            filters.category
          );

        return (
          matchRegion &&
          matchCategory
        );
      }
    );

  if (resultLine) {
    const descriptions = [];

    if (filters.region !== 'all') {
      descriptions.push(
        `khu vực ${filters.region}`
      );
    }

    if (filters.category !== 'all') {
      descriptions.push(
        `danh mục ${filters.category}`
      );
    }

    if (descriptions.length > 0) {
      resultLine.textContent =
        `Đang hiển thị ${filtered.length} địa điểm thuộc ` +
        descriptions.join(' và ') +
        '.';
    } else {
      resultLine.textContent =
        `Đang hiển thị ${filtered.length} địa điểm nổi bật.`;
    }
  }

  renderDestinations(filtered);
}


filterDestinationsFromUrl();