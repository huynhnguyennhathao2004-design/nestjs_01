const destinations = window.destinations || [];
const fallbackImage = '/assets/images/bg-vietnam.jpg';

const params = new URLSearchParams(window.location.search);
const id = params.get('id') || 'da-lat';
const place = destinations.find((item) => item.id === id) || destinations[0];

function getImages(item) {
  if (item.images && item.images.length > 0) return item.images;
  if (item.image) return [item.image];
  return [fallbackImage];
}

function getShortDescription(item) {
  return item.shortDescription || item.description || 'Địa điểm du lịch nổi bật tại Việt Nam.';
}

function getFeatures(item) {
  if (item.features && item.features.length > 0) return item.features;
  if (item.characteristics && item.characteristics.length > 0) return item.characteristics;

  return [
    {
      title: 'Vị trí & khu vực',
      text: `Địa điểm thuộc khu vực ${item.region}, phù hợp để đưa vào hành trình khám phá du lịch Việt Nam.`
    },
    {
      title: 'Loại hình du lịch',
      text: `Nổi bật với loại hình ${item.type}, phù hợp cho du khách yêu thích trải nghiệm, tham quan và chụp ảnh.`
    },
    {
      title: 'Thời điểm gợi ý',
      text: `Thời gian phù hợp để tham quan là ${item.time}, giúp chuyến đi thuận lợi và có nhiều trải nghiệm tốt hơn.`
    }
  ];
}

function getReviewContent(item) {
  if (item.reviewContent) return item.reviewContent;

  return `${item.name} là một địa điểm du lịch đáng chú ý tại Việt Nam. ${item.description} Với đặc trưng thuộc nhóm ${item.type}, nơi đây phù hợp cho du khách muốn tìm hiểu cảnh quan, văn hóa, ẩm thực và những trải nghiệm địa phương. Thời điểm gợi ý để ghé thăm ${item.name} là ${item.time}.`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value || '';
}

function setHtml(id, value) {
  const element = document.getElementById(id);
  if (element) element.innerHTML = value || '';
}

function renderGallery(images) {
  const galleryMain = document.getElementById('galleryMain');
  const galleryThumbs = document.getElementById('galleryThumbs');

  if (!galleryMain || !galleryThumbs) return;

  galleryMain.style.backgroundImage = `url('${images[0]}')`;

  galleryThumbs.innerHTML = images
    .map((image, index) => `
      <button
        class="gallery-thumb ${index === 0 ? 'active' : ''}"
        type="button"
        aria-label="Xem ảnh ${index + 1}"
        style="background-image: url('${image}')"
        data-image="${image}"
      ></button>
    `)
    .join('');

  galleryThumbs.querySelectorAll('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', function () {
      galleryThumbs.querySelectorAll('.gallery-thumb').forEach((item) => item.classList.remove('active'));
      this.classList.add('active');
      galleryMain.style.backgroundImage = `url('${this.dataset.image}')`;
    });
  });
}

function copyPlaceContent(reviewContent) {
  const message = document.getElementById('copyMessage');
  const textForTTS = `${place.name}. ${reviewContent}`;

  navigator.clipboard.writeText(textForTTS)
    .then(() => {
      if (message) message.textContent = 'Đã sao chép nội dung. Bạn có thể dán vào trang tạo giọng đọc.';
    })
    .catch(() => {
      if (message) message.textContent = 'Không sao chép tự động được. Hãy bôi đen đoạn mô tả và copy thủ công.';
    });
}

function renderPlace() {
  if (!place) {
    document.body.innerHTML = `
      <main style="padding:40px;font-family:Arial">
        <h1>Không tìm thấy dữ liệu địa điểm.</h1>
        <p>Hãy kiểm tra lại file destinations-data.js.</p>
        <a href="/index.html">Quay về trang chủ</a>
      </main>
    `;
    return;
  }

  const images = getImages(place);
  const shortDescription = getShortDescription(place);
  const reviewContent = getReviewContent(place);

  document.title = `${place.name} - Vietnam Travel TTS`;

  const hero = document.getElementById('placeHero');
  if (hero) hero.style.backgroundImage = `url('${images[0]}')`;

  setText('breadcrumbName', place.name);
  setText('placeName', place.name);
  setText('placeShortDescription', shortDescription);
  setText('infoTitle', `Khám phá ${place.name}`);
  setText('placeDescription', place.description);
  setText('placeRegion', place.region);
  setText('placeType', place.type);
  setText('placeTime', place.time);
  setText('ttsPreview', reviewContent);

  setHtml('badgeRow', `
    <span class="badge">${place.region}</span>
    <span class="badge">${place.type}</span>
    <span class="badge">${place.time}</span>
  `);

  setHtml('featureList', getFeatures(place)
    .map((item) => `
      <div class="feature-item">
        <strong>${item.title || 'Đặc điểm'}</strong>
        <span>${item.text || item}</span>
      </div>
    `)
    .join(''));

  setHtml('highlightList', (place.highlights || [])
    .map((item) => `<li>${item}</li>`)
    .join(''));

  setHtml('foodList', (place.foods || [])
    .map((item) => `<li>${item}</li>`)
    .join(''));

  renderGallery(images);

  const copyBtn = document.getElementById('copyTextBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copyPlaceContent(reviewContent));
  }
}

renderPlace();
