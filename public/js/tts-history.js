(function () {
  'use strict';

  const elements = {
    modeLink:
      document.getElementById(
        'historyModeLink'
      ),

    filterForm:
      document.getElementById(
        'historyFilterForm'
      ),

    searchInput:
      document.getElementById(
        'historySearch'
      ),

    statusSelect:
      document.getElementById(
        'historyStatus'
      ),

    voiceSelect:
      document.getElementById(
        'historyVoice'
      ),

    resetButton:
      document.getElementById(
        'historyResetBtn'
      ),

    refreshButton:
      document.getElementById(
        'historyRefreshBtn'
      ),

    retryButton:
      document.getElementById(
        'historyRetryBtn'
      ),

    loading:
      document.getElementById(
        'historyLoading'
      ),

    error:
      document.getElementById(
        'historyError'
      ),

    errorMessage:
      document.getElementById(
        'historyErrorMessage'
      ),

    empty:
      document.getElementById(
        'historyEmpty'
      ),

    list:
      document.getElementById(
        'historyList'
      ),

    summary:
      document.getElementById(
        'historySummary'
      ),

    pagination:
      document.getElementById(
        'historyPagination'
      ),

    previousButton:
      document.getElementById(
        'historyPreviousBtn'
      ),

    nextButton:
      document.getElementById(
        'historyNextBtn'
      ),

    pageInfo:
      document.getElementById(
        'historyPageInfo'
      ),
  };
const initialParameters =
  new URLSearchParams(
    window.location.search
  );

const initialView =
  initialParameters.get(
    'view'
  ) === 'trash'
    ? 'trash'
    : 'active';
  const state = {
    view:
    initialView,
    page: 1,
    limit: 10,
    items: [],
    pagination: null,
  };
  function initializeHistoryMode() {
  const isTrash =
    state.view ===
    'trash';

  if (elements.modeLink) {
    elements.modeLink.href =
      isTrash
        ? '/tts-history.html'
        : '/tts-history.html?view=trash';

    elements.modeLink.textContent =
      isTrash
        ? '← Quay lại lịch sử'
        : 'Thùng rác';
  }

  if (isTrash) {
    document.title =
      'Thùng rác giọng đọc - Vietnam Travel TTS';
  }
}

  const audioObjectUrls =
    new Map();

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(
    type,
    message
  ) {
    if (
      window.Toast &&
      typeof window.Toast[type] ===
        'function'
    ) {
      window.Toast[type](
        message
      );

      return;
    }

    console.log(
      `[${type}]`,
      message
    );
  }

  function extractErrorMessage(
    payload,
    fallbackMessage
  ) {
    if (!payload) {
      return fallbackMessage;
    }

    if (
      Array.isArray(
        payload.message
      )
    ) {
      return payload.message.join(
        ' '
      );
    }

    if (
      typeof payload.message ===
        'string'
    ) {
      return payload.message;
    }

    return fallbackMessage;
  }

  async function requestJson(url) {
    if (
      !window.AuthStore ||
      typeof AuthStore.authFetch !==
        'function'
    ) {
      throw new Error(
        'AuthStore chưa được khởi tạo.'
      );
    }

    const response =
      await AuthStore.authFetch(
        url
      );

    let payload = null;

    try {
      payload =
        await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(
        extractErrorMessage(
          payload,
          'Không thể tải lịch sử giọng đọc.'
        )
      );
    }

    return payload;
  }

/**
 * Tải file lịch sử trực tiếp từ Cloudflare R2
 * thông qua UUID nội bộ của TtsJob.
 */
async function requestHistoryAudioBlob(
  ttsJobId,
  action = 'listen'
) {
  const normalizedTtsJobId =
    String(
      ttsJobId || ''
    ).trim();

  if (!normalizedTtsJobId) {
    throw new Error(
      'Không xác định được lịch sử TTS.'
    );
  }
const endpoint =
  action === 'download'
    ? 'download'
    : 'audio';

const url =
  '/api/tts/history/' +
  encodeURIComponent(
    normalizedTtsJobId
  ) +
  '/' +
  endpoint;

  /*
   * Không để giao diện chờ vô hạn nếu
   * kết nối PostgreSQL hoặc R2 gặp sự cố.
   */
  const controller =
    new AbortController();

  const timeoutId =
    window.setTimeout(
      function () {
        controller.abort();
      },
      60_000
    );

  try {
    const response =
      await AuthStore.authFetch(
        url,
        {
          signal:
            controller.signal,
        }
      );

    if (!response.ok) {
      let payload = null;

      try {
        payload =
          await response.json();
      } catch {
        payload = null;
      }

      throw new Error(
        extractErrorMessage(
          payload,
          'Không thể tải file âm thanh từ Cloudflare R2.'
        )
      );
    }

    const blob =
      await response.blob();

    if (
      !blob ||
      blob.size <= 0
    ) {
      throw new Error(
        'File âm thanh nhận được đang trống.'
      );
    }

    return blob;
  } catch (error) {
    if (
      error &&
      error.name ===
        'AbortError'
    ) {
      throw new Error(
        'Quá thời gian tải file âm thanh. Hãy thử lại.'
      );
    }

    throw error;
  } finally {
    window.clearTimeout(
      timeoutId
    );
  }
}
  function formatDate(value) {
    if (!value) {
      return 'Chưa có';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return 'Không xác định';
    }

    return new Intl.DateTimeFormat(
      'vi-VN',
      {
        dateStyle:
          'medium',

        timeStyle:
          'short',
      }
    ).format(date);
  }

  function formatFileSize(value) {
    const size =
      Number(value);

    if (
      !Number.isFinite(size) ||
      size <= 0
    ) {
      return 'Chưa xác định';
    }

    if (size < 1024) {
      return `${size} byte`;
    }

    if (
      size <
      1024 * 1024
    ) {
      return (
        `${(
          size / 1024
        ).toFixed(1)} KB`
      );
    }

    return (
      `${(
        size /
        (1024 * 1024)
      ).toFixed(2)} MB`
    );
  }

  function getStatusInformation(
    status
  ) {
    const normalizedStatus =
      String(
        status || 'UNKNOWN'
      ).toUpperCase();

    const map = {
      QUEUED: {
        label:
          'Đang chờ',

        cssClass:
          'queued',
      },

      PROCESSING: {
        label:
          'Đang xử lý',

        cssClass:
          'processing',
      },

      COMPLETED: {
        label:
          'Hoàn thành',

        cssClass:
          'completed',
      },

      FAILED: {
        label:
          'Thất bại',

        cssClass:
          'failed',
      },

      CANCELLED: {
        label:
          'Đã hủy',

        cssClass:
          'cancelled',
      },
    };

    return (
      map[normalizedStatus] || {
        label:
          'Không xác định',

        cssClass:
          'unknown',
      }
    );
  }

  function getVoiceLabel(
    voice
  ) {
    return voice === 'female'
      ? 'Giọng nữ'
      : voice === 'male'
        ? 'Giọng nam'
        : 'Chưa xác định';
  }

  function getSourcePreview(
    sourceText
  ) {
    const text =
      String(
        sourceText || ''
      );

    if (text.length <= 260) {
      return text;
    }

    return (
      text.slice(0, 260)
        .trimEnd() +
      '...'
    );
  }

  function revokeAudioUrl(
    jobId
  ) {
    const previousUrl =
      audioObjectUrls.get(
        jobId
      );

    if (previousUrl) {
      URL.revokeObjectURL(
        previousUrl
      );

      audioObjectUrls.delete(
        jobId
      );
    }
  }

  function revokeAllAudioUrls() {
    audioObjectUrls.forEach(
      function (objectUrl) {
        URL.revokeObjectURL(
          objectUrl
        );
      }
    );

    audioObjectUrls.clear();
  }

  function buildDestinationMedia(
    item
  ) {
    const destination =
      item.destination;

    const imageUrl =
      destination?.coverImage?.url;

    if (imageUrl) {
      return `
        <div
          class="history-card-media media-frame"
        >
          <img
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(
              destination.coverImage
                .altText ||
              destination.name ||
              'Địa điểm du lịch'
            )}"
            width="800"
            height="600"
            loading="lazy"
            decoding="async"
            data-fallback="/assets/images/bg-vietnam.jpg"
          />
        </div>
      `;
    }

    return `
      <div class="history-card-media">
        <div
          class="history-card-media-placeholder"
          aria-hidden="true"
        >
          ♪
        </div>
      </div>
    `;
  }

  function renderHistoryItem(
    item
  ) {
    const statusInformation =
      getStatusInformation(
        item.status
      );

    const destination =
      item.destination;

    const sourceText =
      String(
        item.sourceText || ''
      );

    const sourcePreview =
      getSourcePreview(
        sourceText
      );

/*
 * Route lịch sử đọc trực tiếp bằng
 * AudioFile.objectKey trên Cloudflare R2.
 *
 * Vì vậy chỉ hiển thị nút khi database
 * đã có AudioFile khả dụng.
 */
/*
 * Job mới có AudioFile sẽ đọc trực tiếp từ R2.
 *
 * Job cũ chưa có AudioFile nhưng còn RunPod Job ID
 * vẫn được hiển thị nút để backend thử phục hồi
 * metadata trong lần nghe hoặc tải đầu tiên.
 */
const canRequestAudio =
  item.status ===
    'COMPLETED' &&
  typeof item.id ===
    'string' &&
  item.id
    .trim()
    .length > 0 &&
  (
    item.audioAvailable ===
      true ||
    (
      typeof item.runpodJobId ===
        'string' &&
      item.runpodJobId
        .trim()
        .length > 0
    )
  );

    const destinationButton =
      destination?.slug
        ? `
          <a
            class="history-neutral-action"
            href="/destinations-detail.html?id=${encodeURIComponent(
              destination.slug
            )}"
          >
            Xem địa điểm
          </a>
        `
        : '';

    const audioButtons =
      canRequestAudio
        ? `
            <button
              type="button"
              class="history-primary-action"
              data-history-action="listen"
              data-job-id="${escapeHtml(
                item.id
              )}"
            >
              ▶ Nghe lại
            </button>

                <button
                  type="button"
                  class="history-secondary-action"
                  data-history-action="download"
                  data-job-id="${escapeHtml(
                    item.id
                  )}"
                  data-extension="${escapeHtml(
                    item.audio
                      ?.fileExtension ||
                    'wav'
                  )}"
                >
                  ↓ Tải WAV
                </button>
        `
        : '';

        const activeHistoryActions = `
  ${audioButtons}

  <button
    type="button"
    class="history-secondary-action"
    data-history-action="reuse"
    data-job-id="${escapeHtml(
      item.id
    )}"
  >
    ↻ Dùng lại nội dung
  </button>

  <button
    type="button"
    class="
      history-secondary-action
      history-danger-action
    "
    data-history-action="delete"
    data-job-id="${escapeHtml(
      item.id
    )}"
  >
    Xóa lịch sử
  </button>

  ${destinationButton}
`;

const trashHistoryActions = `
  <button
    type="button"
    class="
      history-secondary-action
      history-restore-action
    "
    data-history-action="restore"
    data-job-id="${escapeHtml(
      item.id
    )}"
  >
    Khôi phục
  </button>

  <button
    type="button"
    class="
      history-secondary-action
      history-danger-action
    "
    data-history-action="permanent-delete"
    data-job-id="${escapeHtml(
      item.id
    )}"
  >
    Xóa vĩnh viễn
  </button>
`;

const historyActions =
  state.view === 'trash'
    ? trashHistoryActions
    : activeHistoryActions;
    const errorMessage =
      item.error?.message
        ? `
          <div class="history-error-message">
            <strong>
              Lỗi:
            </strong>

            ${escapeHtml(
              item.error.message
            )}
          </div>
        `
        : '';

    const destinationName =
      destination?.name ||
      'Nội dung tự nhập';

    return `
      <article
        class="history-card"
        data-history-card-id="${escapeHtml(
          item.id
        )}"
      >
        ${buildDestinationMedia(
          item
        )}

        <div class="history-card-body">
          <div class="history-card-header">
            <div class="history-card-title">
              <h3>
                ${escapeHtml(
                  destinationName
                )}
              </h3>

              <p>
                Tạo lúc
                ${escapeHtml(
                  formatDate(
                    item.createdAt
                  )
                )}
              </p>
            </div>

            <span
              class="
                history-status
                history-status-${escapeHtml(
                  statusInformation.cssClass
                )}
              "
            >
              ${escapeHtml(
                statusInformation.label
              )}
            </span>
          </div>

          <p class="history-source-preview">
            ${escapeHtml(
              sourcePreview
            )}
          </p>

          <details class="history-source-details">
            <summary>
              Xem toàn bộ nội dung
            </summary>

            <p>
              ${escapeHtml(
                sourceText
              )}
            </p>
          </details>

          <div class="history-meta-grid">
            <div class="history-meta-item">
              <span>
                Giọng đọc
              </span>

              <strong>
                ${escapeHtml(
                  getVoiceLabel(
                    item.voice
                  )
                )}
              </strong>
            </div>

            <div class="history-meta-item">
              <span>
                Kích thước
              </span>

              <strong>
                ${escapeHtml(
                  formatFileSize(
                    item.audio
                      ?.sizeBytes
                  )
                )}
              </strong>
            </div>

            <div class="history-meta-item">
              <span>
                Hoàn thành
              </span>

              <strong>
                ${escapeHtml(
                  formatDate(
                    item.completedAt
                  )
                )}
              </strong>
            </div>
          </div>

          ${errorMessage}

          <div class="history-card-actions">
            ${historyActions}
          </div>

          <audio
            class="history-audio-player"
            data-history-audio-id="${escapeHtml(
              item.id
            )}"
            controls
            hidden
          ></audio>
        </div>
      </article>
    `;
  }

  function renderHistoryList(
    items
  ) {
    revokeAllAudioUrls();

    elements.list.innerHTML =
      items
        .map(
          renderHistoryItem
        )
        .join('');

    if (
      window.ImageUtils &&
      typeof ImageUtils.scan ===
        'function'
    ) {
      ImageUtils.scan(
        elements.list
      );
    }
  }

  function updatePagination(
    pagination
  ) {
    const totalPages =
      Number(
        pagination?.totalPages
      ) || 0;

    const page =
      Number(
        pagination?.page
      ) || 1;

    const displayTotalPages =
      Math.max(
        totalPages,
        1
      );

    elements.pageInfo.textContent =
      `Trang ${page} / ` +
      `${displayTotalPages}`;

    elements.previousButton.disabled =
      !pagination
        ?.hasPreviousPage;

    elements.nextButton.disabled =
      !pagination
        ?.hasNextPage;

    elements.pagination.hidden =
      Number(
        pagination?.total
      ) === 0;
  }

  function showLoadingState() {
    elements.loading.hidden =
      false;

    elements.error.hidden =
      true;

    elements.empty.hidden =
      true;

    elements.list.innerHTML =
      '';

    elements.pagination.hidden =
      true;

    elements.summary.textContent =
      'Đang tải lịch sử...';
  }

  function showErrorState(
    message
  ) {
    elements.loading.hidden =
      true;

    elements.empty.hidden =
      true;

    elements.error.hidden =
      false;

    elements.list.innerHTML =
      '';

    elements.pagination.hidden =
      true;

    elements.errorMessage
      .textContent =
        message;

    elements.summary.textContent =
      'Không thể tải dữ liệu.';
  }

  function showEmptyState() {
    elements.loading.hidden =
      true;

    elements.error.hidden =
      true;

    elements.empty.hidden =
      false;

    elements.list.innerHTML =
      '';

    elements.pagination.hidden =
      true;

    elements.summary.textContent =
      state.view === 'trash'
        ? 'Thùng rác hiện đang trống.'
        : 'Không tìm thấy lượt tạo giọng đọc nào.';
      }

  function showContentState(
    payload
  ) {
    elements.loading.hidden =
      true;

    elements.error.hidden =
      true;

    elements.empty.hidden =
      true;

    const total =
      Number(
        payload.pagination
          ?.total
      ) || 0;

    elements.summary.textContent =
      state.view === 'trash'
        ? (
            `Có ${total} mục ` +
            'trong thùng rác.'
          )
        : (
            `Đã tìm thấy ${total} ` +
            'lượt tạo giọng đọc.'
          );

    renderHistoryList(
      payload.items
    );

    updatePagination(
      payload.pagination
    );
  }

  function buildHistoryUrl() {
    const parameters =
      new URLSearchParams();

    parameters.set(
      'page',
      String(state.page)
    );

    parameters.set(
      'limit',
      String(state.limit)
    );

    const keyword =
      elements.searchInput
        .value
        .normalize('NFC')
        .replace(/\s+/g, ' ')
        .trim();

    const status =
      elements.statusSelect
        .value
        .trim();

    const voice =
      elements.voiceSelect
        .value
        .trim();

    if (keyword) {
      parameters.set(
        'q',
        keyword
      );
    }

    if (status) {
      parameters.set(
        'status',
        status
      );
    }

    if (voice) {
      parameters.set(
        'voice',
        voice
      );
    }

      const baseUrl =
        state.view === 'trash'
          ? '/api/tts/history/trash'
          : '/api/tts/history';

      return (
        baseUrl +
        '?' +
        parameters.toString()
      );
  }

  async function loadHistory() {
    showLoadingState();

    try {
      const payload =
        await requestJson(
          buildHistoryUrl()
        );

      if (
        !payload ||
        !Array.isArray(
          payload.items
        ) ||
        !payload.pagination
      ) {
        throw new Error(
          'Dữ liệu lịch sử không hợp lệ.'
        );
      }

      state.items =
        payload.items;

      state.pagination =
        payload.pagination;

      state.page =
        Number(
          payload.pagination.page
        ) || state.page;

      if (
        payload.items.length === 0
      ) {
        showEmptyState();

        return;
      }

      showContentState(
        payload
      );
    } catch (error) {
      console.error(
        '[TTS HISTORY]',
        error
      );

      showErrorState(
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi không xác định.'
      );
    }
  }

  function findHistoryItem(
    jobId
  ) {
    return state.items.find(
      function (item) {
        return item.id === jobId;
      }
    );
  }

  async function handleListen(
    button
  ) {
const jobId =
  button.dataset.jobId;

const card =
  button.closest(
    '[data-history-card-id]'
  );

    const player =
      card?.querySelector(
        '[data-history-audio-id]'
      );
if (
  !jobId ||
  !player
) {
      showToast(
        'error',
        'Không xác định được file âm thanh.'
      );

      return;
    }

    const originalText =
      button.textContent;

    button.disabled = true;
    button.textContent =
      'Đang tải...';

    try {
const blob =
  await requestHistoryAudioBlob(
    jobId,
    'listen'
  );

      revokeAudioUrl(
        jobId
      );

      document
        .querySelectorAll(
          '.history-audio-player'
        )
        .forEach(
          function (audioPlayer) {
            if (
              audioPlayer !==
              player
            ) {
              audioPlayer.pause();
            }
          }
        );

      const objectUrl =
        URL.createObjectURL(
          blob
        );

      audioObjectUrls.set(
        jobId,
        objectUrl
      );

      player.src =
        objectUrl;

      player.hidden =
        false;

      player.load();

      let playbackStarted =
  false;

try {
        await player.play();

        playbackStarted =
          true;
      } catch {
        /*
        * Một số trình duyệt có thể chặn
        * việc tự động phát âm thanh.
        * Trình phát vẫn được hiển thị để
        * người dùng tự nhấn nút Play.
        */
      }

      player.scrollIntoView({
        behavior:
          'smooth',

        block:
          'nearest',
      });

      showToast(
        'success',

        playbackStarted
          ? 'Đang phát lại file âm thanh.'
          : (
              'Đã tải âm thanh. ' +
              'Hãy nhấn nút Play để nghe.'
            )
      );
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? error.message
          : 'Không thể phát file âm thanh.'
      );
    } finally {
      button.disabled =
        false;

      button.textContent =
        originalText;
    }
  }

  async function handleDownload(
    button
  ) {
const jobId =
  button.dataset.jobId;

const extension =
  button.dataset.extension ||
  'wav';

if (!jobId) {
      showToast(
        'error',
        'Không xác định được file cần tải.'
      );

      return;
    }

    const originalText =
      button.textContent;

    button.disabled =
      true;

    button.textContent =
      'Đang tải...';

    try {
const blob =
  await requestHistoryAudioBlob(
    jobId,
    'download'
  );

      const objectUrl =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          'a'
        );

      link.href =
        objectUrl;

      link.download =
        `tts-history-${jobId}.${extension}`;

      document.body.appendChild(
        link
      );

      link.click();
      link.remove();

      window.setTimeout(
        function () {
          URL.revokeObjectURL(
            objectUrl
          );
        },
        1000
      );

      showToast(
        'success',
        'Đã bắt đầu tải file âm thanh.'
      );
    } catch (error) {
      showToast(
        'error',
        error instanceof Error
          ? error.message
          : 'Không thể tải file âm thanh.'
      );
    } finally {
      button.disabled =
        false;

      button.textContent =
        originalText;
    }
  }
async function requestDeleteHistory(
  ttsJobId
) {
  const normalizedTtsJobId =
    String(
      ttsJobId || ''
    ).trim();

  if (!normalizedTtsJobId) {
    throw new Error(
      'Không xác định được lịch sử cần xóa.'
    );
  }

  const response =
    await AuthStore.authFetch(
      '/api/tts/history/' +
        encodeURIComponent(
          normalizedTtsJobId
        ),
      {
        method:
          'DELETE',
      }
    );

  let payload = null;

  try {
    payload =
      await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(
        payload,
        'Không thể xóa lịch sử giọng đọc.'
      )
    );
  }

  return payload;
}

async function handleDelete(
  button
) {
  const jobId =
    button.dataset.jobId;

  if (!jobId) {
    showToast(
      'error',
      'Không xác định được lịch sử cần xóa.'
    );

    return;
  }

  const confirmed =
    window.confirm(
      'Bạn có chắc muốn xóa lịch sử này không?\n\n' +
      'Mục này sẽ không còn xuất hiện trong lịch sử.'
    );

  if (!confirmed) {
    return;
  }

  const originalText =
    button.textContent;

  button.disabled =
    true;

  button.textContent =
    'Đang xóa...';

  try {
    await requestDeleteHistory(
      jobId
    );

    revokeAudioUrl(
      jobId
    );

    /*
     * Nếu xóa mục cuối cùng của một
     * trang lớn hơn trang 1, quay lại
     * trang liền trước.
     */
    if (
      state.items.length === 1 &&
      state.page > 1
    ) {
      state.page -= 1;
    }

    showToast(
      'success',
      'Đã xóa lịch sử tạo giọng đọc.'
    );

    await loadHistory();
  } catch (error) {
    showToast(
      'error',
      error instanceof Error
        ? error.message
        : 'Không thể xóa lịch sử giọng đọc.'
    );

    button.disabled =
      false;

    button.textContent =
      originalText;
  }
}
async function requestRestoreHistory(
  ttsJobId
) {
  const response =
    await AuthStore.authFetch(
      '/api/tts/history/' +
        encodeURIComponent(
          ttsJobId
        ) +
        '/restore',
      {
        method:
          'PATCH',
      }
    );

  let payload = null;

  try {
    payload =
      await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(
        payload,
        'Không thể khôi phục lịch sử.'
      )
    );
  }

  return payload;
}

async function requestPermanentDeleteHistory(
  ttsJobId
) {
  const response =
    await AuthStore.authFetch(
      '/api/tts/history/' +
        encodeURIComponent(
          ttsJobId
        ) +
        '/permanent',
      {
        method:
          'DELETE',
      }
    );

  let payload = null;

  try {
    payload =
      await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(
        payload,
        'Không thể xóa vĩnh viễn lịch sử.'
      )
    );
  }

  return payload;
}

async function handleRestore(
  button
) {
  const jobId =
    button.dataset.jobId;

  if (!jobId) {
    return;
  }

  const originalText =
    button.textContent;

  button.disabled =
    true;

  button.textContent =
    'Đang khôi phục...';

  try {
    await requestRestoreHistory(
      jobId
    );

    if (
      state.items.length === 1 &&
      state.page > 1
    ) {
      state.page -= 1;
    }

    showToast(
      'success',
      'Đã khôi phục lịch sử.'
    );

    await loadHistory();
  } catch (error) {
    showToast(
      'error',
      error instanceof Error
        ? error.message
        : 'Không thể khôi phục lịch sử.'
    );

    button.disabled =
      false;

    button.textContent =
      originalText;
  }
}

async function handlePermanentDelete(
  button
) {
  const jobId =
    button.dataset.jobId;

  if (!jobId) {
    return;
  }

  const confirmed =
    window.confirm(
      'Xóa vĩnh viễn lịch sử này?\n\n' +
      'File WAV trên Cloudflare R2 và dữ liệu liên quan ' +
      'sẽ bị xóa hoàn toàn. Thao tác này không thể khôi phục.'
    );

  if (!confirmed) {
    return;
  }

  const originalText =
    button.textContent;

  button.disabled =
    true;

  button.textContent =
    'Đang xóa...';

  try {
    await requestPermanentDeleteHistory(
      jobId
    );

    revokeAudioUrl(
      jobId
    );

    if (
      state.items.length === 1 &&
      state.page > 1
    ) {
      state.page -= 1;
    }

    showToast(
      'success',
      'Đã xóa vĩnh viễn lịch sử và file âm thanh.'
    );

    await loadHistory();
  } catch (error) {
    showToast(
      'error',
      error instanceof Error
        ? error.message
        : 'Không thể xóa vĩnh viễn lịch sử.'
    );

    button.disabled =
      false;

    button.textContent =
      originalText;
  }
}
  function handleReuse(
    button
  ) {
    const jobId =
      button.dataset.jobId;

    const item =
      findHistoryItem(
        jobId
      );

    if (!item) {
      showToast(
        'error',
        'Không tìm thấy nội dung lịch sử.'
      );

      return;
    }

    localStorage.setItem(
      'ttsDraftText',
      item.sourceText || ''
    );

    if (
      item.destination?.name
    ) {
      localStorage.setItem(
        'ttsSourceName',
        item.destination.name
      );
    } else {
      localStorage.removeItem(
        'ttsSourceName'
      );
    }

    window.location.href =
      '/tts.html';
  }

  elements.filterForm
    ?.addEventListener(
      'submit',
      function (event) {
        event.preventDefault();

        state.page = 1;

        loadHistory();
      }
    );

  elements.resetButton
    ?.addEventListener(
      'click',
      function () {
        elements.filterForm
          .reset();

        state.page = 1;

        loadHistory();
      }
    );

  elements.refreshButton
    ?.addEventListener(
      'click',
      loadHistory
    );

  elements.retryButton
    ?.addEventListener(
      'click',
      loadHistory
    );

  elements.previousButton
    ?.addEventListener(
      'click',
      function () {
        if (
          !state.pagination
            ?.hasPreviousPage
        ) {
          return;
        }

        state.page -= 1;

        loadHistory();

        window.scrollTo({
          top:
            elements.filterForm
              .offsetTop - 100,

          behavior:
            'smooth',
        });
      }
    );

  elements.nextButton
    ?.addEventListener(
      'click',
      function () {
        if (
          !state.pagination
            ?.hasNextPage
        ) {
          return;
        }

        state.page += 1;

        loadHistory();

        window.scrollTo({
          top:
            elements.filterForm
              .offsetTop - 100,

          behavior:
            'smooth',
        });
      }
    );

  elements.list
    ?.addEventListener(
      'click',
      function (event) {
        const button =
          event.target.closest(
            '[data-history-action]'
          );

        if (!button) {
          return;
        }

        const action =
          button.dataset
            .historyAction;

        if (action === 'listen') {
          handleListen(
            button
          );

          return;
        }

        if (action === 'download') {
          handleDownload(
            button
          );

          return;
        }

        if (action === 'reuse') {
          handleReuse(
            button
          );

          return;
        }

        if (action === 'delete') {
          handleDelete(
            button
          );
        }

        if (action === 'restore') {
          handleRestore(
            button
          );

          return;
        }

        if (
          action ===
          'permanent-delete'
        ) {
          handlePermanentDelete(
            button
          );
        }
      }
    );

  window.addEventListener(
    'beforeunload',
    revokeAllAudioUrls
  );
  initializeHistoryMode();
  loadHistory();
})();