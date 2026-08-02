const ttsText = document.getElementById('ttsText');
const charCount = document.getElementById('charCount');

// Nếu đã sửa HTML sang speedSelect thì dùng tốc độ được chọn.
// Nếu HTML vẫn còn voiceSelect thì mặc định speed = 1.0.
const speedSelect = document.getElementById('speedSelect');
const voiceSelect = document.getElementById('voiceSelect');

const fileNameInput = document.getElementById('fileName');

const pasteBtn = document.getElementById('pasteBtn');
const clearBtn = document.getElementById('clearBtn');
const resetBtn = document.getElementById('resetBtn');
const generateBtn = document.getElementById('generateBtn');

const ttsMessage = document.getElementById('ttsMessage');
const ttsColdStartHint =
  document.getElementById('ttsColdStartHint');

const audioPlaceholder =
  document.getElementById('audioPlaceholder');
const audioResult =
  document.getElementById('audioResult');
const audioPlayer =
  document.getElementById('audioPlayer');
const downloadLink =
  document.getElementById('downloadLink');

const ttsSourceNotice =
  document.getElementById('ttsSourceNotice');
const ttsSourceName =
  document.getElementById('ttsSourceName');
const clearSourceBtn =
  document.getElementById('clearSourceBtn');

const MAX_TEXT_CHARACTERS = 5000;
const POLLING_INTERVAL_MS = 2000;
const COLD_START_HINT_DELAY_MS = 7000;
const MAX_WAIT_TIME_MS = 20 * 60 * 1000;

let currentAudioUrl = null;
let currentJobId = null;
let isGenerating = false;

/**
 * Tạm dừng trong một khoảng thời gian.
 */
function sleep(milliseconds) {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, milliseconds);
  });
}

/**
 * Chuẩn hóa văn bản trước khi gửi tới backend.
 */
function normalizeText(value) {
  return value
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cập nhật số ký tự.
 */
function updateCharCount() {
  if (!ttsText || !charCount) {
    return;
  }

  const length = ttsText.value.length;

  charCount.textContent =
    `${length}/${MAX_TEXT_CHARACTERS} ký tự`;
}

/**
 * Hiển thị thông báo trên giao diện.
 */
function setMessage(message, type = 'error') {
  if (!ttsMessage) {
    return;
  }

  ttsMessage.textContent = message;

  ttsMessage.classList.remove(
    'success',
    'error',
    'loading',
    'info',
  );

  if (type) {
    ttsMessage.classList.add(type);
  }
}

/**
 * Xóa thông báo.
 */
function clearMessage() {
  if (!ttsMessage) {
    return;
  }

  ttsMessage.textContent = '';

  ttsMessage.classList.remove(
    'success',
    'error',
    'loading',
    'info',
  );
}

/**
 * Hiển thị hoặc ẩn thông báo cold start.
 */
function showColdStartHint(show) {
  if (!ttsColdStartHint) {
    return;
  }

  if (show) {
    ttsColdStartHint.classList.remove('hidden');
  } else {
    ttsColdStartHint.classList.add('hidden');
  }
}

/**
 * Tạo tên file an toàn.
 */
function createSafeFileName(name) {
  const fallbackName = 'travel-tts-audio';

  const safeName = String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return safeName || fallbackName;
}

/**
 * Lấy tốc độ đọc.
 *
 * Nếu HTML chưa có speedSelect thì dùng mặc định 1.0.
 */
function getSelectedSpeed() {
  if (!speedSelect) {
    return 1.0;
  }

  const speed = Number(speedSelect.value);

  if (!Number.isFinite(speed)) {
    return 1.0;
  }

  return speed;
}

/**
 * Khóa hoặc mở giao diện trong lúc tạo audio.
 */
function showLoading(isLoading) {
  isGenerating = isLoading;

  if (generateBtn) {
    generateBtn.disabled = isLoading;

    generateBtn.textContent = isLoading
      ? 'Đang xử lý...'
      : 'Tạo audio';
  }

  if (ttsText) {
    ttsText.disabled = isLoading;
  }

  if (speedSelect) {
    speedSelect.disabled = isLoading;
  }

  if (voiceSelect) {
    voiceSelect.disabled = isLoading;
  }

  if (fileNameInput) {
    fileNameInput.disabled = isLoading;
  }
}

/**
 * Xóa kết quả audio cũ.
 */
function resetAudioResult() {
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }

  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.removeAttribute('src');
    audioPlayer.load();
  }

  if (downloadLink) {
    downloadLink.removeAttribute('href');
  }

  if (audioResult) {
    audioResult.classList.add('hidden');
  }

  if (audioPlaceholder) {
    audioPlaceholder.classList.remove('hidden');
  }
}

/**
 * Lấy thông báo lỗi từ response backend.
 */
function getApiErrorMessage(
  responseBody,
  fallbackMessage,
) {
  if (!responseBody) {
    return fallbackMessage;
  }

  if (Array.isArray(responseBody.message)) {
    return responseBody.message.join(' ');
  }

  if (
    typeof responseBody.message === 'string'
  ) {
    return responseBody.message;
  }

  if (
    typeof responseBody.error === 'string'
  ) {
    return responseBody.error;
  }

  if (
    responseBody.error &&
    typeof responseBody.error.message === 'string'
  ) {
    return responseBody.error.message;
  }

  return fallbackMessage;
}

/**
 * Gọi API và đọc JSON.
 */
async function requestJson(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      cache: 'no-store',
      ...options,
    });
  } catch (error) {
    console.error(
      'Không thể kết nối backend:',
      error,
    );

    throw new Error(
      'Không thể kết nối tới backend NestJS. ' +
      'Hãy kiểm tra server có đang chạy tại cổng 3000 hay không.',
    );
  }

  const rawResponse =
    await response.text();
    
  console.log(
  '[TTS HTTP RESPONSE]',
  {
    url: url,
    status: response.status,
    statusText: response.statusText,
    contentType:
      response.headers.get('content-type'),
    rawResponse: rawResponse,
  },
);  

  let responseBody = null;

  if (rawResponse) {
    try {
      responseBody =
        JSON.parse(rawResponse);
    } catch (error) {
      console.error(
        'Backend trả dữ liệu không phải JSON:',
        rawResponse,
      );

      if (response.ok) {
        throw new Error(
          'Backend trả về dữ liệu không đúng định dạng JSON.',
        );
      }
    }
  }

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        responseBody,
        `Yêu cầu thất bại với mã ${response.status}.`,
      ),
    );
  }

  if (
    !responseBody ||
    typeof responseBody !== 'object'
  ) {
    throw new Error(
      'Backend không trả về dữ liệu hợp lệ.',
    );
  }

  return responseBody;
}

/**
 * Gửi job mới tới NestJS.
 */
async function createTtsJob(text, speed) {
  return requestJson('/api/tts/jobs', {
    method: 'POST',

    headers: {
      'Content-Type':
        'application/json; charset=utf-8',
    },

    body: JSON.stringify({
      text: text,
      speed: speed,
      nfeStep: 32,
    }),
  });
}

/**
 * Kiểm tra trạng thái job cho đến khi hoàn tất.
 */
async function waitForTtsJob(
  jobId,
  statusUrl,
) {
  const startedAt = Date.now();

  const resolvedStatusUrl =
    statusUrl ||
    `/api/tts/jobs/${encodeURIComponent(jobId)}`;

  let coldStartHintShown = false;

  while (true) {
    const elapsedTime =
      Date.now() - startedAt;

    if (elapsedTime >= MAX_WAIT_TIME_MS) {
      throw new Error(
        'Quá thời gian chờ tạo giọng đọc. Vui lò  ng thử lại.',
      );
    }

    const statusData =
      await requestJson(resolvedStatusUrl);

    if (
      elapsedTime >=
        COLD_START_HINT_DELAY_MS &&
      !coldStartHintShown
    ) {
      coldStartHintShown = true;
      showColdStartHint(true);
    }

    switch (statusData.status) {
      case 'queued':
        setMessage(
          'Đang khởi động mô hình AI...',
          'loading',
        );
        break;

      case 'processing':
        setMessage(
          'Đang tạo giọng đọc...',
          'loading',
        );
        break;

      case 'completed':
        setMessage(
          'Tạo giọng đọc hoàn thành.',
          'success',
        );

        return statusData;

      case 'failed':
        throw new Error(
          statusData.error ||
          statusData.message ||
          'Tạo giọng đọc thất bại.',
        );

      default:
        setMessage(
          'Đang kiểm tra trạng thái...',
          'loading',
        );
    }

    await sleep(POLLING_INTERVAL_MS);
  }
}

/**
 * Tải WAV từ NestJS dưới dạng Blob.
 */
async function fetchAudioBlob(audioUrl) {
  const separator =
    audioUrl.includes('?') ? '&' : '?';

  const response = await fetch(
    `${audioUrl}${separator}t=${Date.now()}`,
    {
      method: 'GET',

      headers: {
        Accept: 'audio/wav',
      },
    },
  );

  if (!response.ok) {
    let errorMessage =
      'Không thể tải file âm thanh từ backend.';

    try {
      const responseBody =
        await response.json();

      errorMessage = getApiErrorMessage(
        responseBody,
        errorMessage,
      );
    } catch (error) {
      // Response lỗi không phải JSON.
    }

    throw new Error(errorMessage);
  }

  const audioBlob = await response.blob();

  if (!audioBlob || audioBlob.size === 0) {
    throw new Error(
      'File âm thanh backend trả về đang trống.',
    );
  }

  return audioBlob;
}

/**
 * Tải nội dung được gửi từ trang trước.
 */
function loadDraftText() {
  if (!ttsText) {
    return;
  }

  const savedDraft =
    localStorage.getItem('ttsDraftText');

  if (savedDraft) {
    ttsText.value = savedDraft;

    localStorage.removeItem(
      'ttsDraftText',
    );

    ttsText.focus();
  }

  updateCharCount();
}

/**
 * Theo dõi textarea.
 */
if (ttsText) {
  ttsText.maxLength =
    MAX_TEXT_CHARACTERS;

  ttsText.addEventListener(
    'input',
    function () {
      updateCharCount();
      clearMessage();
      showColdStartHint(false);
    },
  );
}

/**
 * Dán nội dung từ clipboard.
 */
if (pasteBtn) {
  pasteBtn.addEventListener(
    'click',
    async function () {
      try {
        const text =
          await navigator.clipboard.readText();

        if (!text.trim()) {
          setMessage(
            'Clipboard không có nội dung để dán.',
            'error',
          );

          return;
        }

        if (
          text.length >
          MAX_TEXT_CHARACTERS
        ) {
          setMessage(
            `Nội dung clipboard vượt quá ${MAX_TEXT_CHARACTERS} ký tự.`,
            'error',
          );

          return;
        }

        ttsText.value = text;

        updateCharCount();

        setMessage(
          'Đã dán nội dung vào ô văn bản. Bạn có thể chỉnh sửa trước khi tạo audio.',
          'success',
        );
      } catch (error) {
        setMessage(
          'Trình duyệt không cho phép đọc clipboard. Bạn có thể dán thủ công bằng Ctrl + V.',
          'error',
        );
      }
    },
  );
}

/**
 * Xóa nội dung.
 */
if (clearBtn) {
  clearBtn.addEventListener(
    'click',
    function () {
      ttsText.value = '';

      updateCharCount();
      resetAudioResult();
      clearMessage();
      showColdStartHint(false);

      ttsText.focus();
    },
  );
}

/**
 * Làm mới toàn bộ form.
 */
if (resetBtn) {
  resetBtn.addEventListener(
    'click',
    function () {
      ttsText.value = '';

      if (fileNameInput) {
        fileNameInput.value =
          'travel-tts-audio';
      }

      if (speedSelect) {
        speedSelect.value = '1.0';
      }

      if (voiceSelect) {
        voiceSelect.selectedIndex = 0;
      }

      currentJobId = null;

      updateCharCount();
      resetAudioResult();
      clearMessage();
      showColdStartHint(false);

      ttsText.focus();
    },
  );
}

/**
 * Tạo audio bằng NestJS và RunPod.
 */
if (generateBtn) {
  generateBtn.addEventListener(
    'click',
    async function () {
      if (isGenerating) {
        return;
      }

      const text = normalizeText(
        ttsText.value,
      );

      const speed =
        getSelectedSpeed();

      const fileName =
        createSafeFileName(
          fileNameInput
            ? fileNameInput.value
            : '',
        );

      if (!text) {
        setMessage(
          'Vui lòng nhập nội dung cần chuyển thành giọng đọc.',
          'error',
        );

        ttsText.focus();

        return;
      }

      if (text.length < 10) {
        setMessage(
          'Nội dung quá ngắn. Vui lòng nhập ít nhất 10 ký tự.',
          'error',
        );

        ttsText.focus();

        return;
      }

      if (
        text.length >
        MAX_TEXT_CHARACTERS
      ) {
        setMessage(
          `Nội dung không được vượt quá ${MAX_TEXT_CHARACTERS} ký tự.`,
          'error',
        );

        ttsText.focus();

        return;
      }

      try {
        showLoading(true);
        showColdStartHint(false);
        resetAudioResult();

        setMessage(
          'Đang gửi nội dung...',
          'loading',
        );

        const jobResponse =
            await createTtsJob(
              text,
              speed,
            );

          console.log(
            'Phản hồi tạo job TTS:',
            jobResponse,
          );

          /*
          * Hỗ trợ cả hai cấu trúc:
          *
          * { jobId: "..." }
          *
          * hoặc:
          *
          * { data: { jobId: "..." } }
          */
          const jobData =
            jobResponse?.data ??
            jobResponse;

          if (
            !jobData ||
            typeof jobData !== 'object'
          ) {
            throw new Error(
              'Backend không trả về thông tin job hợp lệ.',
            );
          }

          const receivedJobId =
            typeof jobData.jobId === 'string'
              ? jobData.jobId.trim()
              : '';

          if (!receivedJobId) {
            console.error(
              'Phản hồi không có jobId:',
              jobResponse,
            );

            throw new Error(
              'Backend không trả về Job ID.',
            );
          }

          currentJobId =
            receivedJobId;

          setMessage(
            jobData.message ||
            'Đang khởi động mô hình AI...',
            'loading',
          );

          const completedJob =
            await waitForTtsJob(
              currentJobId,
              jobData.statusUrl,
            );

        if (!completedJob.audioReady) {
          throw new Error(
            'Job đã hoàn thành nhưng chưa có file âm thanh.',
          );
        }

        const audioUrl =
          completedJob.audioUrl ||
          `/api/tts/jobs/${encodeURIComponent(
            currentJobId,
          )}/audio`;

        const audioBlob =
          await fetchAudioBlob(
            audioUrl,
          );

        currentAudioUrl =
          URL.createObjectURL(
            audioBlob,
          );

        if (audioPlayer) {
          audioPlayer.src =
            currentAudioUrl;

          audioPlayer.load();
        }

        if (downloadLink) {
          downloadLink.href =
            currentAudioUrl;

          downloadLink.download =
            `${fileName}.wav`;

          downloadLink.textContent =
            'Tải file WAV';
        }

        if (audioPlaceholder) {
          audioPlaceholder.classList.add(
            'hidden',
          );
        }

        if (audioResult) {
          audioResult.classList.remove(
            'hidden',
          );
        }

        setMessage(
          'Tạo audio thành công. Bạn có thể nghe hoặc tải file WAV.',
          'success',
        );
      } catch (error) {
        console.error(
          'Lỗi tạo giọng đọc:',
          error,
        );

        setMessage(
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi khi tạo audio.',
          'error',
        );
      } finally {
        showLoading(false);
      }
    },
  );
}

/**
 * Chuyển danh sách điểm khám phá thành văn bản.
 */
function createHighlightsText(highlights) {
  if (
    !Array.isArray(highlights) ||
    highlights.length === 0
  ) {
    return '- Chưa có thông tin.';
  }

  return highlights
    .map(function (item) {
      if (typeof item === 'string') {
        return `- ${item}`;
      }

      if (
        !item ||
        typeof item !== 'object'
      ) {
        return null;
      }

      const name =
        item.name ||
        'Điểm khám phá';

      const description =
        item.description
          ? `: ${item.description}`
          : '';

      return `- ${name}${description}`;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Chuyển danh sách món ăn thành văn bản.
 */
function createFoodsText(foods) {
  if (
    !Array.isArray(foods) ||
    foods.length === 0
  ) {
    return '- Chưa có thông tin.';
  }

  return foods
    .map(function (food) {
      if (typeof food === 'string') {
        return `- ${food}`;
      }

      if (
        !food ||
        typeof food !== 'object'
      ) {
        return null;
      }

      const name =
        food.name ||
        'Món ăn địa phương';

      const description =
        food.description
          ? `: ${food.description}`
          : '';

      const price =
        food.priceRange
          ? ` Giá tham khảo: ${food.priceRange}.`
          : '';

      return (
        `- ${name}` +
        `${description}` +
        `${price}`
      );
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Tạo nội dung thuyết minh từ dữ liệu địa điểm.
 */
function createReviewContent(place) {
  const features =
    Array.isArray(place.features) &&
    place.features.length > 0
      ? place.features
          .map(function (feature) {
            if (
              !feature ||
              typeof feature !== 'object'
            ) {
              return null;
            }

            const title =
              feature.title ||
              'Đặc điểm';

            const content =
              feature.text ||
              feature.content ||
              '';

            return (
              `- ${title}` +
              `${content ? `: ${content}` : ''}`
            );
          })
          .filter(Boolean)
          .join('\n')
      : '- Chưa có thông tin nổi bật.';

  const highlights =
    createHighlightsText(
      place.highlights,
    );

  const foods =
    createFoodsText(
      place.foods,
    );

  const categories =
    Array.isArray(place.categories) &&
    place.categories.length > 0
      ? place.categories.join(', ')
      : place.type ||
        'Chưa phân loại';

  return `
${place.name || 'Địa điểm du lịch'}

${place.description || 'Thông tin đang được cập nhật.'}

Thông tin địa điểm:
- Tỉnh, thành phố: ${place.province || 'Chưa có thông tin'}
- Khu vực: ${place.region || 'Chưa có thông tin'}
- Loại hình du lịch: ${categories}
- Thời điểm nên đi: ${place.time || 'Chưa có thông tin'}

Đặc điểm nổi bật:
${features}

Điểm nên khám phá:
${highlights}

Ẩm thực gợi ý:
${foods}
  `.trim();
}

/**
 * Hiển thị dữ liệu địa điểm trong giao diện TTS.
 */
function applyPlaceContent(place) {
  if (!ttsText) {
    return;
  }

  const reviewContent =
    createReviewContent(place);

  ttsText.value = reviewContent;

  if (
    ttsSourceNotice &&
    ttsSourceName
  ) {
    ttsSourceName.textContent =
      place.name ||
      'Địa điểm du lịch';

    ttsSourceNotice.classList.remove(
      'hidden',
    );
  }

  const placeSlug =
    place.slug ||
    place.id ||
    'dia-diem';

  if (fileNameInput) {
    fileNameInput.value =
      `tts-${placeSlug}`;
  }

  /*
   * Xóa dữ liệu truyền tạm từ trang chi tiết
   * vì nội dung chính thức đã được lấy từ API.
   */
  localStorage.removeItem(
    'ttsDraftText',
  );

  localStorage.removeItem(
    'ttsSourceName',
  );

  updateCharCount();

  if (
    reviewContent.length >
    MAX_TEXT_CHARACTERS
  ) {
    setMessage(
      `Nội dung của ${
        place.name || 'địa điểm'
      } có ${reviewContent.length} ký tự. ` +
        `Bạn cần rút gọn xuống tối đa ` +
        `${MAX_TEXT_CHARACTERS} ký tự trước khi tạo audio.`,
      'error',
    );

    return;
  }

  setMessage(
    `Đã tải nội dung của ${
      place.name || 'địa điểm'
    } từ cơ sở dữ liệu. ` +
      'Bạn có thể chỉnh sửa trước khi tạo audio.',
    'success',
  );
}

/**
 * Tải nội dung địa điểm từ API theo id hoặc slug trên URL.
 */
async function loadPlaceContentFromUrl() {
  if (!ttsText) {
    return false;
  }

  const params =
    new URLSearchParams(
      window.location.search,
    );

  const placeId =
    (
      params.get('id') ||
      params.get('slug') ||
      ''
    ).trim();

  if (!placeId) {
    return false;
  }

  try {
    setMessage(
      'Đang tải nội dung địa điểm...',
      'loading',
    );

    const place =
      await requestJson(
        '/api/destinations/' +
          encodeURIComponent(placeId),
      );

    if (
      !place ||
      typeof place !== 'object' ||
      Array.isArray(place)
    ) {
      throw new Error(
        'Dữ liệu địa điểm API trả về không hợp lệ.',
      );
    }

    applyPlaceContent(place);

    return true;
  } catch (error) {
    console.error(
      '[TTS DESTINATION]',
      error,
    );

    setMessage(
      error instanceof Error
        ? error.message
        : 'Không thể tải nội dung địa điểm.',
      'error',
    );

    return false;
  }
}

/**
 * Chuyển về chế độ soạn nội dung mới.
 */
if (clearSourceBtn) {
  clearSourceBtn.addEventListener(
    'click',
    function () {
      if (ttsText) {
        ttsText.value = '';
      }

      if (fileNameInput) {
        fileNameInput.value =
          'travel-tts-audio';
      }

      if (ttsSourceNotice) {
        ttsSourceNotice.classList.add(
          'hidden',
        );
      }

      localStorage.removeItem(
        'ttsDraftText',
      );

      localStorage.removeItem(
        'ttsSourceName',
      );

      updateCharCount();
      resetAudioResult();
      clearMessage();
      showColdStartHint(false);

      ttsText?.focus();

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname,
      );
    },
  );
}

/**
 * Khởi tạo nội dung trang TTS.
 *
 * Nếu URL có id thì ưu tiên lấy dữ liệu từ API.
 * Nếu không có id thì đọc bản nháp được truyền qua localStorage.
 */
async function initializeTtsPage() {
  const params =
    new URLSearchParams(
      window.location.search,
    );

  const placeId =
    (
      params.get('id') ||
      params.get('slug') ||
      ''
    ).trim();

  if (placeId) {
    const loadedFromApi =
      await loadPlaceContentFromUrl();

    /*
     * Nếu API lỗi thì thử sử dụng nội dung tạm
     * được truyền từ trang trước.
     */
    if (!loadedFromApi) {
      loadDraftText();
    }

    return;
  }

  loadDraftText();
}

initializeTtsPage();