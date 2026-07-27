const destinations =
  window.destinations || [];

const fallbackImage =
  '/assets/images/bg-vietnam.jpg';


const params =
  new URLSearchParams(window.location.search);

const id =
  params.get('id') || 'da-lat';

const place =
  destinations.find(function (item) {
    return item.id === id;
  }) || null;


/* =====================================
   LẤY DỮ LIỆU ĐỊA ĐIỂM
===================================== */

function getImages(item) {
  if (
    Array.isArray(item.images) &&
    item.images.length > 0
  ) {
    return item.images;
  }

  if (item.image) {
    return [item.image];
  }

  return [fallbackImage];
}


function getShortDescription(item) {
  return (
    item.shortDescription ||
    item.description ||
    'Địa điểm du lịch nổi bật tại Việt Nam.'
  );
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


function getFeatures(item) {
  if (
    Array.isArray(item.features) &&
    item.features.length > 0
  ) {
    return item.features;
  }

  if (
    Array.isArray(item.characteristics) &&
    item.characteristics.length > 0
  ) {
    return item.characteristics;
  }

  const categoryText =
    getCategories(item).join(', ') ||
    'chưa phân loại';

  return [
    {
      title: 'Vị trí và khu vực',
      text:
        `Địa điểm thuộc khu vực ${item.region || 'đang cập nhật'}, ` +
        'phù hợp để đưa vào hành trình khám phá du lịch Việt Nam.'
    },
    {
      title: 'Danh mục du lịch',
      text:
        `Địa điểm thuộc các danh mục ${categoryText}, ` +
        'phù hợp cho tham quan và trải nghiệm.'
    },
    {
      title: 'Thời điểm gợi ý',
      text:
        `Thời gian phù hợp để tham quan là ` +
        `${item.time || 'đang cập nhật'}.`
    }
  ];
}


function getReviewContent(item) {
  if (item.reviewContent) {
    return item.reviewContent;
  }

  const categoryText =
    getCategories(item).join(', ') ||
    'chưa phân loại';

  return (
    `${item.name} là một địa điểm du lịch đáng chú ý ` +
    `tại Việt Nam. ${item.description || ''} ` +
    `Địa điểm này thuộc các danh mục ${categoryText}, ` +
    'phù hợp cho du khách muốn tìm hiểu cảnh quan, ' +
    'văn hóa, ẩm thực và những trải nghiệm địa phương. ' +
    `Thời điểm gợi ý để ghé thăm ${item.name} là ` +
    `${item.time || 'đang cập nhật'}.`
  );
}


/* =====================================
   HÀM HỖ TRỢ HTML
===================================== */

function setText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value || '';
  }
}


function setHtml(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.innerHTML =
      value || '';
  }
}


/* =====================================
   THƯ VIỆN HÌNH ẢNH
===================================== */

function renderGallery(images) {
  const galleryMain =
    document.getElementById('galleryMain');

  const galleryThumbs =
    document.getElementById('galleryThumbs');

  if (!galleryMain || !galleryThumbs) {
    return;
  }

  galleryMain.style.backgroundImage =
    `url('${images[0]}')`;

  galleryThumbs.innerHTML = images
    .map(function (image, index) {
      return `
        <button
          class="gallery-thumb ${
            index === 0 ? 'active' : ''
          }"
          type="button"
          aria-label="Xem ảnh ${index + 1}"
          style="background-image: url('${image}')"
          data-image="${image}"
        ></button>
      `;
    })
    .join('');

  const thumbs =
    galleryThumbs.querySelectorAll(
      '.gallery-thumb'
    );

  thumbs.forEach(function (thumb) {
    thumb.addEventListener(
      'click',
      function () {
        thumbs.forEach(function (item) {
          item.classList.remove('active');
        });

        this.classList.add('active');

        galleryMain.style.backgroundImage =
          `url('${this.dataset.image}')`;
      }
    );
  });
}


/* =====================================
   SAO CHÉP NỘI DUNG
===================================== */

function copyPlaceContent(reviewContent) {
  const message =
    document.getElementById('copyMessage');

  navigator.clipboard
    .writeText(reviewContent)
    .then(function () {
      if (message) {
        message.textContent =
          'Đã sao chép nội dung. Bạn có thể dán vào trang tạo giọng đọc.';
      }
    })
    .catch(function () {
      if (message) {
        message.textContent =
          'Không sao chép tự động được. Hãy sao chép nội dung thủ công.';
      }
    });
}


/* =====================================
   BẢN ĐỒ
===================================== */

function renderMap(item) {
  const map =
    document.getElementById('placeMap');

  if (!map || !item) {
    return;
  }

  const mapQuery = [
    item.name,
    item.province,
    'Việt Nam'
  ]
    .filter(Boolean)
    .join(', ');

  map.src =
    'https://www.google.com/maps?q=' +
    encodeURIComponent(mapQuery) +
    '&output=embed';
}


/* =====================================
   ĐỊA ĐIỂM LIÊN QUAN
===================================== */

function calculateRelatedScore(
  currentPlace,
  otherPlace
) {
  let score = 0;

  if (
    currentPlace.region ===
    otherPlace.region
  ) {
    score += 3;
  }

  const currentCategories =
    getCategories(currentPlace);

  const otherCategories =
    getCategories(otherPlace);

  otherCategories.forEach(
    function (category) {
      if (
        currentCategories.includes(category)
      ) {
        score += 1;
      }
    }
  );

  return score;
}


function getRelatedPlaces(currentPlace) {
  return destinations
    .filter(function (item) {
      return item.id !== currentPlace.id;
    })
    .map(function (item) {
      return {
        item: item,
        score: calculateRelatedScore(
          currentPlace,
          item
        )
      };
    })
    .filter(function (entry) {
      return entry.score > 0;
    })
    .sort(function (a, b) {
      return b.score - a.score;
    })
    .slice(0, 3)
    .map(function (entry) {
      return entry.item;
    });
}


function renderRelatedPlaces(
  currentPlace
) {
  const relatedGrid =
    document.getElementById('relatedGrid');

  if (!relatedGrid) {
    return;
  }

  const relatedPlaces =
    getRelatedPlaces(currentPlace);

  if (relatedPlaces.length === 0) {
    relatedGrid.innerHTML = `
      <p class="related-empty">
        Chưa có địa điểm liên quan.
      </p>
    `;

    return;
  }

  relatedGrid.innerHTML =
    relatedPlaces
      .map(function (item) {
        const image =
          getImages(item)[0];

        return `
          <article class="related-card">
            <a
              class="related-image"
              href="/destinations-detail.html?id=${item.id}"
              style="background-image: url('${image}');"
              aria-label="Xem ${item.name}"
            ></a>

            <div class="related-content">
              <span>
                ${item.province || item.region}
              </span>

              <h3>
                ${item.name}
              </h3>

              <p>
                ${
                  item.shortDescription ||
                  item.description ||
                  'Thông tin đang được cập nhật.'
                }
              </p>

              <a
                href="/destinations-detail.html?id=${item.id}"
              >
                Xem chi tiết
              </a>
            </div>
          </article>
        `;
      })
      .join('');
}


/* =====================================
   RENDER TRANG CHI TIẾT
===================================== */

function renderPlace() {
  if (!place) {
    document.body.innerHTML = `
      <main
        style="
          padding: 40px;
          font-family: Arial, sans-serif;
        "
      >
        <h1>
          Không tìm thấy dữ liệu địa điểm.
        </h1>

        <p>
          Hãy kiểm tra lại ID địa điểm hoặc
          file destinations-data.js.
        </p>

        <a href="/index.html">
          Quay về trang chủ
        </a>
      </main>
    `;

    return;
  }

  const images =
    getImages(place);

  const shortDescription =
    getShortDescription(place);

  const reviewContent =
    getReviewContent(place);

  const categories =
    getCategories(place);

  const categoryText =
    categories.join(', ') ||
    'Chưa phân loại';

  document.title =
    `${place.name} - Vietnam Travel TTS`;

  const hero =
    document.getElementById('placeHero');

  if (hero) {
    hero.style.backgroundImage =
      `url('${images[0]}')`;
  }

  setText(
    'breadcrumbName',
    place.name
  );

  setText(
    'placeName',
    place.name
  );

  setText(
    'placeShortDescription',
    shortDescription
  );

  setText(
    'infoTitle',
    `Khám phá ${place.name}`
  );

  setText(
    'placeDescription',
    place.description
  );

  setText(
    'placeProvince',
    place.province || 'Đang cập nhật'
  );

  setText(
    'placeRegion',
    place.region || 'Đang cập nhật'
  );

  setText(
    'placeType',
    categoryText
  );

  setText(
    'placeTime',
    place.time || 'Đang cập nhật'
  );

  setText(
    'ttsPreview',
    reviewContent
  );

  const categoryBadges = categories
    .map(function (category) {
      return `
        <span class="badge">
          ${category}
        </span>
      `;
    })
    .join('');

  setHtml(
    'badgeRow',
    `
      <span class="badge">
        ${place.region || 'Chưa xác định'}
      </span>

      ${categoryBadges}

      <span class="badge">
        ${place.time || 'Đang cập nhật'}
      </span>
    `
  );

  setHtml(
    'featureList',
    getFeatures(place)
      .map(function (item) {
        return `
          <div class="feature-item">
            <strong>
              ${item.title || 'Đặc điểm'}
            </strong>

            <span>
              ${item.text || ''}
            </span>
          </div>
        `;
      })
      .join('')
  );

  // setHtml(
  //   'highlightList',
  //   (place.highlights || [])
  //     .map(function (item) {
  //       return `<li>${item}</li>`;
  //     })
  //     .join('')
  // );

  // setHtml(
  //   'foodList',
  //   (place.foods || [])
  //     .map(function (item) {
  //       return `<li>${item}</li>`;
  //     })
  //     .join('')
  // );

  renderGallery(images);
  renderHighlights(place.highlights);
  renderFoods(place.foods);
  renderMap(place);
  renderRelatedPlaces(place);

  const copyBtn =
    document.getElementById('copyTextBtn');

if (copyBtn) {
    copyBtn.addEventListener(
      'click',
      function () {
        copyPlaceContent(reviewContent);
      }
    );
  }
}

/* =====================================
   Hàm render 
===================================== */
function normalizeHighlight(item) {
  if (typeof item === 'string') {
    return {
      name: item,
      image: fallbackImage,
      description:
        'Thông tin về địa điểm này đang được cập nhật.',
      address: '',
      mapQuery: item
    };
  }

  return {
    name:
      item.name ||
      item.title ||
      'Điểm khám phá',

    image:
      item.image ||
      fallbackImage,

    description:
      item.description ||
      'Thông tin đang được cập nhật.',

    address:
      item.address ||
      '',

    mapQuery:
      item.mapQuery ||
      item.name ||
      item.title ||
      ''
  };
}

function normalizeFood(item) {
  if (typeof item === 'string') {
    return {
      name: item,
      image: fallbackImage,
      description:
        'Thông tin về món ăn này đang được cập nhật.',
      priceRange: '',
      suggestedArea: ''
    };
  }

  return {
    name:
      item.name ||
      item.title ||
      'Món ăn địa phương',

    image:
      item.image ||
      fallbackImage,

    description:
      item.description ||
      'Thông tin đang được cập nhật.',

    priceRange:
      item.priceRange ||
      '',

    suggestedArea:
      item.suggestedArea ||
      ''
  };
}

function renderHighlights(items) {
  const container =
    document.getElementById('highlightGrid');

  if (!container) {
    return;
  }

  const highlights =
    Array.isArray(items)
      ? items.map(normalizeHighlight)
      : [];

  if (highlights.length === 0) {
    container.innerHTML = `
      <p class="detail-empty">
        Chưa có dữ liệu điểm khám phá.
      </p>
    `;

    return;
  }

  container.innerHTML = highlights
    .map(function (item) {
      const mapUrl =
        'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(item.mapQuery);

      return `
        <article class="detail-media-card">
          <div class="detail-media-image">
            <img
              src="${item.image}"
              alt="${item.name}"
              loading="lazy"
              onerror="this.src='${fallbackImage}'"
            />

            <span class="detail-media-label">
              Điểm khám phá
            </span>
          </div>

          <div class="detail-media-content">
            <h3>${item.name}</h3>

            <p>${item.description}</p>

            ${
              item.address
                ? `
                  <div class="detail-media-meta">
                    <strong>Địa chỉ:</strong>
                    <span>${item.address}</span>
                  </div>
                `
                : ''
            }

            <a
              href="${mapUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="detail-media-link"
            >
              Xem trên bản đồ
            </a>
          </div>
        </article>
      `;
    })
    .join('');
  }

  function renderFoods(items) {
  const container =
    document.getElementById('foodGrid');

  if (!container) {
    return;
  }

  const foods =
    Array.isArray(items)
      ? items.map(normalizeFood)
      : [];

  if (foods.length === 0) {
    container.innerHTML = `
      <p class="detail-empty">
        Chưa có dữ liệu ẩm thực.
      </p>
    `;

    return;
  }

  container.innerHTML = foods
    .map(function (item) {
      return `
        <article class="detail-media-card food-card">
          <div class="detail-media-image">
            <img
              src="${item.image}"
              alt="${item.name}"
              loading="lazy"
              onerror="this.src='${fallbackImage}'"
            />

            <span class="detail-media-label">
              Ẩm thực
            </span>
          </div>

          <div class="detail-media-content">
            <h3>${item.name}</h3>

            <p>${item.description}</p>

            ${
              item.priceRange
                ? `
                  <div class="detail-media-meta">
                    <strong>Giá tham khảo:</strong>
                    <span>${item.priceRange}</span>
                  </div>
                `
                : ''
            }

            ${
              item.suggestedArea
                ? `
                  <div class="detail-media-meta">
                    <strong>Khu vực gợi ý:</strong>
                    <span>${item.suggestedArea}</span>
                  </div>
                `
                : ''
            }
          </div>
        </article>
      `;
    })
    .join('');
}

/* =====================================
   TẠO NỘI DUNG CHO TTS
===================================== */

function createTtsReviewContent(item) {
  if (!item) {
    return '';
  }

  const categoryText =
    getCategories(item).join(', ') ||
    'Chưa phân loại';

  const highlights =
    Array.isArray(item.highlights) &&
    item.highlights.length > 0
      ? item.highlights.join(', ')
      : 'Chưa có thông tin';

  const foods =
    Array.isArray(item.foods) &&
    item.foods.length > 0
      ? item.foods.join(', ')
      : 'Chưa có thông tin';

  const features =
    getFeatures(item)
      .map(function (feature) {
        return (
          `${feature.title}: ` +
          `${feature.text}`
        );
      })
      .join('\n');

  return `
${item.name}

${item.description || ''}

Thông tin địa điểm:
- Tỉnh hoặc thành phố: ${item.province || 'Đang cập nhật'}
- Khu vực: ${item.region || 'Đang cập nhật'}
- Danh mục du lịch: ${categoryText}
- Thời điểm nên đi: ${item.time || 'Đang cập nhật'}

Đặc điểm nổi bật:
${features}

Điểm nên khám phá:
${highlights}

Ẩm thực gợi ý:
${foods}
  `.trim();
}


/* =====================================
   XỬ LÝ CÁC NÚT
===================================== */

const quickCopyBtn =
  document.getElementById('quickCopyBtn');

if (quickCopyBtn && place) {
  quickCopyBtn.addEventListener(
    'click',
    function () {
      copyPlaceContent(
        getReviewContent(place)
      );
    }
  );
}


const openTtsButtons = [
  document.getElementById('openTtsBtn'),
  document.getElementById(
    'openTtsPanelBtn'
  )
].filter(Boolean);


if (place) {
  openTtsButtons.forEach(
    function (button) {
      button.addEventListener(
        'click',
        function (event) {
          event.preventDefault();

          const reviewContent =
            createTtsReviewContent(place);

          localStorage.setItem(
            'ttsDraftText',
            reviewContent
          );

          localStorage.setItem(
            'ttsSourceName',
            place.name
          );

          window.location.href =
            `/tts.html?id=${place.id}`;
        }
      );
    }
  );
}

renderPlace();
