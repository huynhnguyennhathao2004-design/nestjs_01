const ttsText = document.getElementById('ttsText');
const charCount = document.getElementById('charCount');
const voiceSelect = document.getElementById('voiceSelect');
const fileNameInput = document.getElementById('fileName');

const pasteBtn = document.getElementById('pasteBtn');
const clearBtn = document.getElementById('clearBtn');
const resetBtn = document.getElementById('resetBtn');
const generateBtn = document.getElementById('generateBtn');

const ttsMessage = document.getElementById('ttsMessage');
const audioPlaceholder = document.getElementById('audioPlaceholder');
const audioResult = document.getElementById('audioResult');
const audioPlayer = document.getElementById('audioPlayer');
const downloadLink = document.getElementById('downloadLink');

const ttsSourceNotice = document.getElementById('ttsSourceNotice');
const ttsSourceName = document.getElementById('ttsSourceName');
const clearSourceBtn = document.getElementById('clearSourceBtn');


let currentAudioUrl = null;

function updateCharCount() {
  const length = ttsText.value.trim().length;
  charCount.textContent = `${length} ký tự`;
}

function setMessage(message, type = 'error') {
  ttsMessage.textContent = message;

  if (type === 'success') {
    ttsMessage.classList.add('success');
  } else {
    ttsMessage.classList.remove('success');
  }
}

function clearMessage() {
  ttsMessage.textContent = '';
  ttsMessage.classList.remove('success');
}

function createSafeFileName(name) {
  const fallbackName = 'travel-tts-audio';

  const safeName = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');

  return safeName || fallbackName;
}

function showLoading(isLoading) {
  if (isLoading) {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Đang tạo audio...';
  } else {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Tạo audio';
  }
}

function resetAudioResult() {
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }

  audioPlayer.removeAttribute('src');
  downloadLink.removeAttribute('href');

  audioResult.classList.add('hidden');
  audioPlaceholder.classList.remove('hidden');
}

function loadDraftText() {
  const savedDraft = localStorage.getItem('ttsDraftText');

  if (savedDraft) {
    ttsText.value = savedDraft;
    localStorage.removeItem('ttsDraftText');
  }

  updateCharCount();
}

ttsText.addEventListener('input', function () {
  updateCharCount();
  clearMessage();
});

pasteBtn.addEventListener('click', async function () {
  try {
    const text = await navigator.clipboard.readText();

    if (!text.trim()) {
      setMessage('Clipboard không có nội dung để dán.');
      return;
    }

    ttsText.value = text;
    updateCharCount();
    setMessage('Đã dán nội dung vào ô văn bản. Bạn có thể chỉnh sửa trước khi tạo audio.', 'success');
  } catch (error) {
    setMessage('Trình duyệt không cho phép đọc clipboard. Bạn có thể dán thủ công bằng Ctrl + V.');
  }
});

clearBtn.addEventListener('click', function () {
  ttsText.value = '';
  updateCharCount();
  resetAudioResult();
  clearMessage();
  ttsText.focus();
});

resetBtn.addEventListener('click', function () {
  ttsText.value = '';
  fileNameInput.value = 'travel-tts-audio';
  voiceSelect.selectedIndex = 0;

  updateCharCount();
  resetAudioResult();
  clearMessage();
  ttsText.focus();
});

generateBtn.addEventListener('click', async function () {
  const text = ttsText.value.trim();
  const voice = voiceSelect.value;
  const fileName = createSafeFileName(fileNameInput.value);

  if (!text) {
    setMessage('Vui lòng nhập nội dung cần chuyển thành giọng đọc.');
    ttsText.focus();
    return;
  }

  if (text.length < 10) {
    setMessage('Nội dung quá ngắn. Vui lòng nhập ít nhất 10 ký tự.');
    return;
  }

  try {
    showLoading(true);
    clearMessage();
    resetAudioResult();

    const response = await fetch('/tts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        voice: voice
      })
    });

    if (!response.ok) {
      throw new Error('Không thể tạo audio. Vui lòng kiểm tra API TTS.');
    }

    const audioBlob = await response.blob();

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Audio trả về không hợp lệ.');
    }

    currentAudioUrl = URL.createObjectURL(audioBlob);

    audioPlayer.src = currentAudioUrl;
    downloadLink.href = currentAudioUrl;
    downloadLink.download = `${fileName}.mp3`;

    audioPlaceholder.classList.add('hidden');
    audioResult.classList.remove('hidden');

    setMessage('Tạo audio thành công. Bạn có thể nghe hoặc tải file MP3.', 'success');
  } catch (error) {
    setMessage(error.message || 'Đã xảy ra lỗi khi tạo audio.');
  } finally {
    showLoading(false);
  }
});

loadDraftText();

function loadDraftTextFromReview() {
  const draftText = localStorage.getItem('ttsDraftText');

  if (!draftText) return;

  ttsText.value = draftText;

  localStorage.removeItem('ttsDraftText');

  if (typeof updateCharCount === 'function') {
    updateCharCount();
  }

  ttsText.focus();
}

loadDraftTextFromReview();

function createReviewContent(place) {
  const features = place.features && place.features.length > 0
    ? place.features.map(function (feature) {
        return `- ${feature.title}: ${feature.text}`;
      }).join('\n')
    : '- Chưa có thông tin nổi bật.';

  const highlights = place.highlights && place.highlights.length > 0
    ? place.highlights.join(', ')
    : 'Chưa có thông tin';

  const foods = place.foods && place.foods.length > 0
    ? place.foods.join(', ')
    : 'Chưa có thông tin';

  return `
${place.name}

${place.description}

Thông tin địa điểm:
- Khu vực: ${place.region}
- Loại hình du lịch: ${place.type}
- Thời điểm nên đi: ${place.time}

Đặc điểm nổi bật:
${features}

Điểm nên khám phá:
${highlights}

Ẩm thực gợi ý:
${foods}
  `.trim();
}

function loadPlaceContentFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const placeId = params.get('id');

  if (!placeId) return;

  const destinations = window.destinations || [];
  const place = destinations.find(function (item) {
    return item.id === placeId;
  });

  if (!place) return;

  const reviewContent = createReviewContent(place);

  ttsText.value = reviewContent;

  if (ttsSourceNotice && ttsSourceName) {
    ttsSourceName.textContent = place.name;
    ttsSourceNotice.classList.remove('hidden');
  }

  if (fileNameInput) {
    fileNameInput.value = `tts-${place.id}`;
  }

  updateCharCount();

  setMessage(
    `Đã lấy nội dung review của ${place.name}. Bạn có thể chỉnh sửa trước khi tạo audio.`,
    'success'
  );
}

if (clearSourceBtn) {
  clearSourceBtn.addEventListener('click', function () {
    ttsText.value = '';
    fileNameInput.value = 'travel-tts-audio';

    if (ttsSourceNotice) {
      ttsSourceNotice.classList.add('hidden');
    }

    updateCharCount();
    clearMessage();
    ttsText.focus();

    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  });
}

loadPlaceContentFromUrl();