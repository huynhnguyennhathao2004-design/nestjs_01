(function initDestinationDetailPage() {
  'use strict';

  const fallbackImage = '/assets/images/bg-vietnam.jpg';
  const params = new URLSearchParams(window.location.search);
  const slug = (params.get('id') || params.get('slug') || '').trim();

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function safeImageUrl(value) {
    const url = String(value || '').trim();

    if (
      url.startsWith('/') ||
      url.startsWith('https://') ||
      url.startsWith('http://')
    ) {
      return url;
    }

    return fallbackImage;
  }

  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value ?? '';
    }
  }

  function getImages(place) {
    if (
      Array.isArray(place.images) &&
      place.images.length > 0
    ) {
      return place.images.map(safeImageUrl);
    }

    return [fallbackImage];
  }

  function getCategories(place) {
    if (
      Array.isArray(place.categories) &&
      place.categories.length > 0
    ) {
      return place.categories;
    }

    return place.type ? [place.type] : [];
  }

  function showLoadingState() {
    setText('breadcrumbName', 'Đang tải...');
    setText('placeName', 'Đang tải địa điểm...');
    setText(
      'placeShortDescription',
      'Vui lòng chờ trong giây lát.'
    );
    setText('placeProvince', 'Đang tải');
    setText('placeRegion', 'Đang tải');
    setText('placeType', 'Đang tải');
    setText('placeTime', 'Đang tải');
    setText(
      'placeDescription',
      'Đang tải nội dung địa điểm...'
    );
  }

  function showErrorState(message) {
    const page = document.querySelector('.place-page');

    if (!page) {
      return;
    }

    page.innerHTML = `
      <section
        style="
          padding: 140px 24px 80px;
          text-align: center;
        "
      >
        <h1>Không thể tải địa điểm</h1>

        <p>
          ${escapeHtml(message)}
        </p>

        <a href="/index.html#destinations">
          Quay về danh sách địa điểm
        </a>
      </section>
    `;
  }

  async function fetchJson(url) {
    const response = await fetch(url, {
      method: 'GET',

      headers: {
        Accept: 'application/json'
      },

      cache: 'no-store'
    });

    if (!response.ok) {
      let message =
        `API trả về HTTP ${response.status}.`;

      try {
        const body = await response.json();

        if (
          typeof body?.message === 'string'
        ) {
          message = body.message;
        } else if (
          Array.isArray(body?.message)
        ) {
          message = body.message.join(', ');
        }
      } catch {
        // Giữ thông báo mặc định nếu response
        // không phải JSON.
      }

      throw new Error(message);
    }

    return response.json();
  }

  function renderBadges(place) {
    const badgeRow =
      document.getElementById('badgeRow');

    if (!badgeRow) {
      return;
    }

    const badges = [
      place.region,
      ...getCategories(place),
      place.time
    ].filter(Boolean);

    badgeRow.innerHTML = badges
      .map(
        (badge) => `
          <span class="badge">
            ${escapeHtml(badge)}
          </span>
        `
      )
      .join('');
  }

  function renderGallery(place) {
    const galleryMain =
      document.getElementById('galleryMain');

    const galleryThumbs =
      document.getElementById('galleryThumbs');

    if (
      !galleryMain ||
      !galleryThumbs
    ) {
      return;
    }

    const images = getImages(place);

    function selectImage(
      image,
      selectedButton
    ) {
      galleryMain.style.backgroundImage =
        `url("${safeImageUrl(image)}")`;

      galleryThumbs
        .querySelectorAll('.gallery-thumb')
        .forEach((button) => {
          button.classList.remove('active');
        });

      selectedButton?.classList.add('active');
    }

    galleryThumbs.innerHTML = images
      .map(
        (image, index) => `
          <button
            type="button"
            class="gallery-thumb${
              index === 0 ? ' active' : ''
            }"
            aria-label="Xem ảnh ${
              index + 1
            } của ${escapeHtml(place.name)}"
            data-image-index="${index}"
            style="
              background-image:
                url(&quot;${escapeHtml(
                  image
                )}&quot;);
            "
          ></button>
        `
      )
      .join('');

    selectImage(
      images[0],
      galleryThumbs.querySelector(
        '.gallery-thumb'
      )
    );

    galleryThumbs.addEventListener(
      'click',
      (event) => {
        const button =
          event.target.closest(
            '.gallery-thumb'
          );

        if (!button) {
          return;
        }

        const index = Number(
          button.dataset.imageIndex
        );

        const image = images[index];

        if (image) {
          selectImage(
            image,
            button
          );
        }
      }
    );
  }

  function renderFeatures(features) {
    const container =
      document.getElementById(
        'featureList'
      );

    if (!container) {
      return;
    }

    if (
      !Array.isArray(features) ||
      features.length === 0
    ) {
      container.innerHTML = `
        <p class="detail-empty">
          Chưa có dữ liệu đặc điểm nổi bật.
        </p>
      `;

      return;
    }

    container.innerHTML = features
      .map(
        (feature) => `
          <div class="feature-item">
            <strong>
              ${escapeHtml(
                feature.title ||
                'Đặc điểm'
              )}
            </strong>

            <span>
              ${escapeHtml(
                feature.text || ''
              )}
            </span>
          </div>
        `
      )
      .join('');
  }

  function renderHighlights(items) {
    const container =
      document.getElementById(
        'highlightGrid'
      );

    if (!container) {
      return;
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      container.innerHTML = `
        <p class="detail-empty">
          Chưa có dữ liệu điểm khám phá.
        </p>
      `;

      return;
    }

    container.innerHTML = items
      .map((item) => {
        const image =
          safeImageUrl(item.image);

        const mapQuery =
          item.mapQuery ||
          item.address ||
          item.name ||
          '';

        const mapUrl =
          'https://www.google.com/maps/search/' +
          '?api=1&query=' +
          encodeURIComponent(mapQuery);

        return `
          <article class="detail-media-card">
            <div
              class="
                detail-media-image
                media-frame
              "
            >
              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(
                  item.imageAlt ||
                  item.name ||
                  'Điểm khám phá'
                )}"
                width="800"
                height="500"
                loading="lazy"
                decoding="async"
                data-fallback="${fallbackImage}"
              />

              <span
                class="detail-media-label"
              >
                Điểm khám phá
              </span>
            </div>

            <div
              class="detail-media-content"
            >
              <h3>
                ${escapeHtml(
                  item.name ||
                  'Điểm khám phá'
                )}
              </h3>

              <p>
                ${escapeHtml(
                  item.description ||
                  'Thông tin đang được cập nhật.'
                )}
              </p>

              ${
                item.address
                  ? `
                    <div
                      class="detail-media-meta"
                    >
                      <strong>
                        Địa chỉ:
                      </strong>

                      <span>
                        ${escapeHtml(
                          item.address
                        )}
                      </span>
                    </div>
                  `
                  : ''
              }

              <a
                href="${escapeHtml(mapUrl)}"
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

    window.ImageUtils?.scan(container);
  }

  function formatFoodPrice(food) {
    if (food.priceRange) {
      return food.priceRange;
    }

    const formatNumber = (value) =>
      typeof value === 'number'
        ? new Intl.NumberFormat(
            'vi-VN'
          ).format(value)
        : '';

    if (
      typeof food.priceMin ===
        'number' &&
      typeof food.priceMax ===
        'number'
    ) {
      return (
        `${formatNumber(food.priceMin)}` +
        ` - ` +
        `${formatNumber(food.priceMax)}` +
        ` đồng`
      );
    }

    if (
      typeof food.priceMin ===
      'number'
    ) {
      return (
        `Từ ` +
        `${formatNumber(food.priceMin)}` +
        ` đồng`
      );
    }

    if (
      typeof food.priceMax ===
      'number'
    ) {
      return (
        `Đến ` +
        `${formatNumber(food.priceMax)}` +
        ` đồng`
      );
    }

    return '';
  }

  function renderFoods(items) {
    const container =
      document.getElementById(
        'foodGrid'
      );

    if (!container) {
      return;
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      container.innerHTML = `
        <p class="detail-empty">
          Chưa có dữ liệu ẩm thực.
        </p>
      `;

      return;
    }

    container.innerHTML = items
      .map((food) => {
        const price =
          formatFoodPrice(food);

        const image =
          safeImageUrl(food.image);

        return `
          <article
            class="
              detail-media-card
              food-card
            "
          >
            <div
              class="
                detail-media-image
                media-frame
              "
            >
              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(
                  food.imageAlt ||
                  food.name ||
                  'Ẩm thực địa phương'
                )}"
                width="800"
                height="500"
                loading="lazy"
                decoding="async"
                data-fallback="${fallbackImage}"
              />

              <span
                class="detail-media-label"
              >
                Ẩm thực
              </span>
            </div>

            <div
              class="detail-media-content"
            >
              <h3>
                ${escapeHtml(
                  food.name ||
                  'Món ăn địa phương'
                )}
              </h3>

              <p>
                ${escapeHtml(
                  food.description ||
                  'Thông tin đang được cập nhật.'
                )}
              </p>

              ${
                price
                  ? `
                    <div
                      class="detail-media-meta"
                    >
                      <strong>
                        Giá tham khảo:
                      </strong>

                      <span>
                        ${escapeHtml(price)}
                      </span>
                    </div>
                  `
                  : ''
              }

              ${
                food.suggestedArea
                  ? `
                    <div
                      class="detail-media-meta"
                    >
                      <strong>
                        Khu vực gợi ý:
                      </strong>

                      <span>
                        ${escapeHtml(
                          food.suggestedArea
                        )}
                      </span>
                    </div>
                  `
                  : ''
              }
            </div>
          </article>
        `;
      })
      .join('');

    window.ImageUtils?.scan(container);
  }

  function renderMap(place) {
    const map =
      document.getElementById(
        'placeMap'
      );

    if (!map) {
      return;
    }

    const mapQuery =
      place.mapQuery ||
      [
        place.name,
        place.province,
        'Việt Nam'
      ]
        .filter(Boolean)
        .join(', ');

    map.src =
      'https://www.google.com/maps?q=' +
      encodeURIComponent(mapQuery) +
      '&output=embed';
  }

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
      new Set(
        getCategories(currentPlace)
      );

    getCategories(otherPlace).forEach(
      (category) => {
        if (
          currentCategories.has(category)
        ) {
          score += 1;
        }
      }
    );

    return score;
  }

  function renderRelatedPlaces(
    currentPlace,
    destinations
  ) {
    const container =
      document.getElementById(
        'relatedGrid'
      );

    if (!container) {
      return;
    }

    const relatedPlaces =
      destinations
        .filter(
          (item) =>
            (item.id || item.slug) !==
            currentPlace.slug
        )
        .map((item) => ({
          item,

          score:
            calculateRelatedScore(
              currentPlace,
              item
            )
        }))
        .filter(
          (entry) =>
            entry.score > 0
        )
        .sort(
          (first, second) =>
            second.score - first.score
        )
        .slice(0, 3)
        .map(
          (entry) => entry.item
        );

    if (
      relatedPlaces.length === 0
    ) {
      container.innerHTML = `
        <p class="related-empty">
          Chưa có địa điểm liên quan.
        </p>
      `;

      return;
    }

    container.innerHTML =
      relatedPlaces
        .map((item) => {
          const itemSlug =
            item.id || item.slug;

          const image =
            getImages(item)[0];

          return `
            <article class="related-card">
              <a
                class="
                  related-image
                  media-frame
                "
                href="
                  /destinations-detail.html
                  ?id=${encodeURIComponent(
                    itemSlug
                  )}
                "
                aria-label="
                  Xem ${escapeHtml(
                    item.name
                  )}
                "
              >
                <img
                  src="${escapeHtml(image)}"
                  alt="${escapeHtml(
                    item.name ||
                    'Địa điểm du lịch'
                  )}"
                  width="800"
                  height="500"
                  loading="lazy"
                  decoding="async"
                  data-fallback="${fallbackImage}"
                />
              </a>

              <div class="related-content">
                <span>
                  ${escapeHtml(
                    item.province ||
                    item.region ||
                    ''
                  )}
                </span>

                <h3>
                  ${escapeHtml(
                    item.name ||
                    'Địa điểm'
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    item.shortDescription ||
                    'Thông tin đang được cập nhật.'
                  )}
                </p>

                <a
                  href="
                    /destinations-detail.html
                    ?id=${encodeURIComponent(
                      itemSlug
                    )}
                  "
                >
                  Xem chi tiết
                </a>
              </div>
            </article>
          `;
        })
        .join('');

    window.ImageUtils?.scan(
      container
    );
  }

  async function copyText(text) {
    const message =
      document.getElementById(
        'copyMessage'
      );

    try {
      await navigator.clipboard.writeText(
        text
      );

      if (message) {
        message.textContent =
          'Đã sao chép nội dung.';
      }
    } catch {
      if (message) {
        message.textContent =
          'Không thể sao chép tự động. ' +
          'Hãy chọn và sao chép nội dung thủ công.';
      }
    }
  }

  function setupActions(place) {
    const copyButton =
      document.getElementById(
        'quickCopyBtn'
      );

    const openTtsButton =
      document.getElementById(
        'openTtsBtn'
      );

    copyButton?.addEventListener(
      'click',
      () => {
        copyText(
          place.description || ''
        );
      }
    );

    openTtsButton?.addEventListener(
      'click',
      (event) => {
        event.preventDefault();

        localStorage.setItem(
          'ttsDraftText',
          place.description || ''
        );

        localStorage.setItem(
          'ttsSourceName',
          place.name || 'Địa điểm'
        );

        window.location.href =
          '/tts.html?id=' +
          encodeURIComponent(
            place.slug || place.id
          );
      }
    );
  }

  function renderPlace(
    place,
    destinations
  ) {
    const images =
      getImages(place);

    const categories =
      getCategories(place);

    document.title =
      `${place.name} - ` +
      `Vietnam Travel TTS`;

    const hero =
      document.getElementById(
        'placeHero'
      );

    if (hero) {
      hero.style.backgroundImage =
        `url("${images[0]}")`;
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
      place.shortDescription ||
        place.description ||
        'Địa điểm du lịch tại Việt Nam.'
    );

    setText(
      'placeProvince',
      place.province ||
        'Đang cập nhật'
    );

    setText(
      'placeRegion',
      place.region ||
        'Đang cập nhật'
    );

    setText(
      'placeType',
      categories.join(', ') ||
        place.type ||
        'Chưa phân loại'
    );

    setText(
      'placeTime',
      place.time ||
        'Đang cập nhật'
    );

    setText(
      'placeDescription',
      place.description ||
        'Thông tin đang được cập nhật.'
    );

    renderBadges(place);
    renderGallery(place);
    renderFeatures(place.features);
    renderHighlights(place.highlights);
    renderFoods(place.foods);
    renderMap(place);

    renderRelatedPlaces(
      place,
      destinations
    );

    setupActions(place);
  }

  async function loadPage() {
    if (!slug) {
      showErrorState(
        'URL chưa có mã địa điểm.'
      );

      return;
    }

    showLoadingState();

    try {
      const [
        place,
        destinations
      ] = await Promise.all([
        fetchJson(
          '/api/destinations/' +
          encodeURIComponent(slug)
        ),

        fetchJson(
          '/api/destinations'
        )
      ]);

      if (
        !place ||
        typeof place !== 'object'
      ) {
        throw new Error(
          'Dữ liệu chi tiết địa điểm không hợp lệ.'
        );
      }

      const list =
        Array.isArray(destinations)
          ? destinations
          : [];



      renderPlace(
        place,
        list
      );
    } catch (error) {
      console.error(
        '[DESTINATION DETAIL]',
        error
      );

      showErrorState(
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi không xác định.'
      );
    }
  }

  loadPage();
})();