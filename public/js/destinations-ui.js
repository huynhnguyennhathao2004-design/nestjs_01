const destinationGrid =
  document.getElementById('destinationGrid');

const searchInput =
  document.getElementById('searchInput');

const regionFilter =
  document.getElementById('regionFilter');

const typeFilter =
  document.getElementById('typeFilter');

const clearSearchBtn =
  document.getElementById('clearSearchBtn');

const resultLine =
  document.getElementById('resultLine');

const emptyState =
  document.getElementById('emptyState');


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
      emptyState.style.display = 'block';
    }

    if (resultLine) {
      resultLine.textContent =
        'Không tìm thấy địa điểm phù hợp.';
    }

    return;
  }

  if (emptyState) {
    emptyState.style.display = 'none';
  }

  if (resultLine) {
    resultLine.textContent =
      `Đang hiển thị ${items.length} địa điểm phù hợp.`;
  }

  items.forEach(function (item) {
    const mainImage = getMainImage(item);
    const categories = getCategories(item);

    const categoryTags = categories
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
      document.createElement('article');

    card.className = 'destination-card';
    card.innerHTML = `
      <div
        class="destination-img"
        style="background-image: url('${mainImage}');"
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
            ${item.province || item.region || 'Đang cập nhật'}
          </span>

          <span>
            ${item.time || 'Đang cập nhật'}
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


function filterDestinations() {
  const destinations =
    window.destinations || [];

  const keyword = searchInput
    ? searchInput.value.trim().toLowerCase()
    : '';

  const selectedRegion = regionFilter
    ? regionFilter.value
    : 'all';

  const selectedCategory = typeFilter
    ? typeFilter.value
    : 'all';

  const filtered = destinations.filter(
    function (item) {
      const categories =
        getCategories(item);

      const searchableText = [
        item.name,
        item.province,
        item.description,
        item.shortDescription,
        item.region,
        item.type,
        ...categories
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchKeyword =
        searchableText.includes(keyword);

      const matchRegion =
        selectedRegion === 'all' ||
        item.region === selectedRegion;

      const matchCategory =
        selectedCategory === 'all' ||
        categories.includes(selectedCategory);

      return (
        matchKeyword &&
        matchRegion &&
        matchCategory
      );
    }
  );

  renderDestinations(filtered);
}


if (searchInput) {
  searchInput.addEventListener(
    'input',
    filterDestinations
  );
}


if (regionFilter) {
  regionFilter.addEventListener(
    'change',
    filterDestinations
  );
}


if (typeFilter) {
  typeFilter.addEventListener(
    'change',
    filterDestinations
  );
}


if (clearSearchBtn) {
  clearSearchBtn.addEventListener(
    'click',
    function () {
      if (searchInput) {
        searchInput.value = '';
      }

      if (regionFilter) {
        regionFilter.value = 'all';
      }

      if (typeFilter) {
        typeFilter.value = 'all';
      }

      renderDestinations(
        window.destinations || []
      );
    }
  );
}


renderDestinations(
  window.destinations || []
);