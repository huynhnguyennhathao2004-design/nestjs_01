const destinationGrid = document.getElementById('destinationGrid');
const searchInput = document.getElementById('searchInput');
const regionFilter = document.getElementById('regionFilter');
const typeFilter = document.getElementById('typeFilter');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const resultLine = document.getElementById('resultLine');
const emptyState = document.getElementById('emptyState');

function getMainImage(item) {
  if (item.images && item.images.length > 0) {
    return item.images[0];
  }

  return '/assets/images/bg-vietnam.jpg';
}

function renderDestinations(items) {
  destinationGrid.innerHTML = '';

  if (items.length === 0) {
    emptyState.style.display = 'block';
    resultLine.textContent = 'Không tìm thấy địa điểm phù hợp.';
    return;
  }

  emptyState.style.display = 'none';
  resultLine.textContent = `Đang hiển thị ${items.length} địa điểm phù hợp.`;

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'destination-card';

    const mainImage = getMainImage(item);

    card.innerHTML = `
      <div 
        class="destination-img review-slide-img"
        data-images='${JSON.stringify(item.images || [mainImage])}'
        data-current="0"
        style="background-image: linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.35)), url('${mainImage}');"
      >
        <div class="tag-row">
          <span class="tag">${item.region}</span>
          <span class="tag">${item.type}</span>
        </div>
      </div>

      <div class="destination-content">
        <h3>${item.name}</h3>
        <p>${item.description}</p>

        <div class="destination-meta">
          <span>Thời điểm gợi ý</span>
          <span>${item.time}</span>
        </div>

        <div class="card-actions">
          <a class="small-btn" href="/destinations-detail.html?id=${item.id}">Xem chi tiết</a>
          <a class="ghost-btn" href="/tss.html">Tạo giọng đọc</a>
        </div>
      </div>
    `;

    destinationGrid.appendChild(card);
  });
}

function filterDestinations() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedRegion = regionFilter.value;
  const selectedType = typeFilter.value;

  const filtered = window.destinations.filter((item) => {
    const matchKeyword =
      item.name.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.region.toLowerCase().includes(keyword) ||
      item.type.toLowerCase().includes(keyword);

    const matchRegion = selectedRegion === 'all' || item.region === selectedRegion;
    const matchType = selectedType === 'all' || item.type === selectedType;

    return matchKeyword && matchRegion && matchType;
  });

  renderDestinations(filtered);
}

searchInput.addEventListener('input', filterDestinations);
regionFilter.addEventListener('change', filterDestinations);
typeFilter.addEventListener('change', filterDestinations);

clearSearchBtn.addEventListener('click', function () {
  searchInput.value = '';
  regionFilter.value = 'all';
  typeFilter.value = 'all';

  renderDestinations(window.destinations);
});

renderDestinations(window.destinations);

setInterval(() => {
  const reviewCards = document.querySelectorAll('.review-slide-img');

  reviewCards.forEach((card) => {
    const images = JSON.parse(card.dataset.images || '[]');

    if (images.length <= 1) return;

    let currentIndex = Number(card.dataset.current || 0);
    let nextIndex = (currentIndex + 1) % images.length;

    card.dataset.current = nextIndex;

    card.style.backgroundImage = `
      linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.35)),
      url('${images[nextIndex]}')
    `;
  });
}, 4000);