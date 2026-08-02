'use strict';

const destinationEditorState = {
  destinationId: new URLSearchParams(
    window.location.search
  ).get('id'),

  destination: null,
  options: null,
  loading: false,
  slugEdited: false,

  imageEditor: {
    editingImageId: null,
    saving: false,
    pendingIds: new Set()
  },

  featureEditor: {
    editingFeatureId: null,
    saving: false,
    pendingIds: new Set()
  },

  attractionEditor: {
    editingAttractionId: null,
    saving: false,
    pendingIds: new Set()
  },
    foodEditor: {
    editingFoodId: null,
    saving: false,
    pendingIds: new Set()
  },
    formState: {
    baseline: '',
    dirty: false,
    trackingEnabled: false,
    bypassNavigationGuard: false
  }
};

const destinationEditorForm =
  document.getElementById(
    'destinationEditorForm'
  );

const destinationNameInput =
  document.getElementById(
    'destinationNameInput'
  );

const destinationSlugInput =
  document.getElementById(
    'destinationSlugInput'
  );

const destinationShortDescriptionInput =
  document.getElementById(
    'destinationShortDescriptionInput'
  );

const destinationDescriptionInput =
  document.getElementById(
    'destinationDescriptionInput'
  );

const destinationProvinceSelect =
  document.getElementById(
    'destinationProvinceSelect'
  );

const destinationPrimaryCategorySelect =
  document.getElementById(
    'destinationPrimaryCategorySelect'
  );

const destinationCategoryCheckboxes =
  document.getElementById(
    'destinationCategoryCheckboxes'
  );

const destinationBestTimeInput =
  document.getElementById(
    'destinationBestTimeInput'
  );

const destinationMapQueryInput =
  document.getElementById(
    'destinationMapQueryInput'
  );

const destinationLatitudeInput =
  document.getElementById(
    'destinationLatitudeInput'
  );

const destinationLongitudeInput =
  document.getElementById(
    'destinationLongitudeInput'
  );

const destinationMetaTitleInput =
  document.getElementById(
    'destinationMetaTitleInput'
  );

const destinationMetaDescriptionInput =
  document.getElementById(
    'destinationMetaDescriptionInput'
  );

const saveDestinationBtn =
  document.getElementById(
    'saveDestinationBtn'
  );

const viewPublicDestinationBtn =
  document.getElementById(
    'viewPublicDestinationBtn'
  );
const editorSaveState =
  document.getElementById(
    'editorSaveState'
  );
  const destinationImagesSection =
  document.getElementById(
    'destinationImagesSection'
  );

const destinationImageList =
  document.getElementById(
    'destinationImageList'
  );

const destinationImageEmpty =
  document.getElementById(
    'destinationImageEmpty'
  );

const destinationImageResultLine =
  document.getElementById(
    'destinationImageResultLine'
  );

const destinationImageUrlInput =
  document.getElementById(
    'destinationImageUrlInput'
  );

const destinationImageAltInput =
  document.getElementById(
    'destinationImageAltInput'
  );

const destinationImageTypeSelect =
  document.getElementById(
    'destinationImageTypeSelect'
  );

const destinationImageSortOrderInput =
  document.getElementById(
    'destinationImageSortOrderInput'
  );

const destinationImageIsActiveInput =
  document.getElementById(
    'destinationImageIsActiveInput'
  );

const destinationImageSourceUrlInput =
  document.getElementById(
    'destinationImageSourceUrlInput'
  );

const destinationImageCreditInput =
  document.getElementById(
    'destinationImageCreditInput'
  );

const destinationImageFormTitle =
  document.getElementById(
    'destinationImageFormTitle'
  );

const destinationImageFormDescription =
  document.getElementById(
    'destinationImageFormDescription'
  );

const destinationImageActiveHelp =
  document.getElementById(
    'destinationImageActiveHelp'
  );

const saveDestinationImageBtn =
  document.getElementById(
    'saveDestinationImageBtn'
  );

const resetDestinationImageBtn =
  document.getElementById(
    'resetDestinationImageBtn'
  );

const cancelEditDestinationImageBtn =
  document.getElementById(
    'cancelEditDestinationImageBtn'
  );
  const destinationFeaturesSection =
  document.getElementById(
    'destinationFeaturesSection'
  );

const destinationFeatureList =
  document.getElementById(
    'destinationFeatureList'
  );

const destinationFeatureEmpty =
  document.getElementById(
    'destinationFeatureEmpty'
  );

const destinationFeatureResultLine =
  document.getElementById(
    'destinationFeatureResultLine'
  );

const destinationFeatureTitleInput =
  document.getElementById(
    'destinationFeatureTitleInput'
  );

const destinationFeatureContentInput =
  document.getElementById(
    'destinationFeatureContentInput'
  );

const destinationFeatureContentCounter =
  document.getElementById(
    'destinationFeatureContentCounter'
  );

const destinationFeatureIconInput =
  document.getElementById(
    'destinationFeatureIconInput'
  );

const destinationFeatureSortOrderInput =
  document.getElementById(
    'destinationFeatureSortOrderInput'
  );

const destinationFeatureFormTitle =
  document.getElementById(
    'destinationFeatureFormTitle'
  );

const destinationFeatureFormDescription =
  document.getElementById(
    'destinationFeatureFormDescription'
  );

const saveDestinationFeatureBtn =
  document.getElementById(
    'saveDestinationFeatureBtn'
  );

const resetDestinationFeatureBtn =
  document.getElementById(
    'resetDestinationFeatureBtn'
  );

const cancelEditDestinationFeatureBtn =
  document.getElementById(
    'cancelEditDestinationFeatureBtn'
  );
  const destinationAttractionsSection =
  document.getElementById(
    'destinationAttractionsSection'
  );

const destinationAttractionList =
  document.getElementById(
    'destinationAttractionList'
  );

const destinationAttractionEmpty =
  document.getElementById(
    'destinationAttractionEmpty'
  );

const destinationAttractionResultLine =
  document.getElementById(
    'destinationAttractionResultLine'
  );

const destinationAttractionNameInput =
  document.getElementById(
    'destinationAttractionNameInput'
  );

const destinationAttractionDescriptionInput =
  document.getElementById(
    'destinationAttractionDescriptionInput'
  );

const destinationAttractionDescriptionCounter =
  document.getElementById(
    'destinationAttractionDescriptionCounter'
  );

const destinationAttractionAddressInput =
  document.getElementById(
    'destinationAttractionAddressInput'
  );

const destinationAttractionMapQueryInput =
  document.getElementById(
    'destinationAttractionMapQueryInput'
  );

const destinationAttractionLatitudeInput =
  document.getElementById(
    'destinationAttractionLatitudeInput'
  );

const destinationAttractionLongitudeInput =
  document.getElementById(
    'destinationAttractionLongitudeInput'
  );

const destinationAttractionImageUrlInput =
  document.getElementById(
    'destinationAttractionImageUrlInput'
  );

const destinationAttractionImageAltInput =
  document.getElementById(
    'destinationAttractionImageAltInput'
  );

const destinationAttractionSourceUrlInput =
  document.getElementById(
    'destinationAttractionSourceUrlInput'
  );

const destinationAttractionImageCreditInput =
  document.getElementById(
    'destinationAttractionImageCreditInput'
  );

const destinationAttractionSortOrderInput =
  document.getElementById(
    'destinationAttractionSortOrderInput'
  );

const destinationAttractionIsActiveInput =
  document.getElementById(
    'destinationAttractionIsActiveInput'
  );

const destinationAttractionFormTitle =
  document.getElementById(
    'destinationAttractionFormTitle'
  );

const destinationAttractionFormDescription =
  document.getElementById(
    'destinationAttractionFormDescription'
  );

const saveDestinationAttractionBtn =
  document.getElementById(
    'saveDestinationAttractionBtn'
  );

const resetDestinationAttractionBtn =
  document.getElementById(
    'resetDestinationAttractionBtn'
  );

const cancelEditDestinationAttractionBtn =
  document.getElementById(
    'cancelEditDestinationAttractionBtn'
  );
const destinationFoodsSection =
  document.getElementById(
    'destinationFoodsSection'
  );

const destinationFoodList =
  document.getElementById(
    'destinationFoodList'
  );

const destinationFoodEmpty =
  document.getElementById(
    'destinationFoodEmpty'
  );

const destinationFoodResultLine =
  document.getElementById(
    'destinationFoodResultLine'
  );

const destinationFoodNameInput =
  document.getElementById(
    'destinationFoodNameInput'
  );

const destinationFoodDescriptionInput =
  document.getElementById(
    'destinationFoodDescriptionInput'
  );

const destinationFoodDescriptionCounter =
  document.getElementById(
    'destinationFoodDescriptionCounter'
  );

const destinationFoodImageUrlInput =
  document.getElementById(
    'destinationFoodImageUrlInput'
  );

const destinationFoodImageAltInput =
  document.getElementById(
    'destinationFoodImageAltInput'
  );

const destinationFoodPriceMinInput =
  document.getElementById(
    'destinationFoodPriceMinInput'
  );

const destinationFoodPriceMaxInput =
  document.getElementById(
    'destinationFoodPriceMaxInput'
  );

const destinationFoodPriceNoteInput =
  document.getElementById(
    'destinationFoodPriceNoteInput'
  );

const destinationFoodSuggestedAreaInput =
  document.getElementById(
    'destinationFoodSuggestedAreaInput'
  );

const destinationFoodSourceUrlInput =
  document.getElementById(
    'destinationFoodSourceUrlInput'
  );

const destinationFoodImageCreditInput =
  document.getElementById(
    'destinationFoodImageCreditInput'
  );

const destinationFoodSortOrderInput =
  document.getElementById(
    'destinationFoodSortOrderInput'
  );

const destinationFoodIsActiveInput =
  document.getElementById(
    'destinationFoodIsActiveInput'
  );

const destinationFoodFormTitle =
  document.getElementById(
    'destinationFoodFormTitle'
  );

const destinationFoodFormDescription =
  document.getElementById(
    'destinationFoodFormDescription'
  );

const saveDestinationFoodBtn =
  document.getElementById(
    'saveDestinationFoodBtn'
  );

const resetDestinationFoodBtn =
  document.getElementById(
    'resetDestinationFoodBtn'
  );

const cancelEditDestinationFoodBtn =
  document.getElementById(
    'cancelEditDestinationFoodBtn'
  );

/* =====================================
   HỖ TRỢ CHUNG
===================================== */

function getCurrentUser() {
  try {
    const rawUser =
      sessionStorage.getItem('user');

    return rawUser
      ? JSON.parse(rawUser)
      : null;
  } catch {
    return null;
  }
}

function isAdmin(user) {
  return Boolean(
    user &&
    String(user.role || '')
      .toUpperCase() === 'ADMIN'
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  if (!value) {
    return 'Chưa xác định';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Chưa xác định';
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(date);
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(/^-+|-+$/g, '');
}

function nullableString(value) {
  const normalized =
    String(value ?? '').trim();

  return normalized || null;
}

function optionalNumber(value) {
  const normalized =
    String(value ?? '').trim();

  if (!normalized) {
    return null;
  }

  const numberValue =
    Number(normalized);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

function readResponseData(response) {
  return response
    .json()
    .catch(function () {
      return null;
    });
}

function getErrorMessage(
  responseData,
  fallbackMessage
) {
  if (
    responseData &&
    Array.isArray(
      responseData.message
    )
  ) {
    return responseData.message.join(
      ' '
    );
  }

  if (
    responseData &&
    typeof responseData.message ===
      'string'
  ) {
    return responseData.message;
  }

  return fallbackMessage;
}

function showToast(
  message,
  type = 'info'
) {
  if (
    window.Toast &&
    typeof window.Toast[type] ===
      'function'
  ) {
    window.Toast[type](message);
    return;
  }

  console.log(message);
}
async function confirmEditorAction(
  options
) {
  if (
    window.AppModal &&
    typeof window.AppModal.confirm ===
      'function'
  ) {
    return window.AppModal.confirm(
      options
    );
  }

  return window.confirm(
    options.message ||
    'Bạn có chắc muốn tiếp tục?'
  );
}

function showEditorMessage(
  message,
  type = 'error'
) {
  const element =
    document.getElementById(
      'destinationEditorMessage'
    );

  if (!element) {
    return;
  }

  element.textContent =
    message;

  element.className =
    `destination-editor-message show ${type}`;

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

function hideEditorMessage() {
  const element =
    document.getElementById(
      'destinationEditorMessage'
    );

  if (!element) {
    return;
  }

  element.textContent = '';
  element.className =
    'destination-editor-message';
}

async function requestAdminJson(
  url,
  options = {}
) {
  if (
    !window.AuthStore ||
    typeof window.AuthStore
      .authFetch !== 'function'
  ) {
    throw new Error(
      'Thành phần xác thực chưa được tải.'
    );
  }

  const response =
    await window.AuthStore.authFetch(
      url,
      options
    );

  const responseData =
    await readResponseData(
      response
    );

  if (response.status === 401) {
    window.location.replace(
      '/login.html'
    );

    throw new Error(
      'Phiên đăng nhập đã hết hạn.'
    );
  }

  if (response.status === 403) {
    window.location.replace(
      '/index.html'
    );

    throw new Error(
      'Bạn không có quyền quản trị.'
    );
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        responseData,
        'Không thể thực hiện yêu cầu.'
      )
    );
  }

  return responseData;
}

/* =====================================
   GIAO DIỆN
===================================== */

function getStatusInformation(status) {
  const statusMap = {
    DRAFT: {
      label: 'Bản nháp',
      className: 'status-draft'
    },

    PUBLISHED: {
      label: 'Đã xuất bản',
      className: 'status-published'
    },

    HIDDEN: {
      label: 'Đang ẩn',
      className: 'status-hidden'
    },

    ARCHIVED: {
      label: 'Lưu trữ',
      className: 'status-archived'
    }
  };

  return (
    statusMap[
      String(status || '')
        .toUpperCase()
    ] ||
    statusMap.DRAFT
  );
}

function updateTextCounter(
  input,
  counter
) {
  if (!input || !counter) {
    return;
  }

  counter.textContent =
    String(input.value.length);
}

function setEditorLoading(
  isLoading
) {
  destinationEditorState.loading =
    isLoading;

  if (saveDestinationBtn) {
    saveDestinationBtn.disabled =
      isLoading;

    saveDestinationBtn.textContent =
      isLoading
        ? 'Đang lưu...'
        : destinationEditorState
            .destinationId
          ? 'Lưu thay đổi'
          : 'Lưu địa điểm';
  }
}

function updateEditorMode() {
  const isEditMode =
    Boolean(
      destinationEditorState
        .destinationId
    );

  const title =
    document.getElementById(
      'destinationEditorTitle'
    );

  const subtitle =
    document.getElementById(
      'destinationEditorSubtitle'
    );

  const modeBadge =
    document.getElementById(
      'editorModeBadge'
    );

  const submitTitle =
    document.getElementById(
      'editorSubmitTitle'
    );

  const submitDescription =
    document.getElementById(
      'editorSubmitDescription'
    );

  document.title =
    isEditMode
      ? 'Chỉnh sửa địa điểm - Vietnam Travel TTS'
      : 'Thêm địa điểm - Vietnam Travel TTS';

  if (title) {
    title.textContent =
      isEditMode
        ? 'Chỉnh sửa địa điểm'
        : 'Thêm địa điểm mới';
  }

  if (subtitle) {
    subtitle.textContent =
      isEditMode
        ? 'Cập nhật thông tin và nội dung của địa điểm du lịch.'
        : 'Nhập thông tin cơ bản của địa điểm du lịch.';
  }

  if (modeBadge) {
    modeBadge.textContent =
      isEditMode
        ? 'Chỉnh sửa'
        : 'Thêm mới';
  }

  if (submitTitle) {
    submitTitle.textContent =
      isEditMode
        ? 'Lưu các thay đổi'
        : 'Tạo địa điểm mới';
  }

  if (submitDescription) {
    submitDescription.textContent =
      isEditMode
        ? 'Các thay đổi sẽ được ghi vào nhật ký quản trị.'
        : 'Địa điểm mới sẽ được lưu dưới dạng bản nháp.';
  }

  setEditorLoading(false);
}

function renderEditorSummary(
  destination
) {
  const summary =
    document.getElementById(
      'destinationEditorSummary'
    );

  if (!summary) {
    return;
  }

  summary.hidden = false;

  document.getElementById(
    'summaryDestinationId'
  ).textContent =
    destination.id || '—';

  document.getElementById(
    'summaryCreatedAt'
  ).textContent =
    formatDate(
      destination.createdAt
    );

  document.getElementById(
    'summaryUpdatedAt'
  ).textContent =
    formatDate(
      destination.updatedAt
    );

  document.getElementById(
    'summaryFeatured'
  ).textContent =
    destination.isFeatured
      ? 'Có'
      : 'Không';

  const statusInfo =
    getStatusInformation(
      destination.status
    );

  const statusBadge =
    document.getElementById(
      'editorStatusBadge'
    );

  if (statusBadge) {
    statusBadge.hidden = false;
    statusBadge.textContent =
      statusInfo.label;

    statusBadge.className =
      `editor-status-badge ${statusInfo.className}`;
  }

  if (
    destination.status ===
      'PUBLISHED' &&
    destination.slug &&
    viewPublicDestinationBtn
  ) {
    viewPublicDestinationBtn.hidden =
      false;

    viewPublicDestinationBtn.href =
      `/destinations-detail.html?id=${encodeURIComponent(
        destination.slug
      )}`;
  }
}

function updateRelatedManagement(
  destination
) {
  const buttons =
    document.querySelectorAll(
      '[data-related-section]'
    );

  const notice =
    document.getElementById(
      'destinationRelatedNotice'
    );

  const hasDestination =
    Boolean(
      destinationEditorState
        .destinationId
    );
    if (destinationImagesSection) {
  destinationImagesSection.hidden =
    !hasDestination;
}
if (destinationFeaturesSection) {
  destinationFeaturesSection.hidden =
    !hasDestination;
}
if (destinationAttractionsSection) {
  destinationAttractionsSection.hidden =
    !hasDestination;
}
if (destinationFoodsSection) {
  destinationFoodsSection.hidden =
    !hasDestination;
}

  buttons.forEach(
    function (button) {
      button.disabled =
        !hasDestination;
    }
  );

  if (notice) {
    notice.classList.toggle(
      'ready',
      hasDestination
    );

    notice.textContent =
      hasDestination
        ? 'Địa điểm đã được lưu. Các phần quản lý nội dung liên quan sẽ được hoàn thiện trong các bước tiếp theo.'
        : 'Hãy lưu địa điểm trước khi thêm ảnh và các nội dung liên quan.';
  }

  document.getElementById(
    'relatedImageCount'
  ).textContent =
    `${destination?.images?.length || 0} mục`;

  document.getElementById(
    'relatedFeatureCount'
  ).textContent =
    `${destination?.features?.length || 0} mục`;

  document.getElementById(
    'relatedAttractionCount'
  ).textContent =
    `${destination?.attractions?.length || 0} mục`;

  document.getElementById(
    'relatedFoodCount'
  ).textContent =
    `${destination?.foods?.length || 0} mục`;
    renderDestinationImages();
    renderDestinationFeatures();
    renderDestinationAttractions();
    renderDestinationFoods();
}

/* =====================================
   THEO DÕI DỮ LIỆU CHƯA LƯU
===================================== */

function getDestinationMainFields() {
  return [
    destinationNameInput,
    destinationSlugInput,
    destinationShortDescriptionInput,
    destinationDescriptionInput,
    destinationProvinceSelect,
    destinationPrimaryCategorySelect,
    destinationBestTimeInput,
    destinationMapQueryInput,
    destinationLatitudeInput,
    destinationLongitudeInput,
    destinationMetaTitleInput,
    destinationMetaDescriptionInput
  ].filter(Boolean);
}

function createDestinationFormSnapshot() {
  const categoryIds =
    Array.from(
      document.querySelectorAll(
        '[data-category-checkbox]:checked'
      )
    )
      .map(
        function (checkbox) {
          return checkbox.value;
        }
      )
      .sort();

  return JSON.stringify({
    name:
      destinationNameInput
        ?.value || '',

    slug:
      destinationSlugInput
        ?.value || '',

    shortDescription:
      destinationShortDescriptionInput
        ?.value || '',

    description:
      destinationDescriptionInput
        ?.value || '',

    provinceId:
      destinationProvinceSelect
        ?.value || '',

    primaryCategoryId:
      destinationPrimaryCategorySelect
        ?.value || '',

    categoryIds,

    bestTravelTime:
      destinationBestTimeInput
        ?.value || '',

    mapQuery:
      destinationMapQueryInput
        ?.value || '',

    latitude:
      destinationLatitudeInput
        ?.value || '',

    longitude:
      destinationLongitudeInput
        ?.value || '',

    metaTitle:
      destinationMetaTitleInput
        ?.value || '',

    metaDescription:
      destinationMetaDescriptionInput
        ?.value || ''
  });
}

function setEditorSaveIndicator(
  state,
  message
) {
  if (!editorSaveState) {
    return;
  }

  const classMap = {
    saved:
      'editor-save-state-saved',

    dirty:
      'editor-save-state-dirty',

    saving:
      'editor-save-state-saving',

    error:
      'editor-save-state-error'
  };

  editorSaveState.className =
    `editor-save-state ${
      classMap[state] ||
      classMap.saved
    }`;

  editorSaveState.textContent =
    message;
}

function markDestinationEditorClean() {
  destinationEditorState
    .formState
    .baseline =
    createDestinationFormSnapshot();

  destinationEditorState
    .formState
    .dirty = false;

  const savedTime =
    new Intl.DateTimeFormat(
      'vi-VN',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(new Date());

  setEditorSaveIndicator(
    'saved',
    `Đã lưu lúc ${savedTime}`
  );
}

function evaluateDestinationEditorDirtyState() {
  const formState =
    destinationEditorState
      .formState;

  if (!formState.trackingEnabled) {
    return;
  }

  const currentSnapshot =
    createDestinationFormSnapshot();

  const isDirty =
    currentSnapshot !==
    formState.baseline;

  formState.dirty =
    isDirty;

  if (isDirty) {
    setEditorSaveIndicator(
      'dirty',
      'Có thay đổi chưa được lưu'
    );

    return;
  }

  setEditorSaveIndicator(
    'saved',
    'Dữ liệu đã được đồng bộ'
  );
}

function clearDestinationFieldError(
  input
) {
  const field =
    input?.closest(
      '.editor-field'
    );

  if (!field) {
    return;
  }

  field.classList.remove(
    'has-error'
  );

  input.removeAttribute(
    'aria-invalid'
  );

  field
    .querySelector(
      '.editor-field-error'
    )
    ?.remove();
}

function clearDestinationValidationErrors() {
  document
    .querySelectorAll(
      '.editor-field.has-error'
    )
    .forEach(
      function (field) {
        field.classList.remove(
          'has-error'
        );

        field
          .querySelector(
            '.editor-field-error'
          )
          ?.remove();

        field
          .querySelector(
            'input, select, textarea'
          )
          ?.removeAttribute(
            'aria-invalid'
          );
      }
    );
}

function setDestinationFieldError(
  input,
  message
) {
  const field =
    input?.closest(
      '.editor-field'
    );

  if (!field || !input) {
    return;
  }

  clearDestinationFieldError(
    input
  );

  field.classList.add(
    'has-error'
  );

  input.setAttribute(
    'aria-invalid',
    'true'
  );

  const errorElement =
    document.createElement(
      'span'
    );

  errorElement.className =
    'editor-field-error';

  errorElement.textContent =
    message;

  field.appendChild(
    errorElement
  );
}

function validateDestinationEditorForm() {
  clearDestinationValidationErrors();

  const errors = [];

  const name =
    destinationNameInput
      ?.value
      .trim() || '';

  const description =
    destinationDescriptionInput
      ?.value
      .trim() || '';

  const provinceId =
    destinationProvinceSelect
      ?.value || '';

  const primaryCategoryId =
    destinationPrimaryCategorySelect
      ?.value || '';

  const latitudeText =
    destinationLatitudeInput
      ?.value
      .trim() || '';

  const longitudeText =
    destinationLongitudeInput
      ?.value
      .trim() || '';

  if (name.length < 2) {
    setDestinationFieldError(
      destinationNameInput,
      'Tên địa điểm phải có ít nhất 2 ký tự.'
    );

    errors.push(
      destinationNameInput
    );
  }

  if (!provinceId) {
    setDestinationFieldError(
      destinationProvinceSelect,
      'Bạn chưa chọn tỉnh hoặc thành phố.'
    );

    errors.push(
      destinationProvinceSelect
    );
  }

  if (!primaryCategoryId) {
    setDestinationFieldError(
      destinationPrimaryCategorySelect,
      'Bạn chưa chọn danh mục chính.'
    );

    errors.push(
      destinationPrimaryCategorySelect
    );
  }

  if (!description) {
    setDestinationFieldError(
      destinationDescriptionInput,
      'Bạn chưa nhập nội dung giới thiệu.'
    );

    errors.push(
      destinationDescriptionInput
    );
  }

  /*
   * Tọa độ phải có đủ cả hai trường.
   */
  if (
    Boolean(latitudeText) !==
    Boolean(longitudeText)
  ) {
    const message =
      'Bạn phải nhập đồng thời cả vĩ độ và kinh độ.';

    setDestinationFieldError(
      destinationLatitudeInput,
      message
    );

    setDestinationFieldError(
      destinationLongitudeInput,
      message
    );

    errors.push(
      destinationLatitudeInput
    );
  }

  if (latitudeText) {
    const latitude =
      Number(latitudeText);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      setDestinationFieldError(
        destinationLatitudeInput,
        'Vĩ độ phải nằm trong khoảng -90 đến 90.'
      );

      errors.push(
        destinationLatitudeInput
      );
    }
  }

  if (longitudeText) {
    const longitude =
      Number(longitudeText);

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setDestinationFieldError(
        destinationLongitudeInput,
        'Kinh độ phải nằm trong khoảng -180 đến 180.'
      );

      errors.push(
        destinationLongitudeInput
      );
    }
  }

  if (errors.length === 0) {
    return true;
  }

  showEditorMessage(
    'Một số thông tin chưa hợp lệ. Hãy kiểm tra các trường được đánh dấu.'
  );

  errors[0]?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  window.setTimeout(
    function () {
      errors[0]?.focus();
    },
    350
  );

  return false;
}

function setupDestinationUnsavedChangesProtection() {
  const formState =
    destinationEditorState
      .formState;

  getDestinationMainFields().forEach(
    function (field) {
      field.addEventListener(
        'input',
        function () {
          clearDestinationFieldError(
            field
          );

          evaluateDestinationEditorDirtyState();
        }
      );

      field.addEventListener(
        'change',
        function () {
          clearDestinationFieldError(
            field
          );

          evaluateDestinationEditorDirtyState();
        }
      );
    }
  );

  destinationCategoryCheckboxes
    ?.addEventListener(
      'change',
      function () {
        evaluateDestinationEditorDirtyState();
      }
    );

  /*
   * Cảnh báo khi tải lại hoặc đóng tab.
   * Trình duyệt sẽ hiển thị thông báo mặc định.
   */
  window.addEventListener(
    'beforeunload',
    function (event) {
      if (
        !formState.dirty ||
        formState.bypassNavigationGuard
      ) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    }
  );

  /*
   * Xác nhận khi nhấn liên kết trong trang.
   */
  document.addEventListener(
    'click',
    async function (event) {
      const anchor =
        event.target.closest(
          'a[href]'
        );

      if (
        !anchor ||
        !formState.dirty ||
        formState.bypassNavigationGuard ||
        anchor.target === '_blank' ||
        anchor.hasAttribute(
          'download'
        ) ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const href =
        anchor.getAttribute(
          'href'
        );

      if (
        !href ||
        href.startsWith('#')
      ) {
        return;
      }

      event.preventDefault();

      const confirmed =
        await confirmEditorAction({
          type: 'warning',

          title:
            'Thông tin chưa được lưu',

          message:
            'Bạn đang có thay đổi chưa lưu. Rời khỏi trang sẽ làm mất các thay đổi này.',

          confirmText:
            'Rời khỏi trang',

          cancelText:
            'Tiếp tục chỉnh sửa'
        });

      if (!confirmed) {
        return;
      }

      formState.bypassNavigationGuard =
        true;

      window.location.href =
        anchor.href;
    }
  );

  /*
   * Ctrl + S hoặc Command + S để lưu.
   */
  document.addEventListener(
    'keydown',
    function (event) {
      const isSaveShortcut =
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key.toLowerCase() ===
          's';

      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();

      destinationEditorForm
        ?.requestSubmit();
    }
  );

  formState.trackingEnabled =
    true;

  markDestinationEditorClean();
}
/* =====================================
   TÙY CHỌN FORM
===================================== */

function renderProvinceOptions(
  regions
) {
  destinationProvinceSelect.innerHTML =
    `
      <option value="">
        Chọn tỉnh hoặc thành phố
      </option>
    `;

  regions.forEach(
    function (region) {
      const group =
        document.createElement(
          'optgroup'
        );

      group.label =
        region.name;

      const provinces =
        Array.isArray(
          region.provinces
        )
          ? region.provinces
          : [];

      provinces.forEach(
        function (province) {
          const option =
            document.createElement(
              'option'
            );

          option.value =
            province.id;

          option.textContent =
            province.name;

          option.dataset.regionId =
            region.id;

          option.dataset.regionName =
            region.name;

          group.appendChild(
            option
          );
        }
      );

      destinationProvinceSelect
        .appendChild(group);
    }
  );
}

function renderCategoryOptions(
  categories
) {
  destinationPrimaryCategorySelect
    .innerHTML =
    `
      <option value="">
        Chưa chọn danh mục chính
      </option>
    `;

  destinationCategoryCheckboxes
    .innerHTML = '';

  categories.forEach(
    function (category) {
      const option =
        document.createElement(
          'option'
        );

      option.value =
        category.id;

      option.textContent =
        category.name;

      destinationPrimaryCategorySelect
        .appendChild(option);

      const wrapper =
        document.createElement(
          'div'
        );

      wrapper.className =
        'editor-category-option';

      const inputId =
        `category-${category.id}`;

      wrapper.innerHTML = `
        <input
          type="checkbox"
          id="${escapeHtml(inputId)}"
          value="${escapeHtml(category.id)}"
          data-category-checkbox
        />

        <label for="${escapeHtml(inputId)}">
          <span>
            <strong>
              ${escapeHtml(category.name)}
            </strong>

            <span>
              ${escapeHtml(
                category.description ||
                category.slug ||
                'Danh mục địa điểm'
              )}
            </span>
          </span>
        </label>
      `;

      destinationCategoryCheckboxes
        .appendChild(wrapper);
    }
  );
}

async function loadFormOptions() {
  const result =
    await requestAdminJson(
      '/api/admin/destinations/form-options'
    );

  if (!result?.data) {
    throw new Error(
      'Backend không trả về dữ liệu form hợp lệ.'
    );
  }

  destinationEditorState.options =
    result.data;

  renderProvinceOptions(
    Array.isArray(
      result.data.regions
    )
      ? result.data.regions
      : []
  );

  renderCategoryOptions(
    Array.isArray(
      result.data.categories
    )
      ? result.data.categories
      : []
  );
}

/* =====================================
   ĐỔ DỮ LIỆU VÀO FORM
===================================== */

function getDestinationCategoryIds(
  destination
) {
  if (
    Array.isArray(
      destination.categoryIds
    )
  ) {
    return destination.categoryIds;
  }

  if (
    !Array.isArray(
      destination.categories
    )
  ) {
    return [];
  }

  return destination.categories
    .map(function (item) {
      return (
        item.categoryId ||
        item.id ||
        item.category?.id ||
        null
      );
    })
    .filter(Boolean);
}

function fillDestinationForm(
  destination
) {
  destinationEditorState.destination =
    destination;

  destinationNameInput.value =
    destination.name || '';

  destinationSlugInput.value =
    destination.slug || '';

  destinationShortDescriptionInput.value =
    destination.shortDescription || '';

  destinationDescriptionInput.value =
    destination.description || '';

  destinationProvinceSelect.value =
    destination.provinceId ||
    destination.province?.id ||
    '';

  destinationPrimaryCategorySelect.value =
    destination.primaryCategoryId ||
    destination.primaryCategory?.id ||
    '';

  destinationBestTimeInput.value =
    destination.bestTravelTime || '';

  destinationMapQueryInput.value =
    destination.mapQuery || '';

  destinationLatitudeInput.value =
    destination.latitude ?? '';

  destinationLongitudeInput.value =
    destination.longitude ?? '';

  destinationMetaTitleInput.value =
    destination.metaTitle || '';

  destinationMetaDescriptionInput.value =
    destination.metaDescription || '';

  const categoryIds =
    new Set(
      getDestinationCategoryIds(
        destination
      )
    );

  document.querySelectorAll(
    '[data-category-checkbox]'
  ).forEach(
    function (checkbox) {
      checkbox.checked =
        categoryIds.has(
          checkbox.value
        );
    }
  );

  destinationEditorState.slugEdited =
    true;

  updateTextCounter(
    destinationShortDescriptionInput,
    document.getElementById(
      'shortDescriptionCounter'
    )
  );

  updateTextCounter(
    destinationMetaDescriptionInput,
    document.getElementById(
      'metaDescriptionCounter'
    )
  );

  renderEditorSummary(
    destination
  );

  updateRelatedManagement(
    destination
  );
}

async function loadDestination(
  options = {}
) {
  const destinationId =
    destinationEditorState
      .destinationId;

  if (!destinationId) {
    destinationEditorState.destination =
      null;

    updateRelatedManagement(null);

    return;
  }

  const result =
    await requestAdminJson(
      `/api/admin/destinations/${encodeURIComponent(
        destinationId
      )}`
    );

  const responseDestination =
    result?.data || result;

  if (
    !responseDestination ||
    !responseDestination.id
  ) {
    throw new Error(
      'Backend không trả về thông tin địa điểm hợp lệ.'
    );
  }

  const destination = {
    ...responseDestination,

    images:
      Array.isArray(
        responseDestination.images
      )
        ? responseDestination.images
        : [],

    features:
      Array.isArray(
        responseDestination.features
      )
        ? responseDestination.features
        : [],

    attractions:
      Array.isArray(
        responseDestination.attractions
      )
        ? responseDestination.attractions
        : [],

    foods:
      Array.isArray(
        responseDestination.foods
      )
        ? responseDestination.foods
        : []
  };

  const shouldPreserveMainForm =
    destinationEditorState
      .formState
      .dirty &&
    !options.forceFill;

  if (shouldPreserveMainForm) {
    /*
     * Chỉ cập nhật dữ liệu trong state và
     * các danh sách nội dung liên quan.
     * Không ghi đè form thông tin cơ bản.
     */
    destinationEditorState.destination =
      destination;

    renderEditorSummary(
      destination
    );

    updateRelatedManagement(
      destination
    );

    return;
  }

  fillDestinationForm(
    destination
  );
}

/* =====================================
   TẠO PAYLOAD
===================================== */

function getCheckedCategoryIds() {
  return Array.from(
    document.querySelectorAll(
      '[data-category-checkbox]:checked'
    )
  ).map(
    function (checkbox) {
      return checkbox.value;
    }
  );
}

function ensurePrimaryCategoryChecked() {
  const primaryCategoryId =
    destinationPrimaryCategorySelect
      .value;

  if (!primaryCategoryId) {
    return;
  }

  const checkbox =
    document.querySelector(
      `[data-category-checkbox][value="${CSS.escape(
        primaryCategoryId
      )}"]`
    );

  if (checkbox) {
    checkbox.checked = true;
  }
}

function buildDestinationPayload() {
  const name =
    destinationNameInput.value.trim();

  const description =
    destinationDescriptionInput
      .value
      .trim();

  const provinceId =
    destinationProvinceSelect.value;

  if (!name) {
    throw new Error(
      'Bạn chưa nhập tên địa điểm.'
    );
  }

  if (!provinceId) {
    throw new Error(
      'Bạn chưa chọn tỉnh hoặc thành phố.'
    );
  }

  if (!description) {
    throw new Error(
      'Bạn chưa nhập nội dung giới thiệu.'
    );
  }

  ensurePrimaryCategoryChecked();

  const payload = {
    name,
    provinceId,

    primaryCategoryId:
      destinationPrimaryCategorySelect
        .value || null,

    categoryIds:
      getCheckedCategoryIds(),

    shortDescription:
      nullableString(
        destinationShortDescriptionInput
          .value
      ),

    description,

    bestTravelTime:
      nullableString(
        destinationBestTimeInput.value
      ),

    mapQuery:
      nullableString(
        destinationMapQueryInput.value
      ),

    latitude:
      optionalNumber(
        destinationLatitudeInput.value
      ),

    longitude:
      optionalNumber(
        destinationLongitudeInput.value
      ),

    metaTitle:
      nullableString(
        destinationMetaTitleInput.value
      ),

    metaDescription:
      nullableString(
        destinationMetaDescriptionInput
          .value
      )
  };

  const slug =
    destinationSlugInput.value.trim();

  if (slug) {
    payload.slug =
      slugify(slug);
  }

  /*
   * Khi tạo mới, bỏ các trường null để tương thích
   * DTO create. Khi cập nhật, giữ null để có thể
   * xóa dữ liệu cũ.
   */
  if (
    !destinationEditorState
      .destinationId
  ) {
    Object.keys(payload).forEach(
      function (key) {
        if (payload[key] === null) {
          delete payload[key];
        }
      }
    );
  }

  return payload;
}

/* =====================================
   LƯU DỮ LIỆU
===================================== */

async function saveDestination(
  event
) {
  event.preventDefault();

  if (
    destinationEditorState.loading
  ) {
    return;
  }

hideEditorMessage();
clearDestinationValidationErrors();

if (
  !validateDestinationEditorForm()
) {
  return;
}

let payload;

  try {
    payload =
      buildDestinationPayload();
  } catch (error) {
    showEditorMessage(
      error instanceof Error
        ? error.message
        : 'Dữ liệu chưa hợp lệ.'
    );

    return;
  }

  setEditorLoading(true);
  setEditorSaveIndicator(
  'saving',
  'Đang lưu thay đổi...'
);

  try {
    const isEditMode =
      Boolean(
        destinationEditorState
          .destinationId
      );

    const url =
      isEditMode
        ? `/api/admin/destinations/${encodeURIComponent(
            destinationEditorState
              .destinationId
          )}`
        : '/api/admin/destinations';

    const result =
      await requestAdminJson(
        url,
        {
          method:
            isEditMode
              ? 'PATCH'
              : 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json'
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    const savedDestination =
      result?.data;

    showToast(
      result?.message ||
      (
        isEditMode
          ? 'Cập nhật địa điểm thành công.'
          : 'Tạo địa điểm thành công.'
      ),
      'success'
    );

if (
  !isEditMode &&
  savedDestination?.id
) {
  destinationEditorState
    .formState
    .bypassNavigationGuard =
    true;

  window.location.replace(
        `/admin-destination-editor.html?id=${encodeURIComponent(
          savedDestination.id
        )}&created=1`
      );

      return;
    }

      await loadDestination({
        forceFill: true
      });

      markDestinationEditorClean();

      showEditorMessage(
      result?.message ||
      'Lưu địa điểm thành công.',
      'success'
    );
  } catch (error) {
    setEditorSaveIndicator(
      'error',
      'Lưu thất bại'
    );
    console.error(
      'Lỗi lưu địa điểm:',
      error
    );

    showEditorMessage(
      error instanceof Error
        ? error.message
        : 'Không thể lưu địa điểm.'
    );

    showToast(
      error instanceof Error
        ? error.message
        : 'Không thể lưu địa điểm.',
      'error'
    );
  } finally {
    setEditorLoading(false);
  }
}
/* =====================================
   QUẢN LÝ HÌNH ẢNH
===================================== */

function getDestinationImages() {
  const images =
    destinationEditorState
      .destination
      ?.images;

  if (!Array.isArray(images)) {
    return [];
  }

  return [...images].sort(
    function (first, second) {
      const firstCover =
        first.imageType ===
        'COVER'
          ? 0
          : 1;

      const secondCover =
        second.imageType ===
        'COVER'
          ? 0
          : 1;

      if (firstCover !== secondCover) {
        return firstCover - secondCover;
      }

      const sortDifference =
        Number(
          first.sortOrder || 0
        ) -
        Number(
          second.sortOrder || 0
        );

      if (sortDifference !== 0) {
        return sortDifference;
      }

      return String(first.id).localeCompare(
        String(second.id)
      );
    }
  );
}

function findDestinationImage(
  imageId
) {
  return (
    getDestinationImages().find(
      function (image) {
        return image.id === imageId;
      }
    ) ||
    null
  );
}

function renderDestinationImages() {
  if (
    !destinationImageList ||
    !destinationImageEmpty
  ) {
    return;
  }

  const images =
    getDestinationImages();

  if (destinationImageResultLine) {
    destinationImageResultLine.textContent =
      images.length > 0
        ? `Hiện có ${images.length} hình ảnh.`
        : 'Chưa có hình ảnh.';
  }

  const relatedCount =
    document.getElementById(
      'relatedImageCount'
    );

  if (relatedCount) {
    relatedCount.textContent =
      `${images.length} mục`;
  }

  if (images.length === 0) {
    destinationImageList.innerHTML =
      '';

    destinationImageEmpty.hidden =
      false;

    return;
  }

  destinationImageEmpty.hidden =
    true;

  destinationImageList.innerHTML =
    images
      .map(
        function (image) {
          const isPending =
            destinationEditorState
              .imageEditor
              .pendingIds
              .has(image.id);

          const isCover =
            image.imageType ===
            'COVER';

          const isActive =
            Boolean(image.isActive);

          const title =
            image.altText ||
            (
              isCover
                ? 'Ảnh bìa địa điểm'
                : 'Ảnh thư viện'
            );

          return `
            <article
              class="destination-image-item"
              data-image-id="${escapeHtml(
                image.id
              )}"
            >
              <div class="destination-image-preview">
                <img
                  src="${escapeHtml(
                    image.url
                  )}"
                  alt="${escapeHtml(
                    title
                  )}"
                  loading="lazy"
                  data-fallback="/assets/images/bg-vietnam.jpg"
                />

                ${
                  isCover
                    ? `
                      <span
                        class="destination-image-cover-label"
                      >
                        ★ Ảnh bìa
                      </span>
                    `
                    : ''
                }

                ${
                  !isActive
                    ? `
                      <div
                        class="destination-image-inactive-overlay"
                      >
                        Đang tắt
                      </div>
                    `
                    : ''
                }
              </div>

              <div class="destination-image-information">
                <div
                  class="destination-image-information-header"
                >
                  <h4 title="${escapeHtml(title)}">
                    ${escapeHtml(title)}
                  </h4>

                  <span
                    class="
                      destination-image-status-badge
                      ${isActive ? '' : 'inactive'}
                    "
                  >
                    ${
                      isActive
                        ? 'Hoạt động'
                        : 'Đang tắt'
                    }
                  </span>
                </div>

                <span
                  class="destination-image-url"
                  title="${escapeHtml(
                    image.url
                  )}"
                >
                  ${escapeHtml(image.url)}
                </span>

                <div class="destination-image-meta">
                  <span>
                    ${
                      isCover
                        ? 'Ảnh bìa'
                        : 'Thư viện'
                    }
                  </span>

                  <span>
                    Thứ tự:
                    ${escapeHtml(
                      image.sortOrder ?? 0
                    )}
                  </span>

                  ${
                    image.imageCredit
                      ? `
                        <span>
                          ${escapeHtml(
                            image.imageCredit
                          )}
                        </span>
                      `
                      : ''
                  }
                </div>

                <div class="destination-image-actions">
                  <button
                    type="button"
                    class="
                      destination-image-action-btn
                      destination-image-edit-btn
                    "
                    data-image-action="edit"
                    data-image-id="${escapeHtml(
                      image.id
                    )}"
                    ${isPending ? 'disabled' : ''}
                  >
                    Chỉnh sửa
                  </button>

                  ${
                    !isCover
                      ? `
                        <button
                          type="button"
                          class="
                            destination-image-action-btn
                            destination-image-cover-btn
                          "
                          data-image-action="cover"
                          data-image-id="${escapeHtml(
                            image.id
                          )}"
                          ${isPending ? 'disabled' : ''}
                        >
                          Đặt làm ảnh bìa
                        </button>

                        <button
                          type="button"
                          class="
                            destination-image-action-btn
                            ${
                              isActive
                                ? 'destination-image-inactive-btn'
                                : 'destination-image-active-btn'
                            }
                          "
                          data-image-action="active"
                          data-image-id="${escapeHtml(
                            image.id
                          )}"
                          ${isPending ? 'disabled' : ''}
                        >
                          ${
                            isActive
                              ? 'Tắt ảnh'
                              : 'Bật ảnh'
                          }
                        </button>
                      `
                      : ''
                  }

                  <button
                    type="button"
                    class="
                      destination-image-action-btn
                      destination-image-delete-btn
                    "
                    data-image-action="delete"
                    data-image-id="${escapeHtml(
                      image.id
                    )}"
                    ${isPending ? 'disabled' : ''}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </article>
          `;
        }
      )
      .join('');

  window.ImageUtils?.scan(
    destinationImageList
  );
}

function syncDestinationImageActiveControl() {
  if (
    !destinationImageTypeSelect ||
    !destinationImageIsActiveInput
  ) {
    return;
  }

  const isCover =
    destinationImageTypeSelect.value ===
    'COVER';

  if (isCover) {
    destinationImageIsActiveInput.checked =
      true;

    destinationImageIsActiveInput.disabled =
      true;

    if (destinationImageActiveHelp) {
      destinationImageActiveHelp.textContent =
        'Ảnh bìa bắt buộc phải ở trạng thái hoạt động.';
    }

    return;
  }

  destinationImageIsActiveInput.disabled =
    false;

  if (destinationImageActiveHelp) {
    destinationImageActiveHelp.textContent =
      'Ảnh đang hoạt động sẽ được hiển thị trên website.';
  }
}

function setDestinationImageSaving(
  isSaving
) {
  destinationEditorState
    .imageEditor
    .saving = isSaving;

  [
    saveDestinationImageBtn,
    resetDestinationImageBtn,
    cancelEditDestinationImageBtn
  ].forEach(
    function (button) {
      if (button) {
        button.disabled =
          isSaving;
      }
    }
  );

  if (saveDestinationImageBtn) {
    saveDestinationImageBtn.textContent =
      isSaving
        ? 'Đang lưu...'
        : destinationEditorState
            .imageEditor
            .editingImageId
          ? 'Lưu thay đổi ảnh'
          : 'Thêm hình ảnh';
  }
}

function resetDestinationImageForm() {
  destinationEditorState
    .imageEditor
    .editingImageId = null;

  if (destinationImageUrlInput) {
    destinationImageUrlInput.value =
      '';
  }

  if (destinationImageAltInput) {
    destinationImageAltInput.value =
      '';
  }

  if (destinationImageTypeSelect) {
    destinationImageTypeSelect.value =
      'GALLERY';
  }

  if (destinationImageSortOrderInput) {
    destinationImageSortOrderInput.value =
      '0';
  }

  if (destinationImageIsActiveInput) {
    destinationImageIsActiveInput.checked =
      true;

    destinationImageIsActiveInput.disabled =
      false;
  }

  if (destinationImageSourceUrlInput) {
    destinationImageSourceUrlInput.value =
      '';
  }

  if (destinationImageCreditInput) {
    destinationImageCreditInput.value =
      '';
  }

  if (destinationImageFormTitle) {
    destinationImageFormTitle.textContent =
      'Thêm hình ảnh';
  }

  if (destinationImageFormDescription) {
    destinationImageFormDescription.textContent =
      'Nhập đường dẫn ảnh nội bộ hoặc URL ảnh.';
  }

  if (cancelEditDestinationImageBtn) {
    cancelEditDestinationImageBtn.hidden =
      true;
  }

  syncDestinationImageActiveControl();
  setDestinationImageSaving(false);
}

function startEditingDestinationImage(
  imageId
) {
  const image =
    findDestinationImage(
      imageId
    );

  if (!image) {
    showToast(
      'Không tìm thấy hình ảnh.',
      'error'
    );

    return;
  }

  destinationEditorState
    .imageEditor
    .editingImageId =
    image.id;

  destinationImageUrlInput.value =
    image.url || '';

  destinationImageAltInput.value =
    image.altText || '';

  destinationImageTypeSelect.value =
    image.imageType ||
    'GALLERY';

  destinationImageSortOrderInput.value =
    String(
      image.sortOrder ?? 0
    );

  destinationImageIsActiveInput.checked =
    Boolean(image.isActive);

  destinationImageSourceUrlInput.value =
    image.sourceUrl || '';

  destinationImageCreditInput.value =
    image.imageCredit || '';

  destinationImageFormTitle.textContent =
    'Chỉnh sửa hình ảnh';

  destinationImageFormDescription.textContent =
    'Cập nhật đường dẫn, loại ảnh và trạng thái hiển thị.';

  cancelEditDestinationImageBtn.hidden =
    false;

  syncDestinationImageActiveControl();
  setDestinationImageSaving(false);

  destinationImagesSection?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

  destinationImageUrlInput?.focus();
}

function buildDestinationImagePayload() {
  const url =
    destinationImageUrlInput
      ?.value
      .trim() || '';

  if (!url) {
    throw new Error(
      'Bạn chưa nhập đường dẫn ảnh.'
    );
  }

  if (
    !/^(https?:\/\/|\/)/i.test(
      url
    )
  ) {
    throw new Error(
      'Đường dẫn ảnh phải bắt đầu bằng /, http:// hoặc https://.'
    );
  }

  const sortOrder =
    Number(
      destinationImageSortOrderInput
        ?.value || 0
    );

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    throw new Error(
      'Thứ tự ảnh phải là số nguyên lớn hơn hoặc bằng 0.'
    );
  }

  const imageType =
    destinationImageTypeSelect
      ?.value ||
    'GALLERY';

  const sourceUrl =
    nullableString(
      destinationImageSourceUrlInput
        ?.value
    );

  if (
    sourceUrl &&
    !/^https?:\/\//i.test(sourceUrl)
  ) {
    throw new Error(
      'URL nguồn ảnh phải bắt đầu bằng http:// hoặc https://.'
    );
  }

  return {
    url,

    altText:
      nullableString(
        destinationImageAltInput
          ?.value
      ),

    imageType,

    sourceUrl,

    imageCredit:
      nullableString(
        destinationImageCreditInput
          ?.value
      ),

    sortOrder,

    isActive:
      imageType === 'COVER'
        ? true
        : Boolean(
            destinationImageIsActiveInput
              ?.checked
          )
  };
}

async function saveDestinationImage() {
  if (
    destinationEditorState
      .imageEditor
      .saving
  ) {
    return;
  }

  const destinationId =
    destinationEditorState
      .destinationId;

  if (!destinationId) {
    showToast(
      'Hãy lưu địa điểm trước khi thêm ảnh.',
      'error'
    );

    return;
  }

  let payload;

  try {
    payload =
      buildDestinationImagePayload();
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : 'Thông tin ảnh chưa hợp lệ.',
      'error'
    );

    return;
  }

  const editingImageId =
    destinationEditorState
      .imageEditor
      .editingImageId;

  setDestinationImageSaving(true);

  try {
    const result =
      await requestAdminJson(
        editingImageId
          ? `/api/admin/destinations/${encodeURIComponent(
              destinationId
            )}/images/${encodeURIComponent(
              editingImageId
            )}`
          : `/api/admin/destinations/${encodeURIComponent(
              destinationId
            )}/images`,
        {
          method:
            editingImageId
              ? 'PATCH'
              : 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json'
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    showToast(
      result?.message ||
      (
        editingImageId
          ? 'Cập nhật hình ảnh thành công.'
          : 'Thêm hình ảnh thành công.'
      ),
      'success'
    );

    resetDestinationImageForm();
    await loadDestination();
  } catch (error) {
    console.error(
      'Lỗi lưu hình ảnh:',
      error
    );

    showToast(
      error instanceof Error
        ? error.message
        : 'Không thể lưu hình ảnh.',
      'error'
    );
  } finally {
    setDestinationImageSaving(false);
  }
}

async function runDestinationImageAction(
  imageId,
  callback
) {
  const pendingIds =
    destinationEditorState
      .imageEditor
      .pendingIds;

  if (pendingIds.has(imageId)) {
    return;
  }

  pendingIds.add(imageId);
  renderDestinationImages();

  try {
    await callback();
  } finally {
    pendingIds.delete(imageId);
    renderDestinationImages();
  }
}

async function patchDestinationImage(
  image,
  payload,
  successMessage
) {
  const destinationId =
    destinationEditorState
      .destinationId;

  await runDestinationImageAction(
    image.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destinationId
          )}/images/${encodeURIComponent(
            image.id
          )}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json'
            },

            body:
              JSON.stringify(
                payload
              )
          }
        );

      showToast(
        result?.message ||
        successMessage,
        'success'
      );

      await loadDestination();
    }
  );
}

async function setDestinationCoverImage(
  image
) {
  const confirmed =
    await confirmEditorAction({
      type: 'info',

      title:
        'Đặt làm ảnh bìa',

      message:
        `Ảnh "${image.altText || image.url}" sẽ được đặt làm ảnh bìa của địa điểm.`,

      confirmText:
        'Đặt làm ảnh bìa',

      cancelText:
        'Hủy'
    });

  if (!confirmed) {
    return;
  }

  await patchDestinationImage(
    image,
    {
      imageType: 'COVER',
      isActive: true
    },
    'Đã đặt ảnh bìa thành công.'
  );
}

async function toggleDestinationImageActive(
  image
) {
  if (image.imageType === 'COVER') {
    showToast(
      'Ảnh bìa bắt buộc phải hoạt động.',
      'error'
    );

    return;
  }

  await patchDestinationImage(
    image,
    {
      isActive:
        !Boolean(image.isActive)
    },
    image.isActive
      ? 'Đã tắt hình ảnh.'
      : 'Đã bật hình ảnh.'
  );
}

async function deleteDestinationImage(
  image
) {
  const confirmed =
    await confirmEditorAction({
      type: 'danger',

      title:
        'Xóa hình ảnh',

      message:
        `Hình ảnh "${image.altText || image.url}" sẽ bị xóa khỏi địa điểm.`,

      confirmText:
        'Xóa hình ảnh',

      cancelText:
        'Hủy'
    });

  if (!confirmed) {
    return;
  }

  const destinationId =
    destinationEditorState
      .destinationId;

  await runDestinationImageAction(
    image.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destinationId
          )}/images/${encodeURIComponent(
            image.id
          )}`,
          {
            method: 'DELETE',

            headers: {
              Accept:
                'application/json'
            }
          }
        );

      showToast(
        result?.message ||
        'Xóa hình ảnh thành công.',
        'success'
      );

      if (
        destinationEditorState
          .imageEditor
          .editingImageId ===
        image.id
      ) {
        resetDestinationImageForm();
      }

      await loadDestination();
    }
  );
}

async function handleDestinationImageListClick(
  event
) {
  const button =
    event.target.closest(
      '[data-image-action]'
    );

  if (
    !button ||
    button.disabled
  ) {
    return;
  }

  const imageId =
    button.dataset.imageId;

  const action =
    button.dataset.imageAction;

  const image =
    findDestinationImage(
      imageId
    );

  if (!image) {
    showToast(
      'Không tìm thấy hình ảnh.',
      'error'
    );

    return;
  }

  try {
    if (action === 'edit') {
      startEditingDestinationImage(
        image.id
      );

      return;
    }

    if (action === 'cover') {
      await setDestinationCoverImage(
        image
      );

      return;
    }

    if (action === 'active') {
      await toggleDestinationImageActive(
        image
      );

      return;
    }

    if (action === 'delete') {
      await deleteDestinationImage(
        image
      );
    }
  } catch (error) {
    console.error(
      'Lỗi thao tác hình ảnh:',
      error
    );

    showToast(
      error instanceof Error
        ? error.message
        : 'Không thể thực hiện thao tác hình ảnh.',
      'error'
    );
  }
}
/* =====================================
   QUẢN LÝ ĐẶC ĐIỂM NỔI BẬT
===================================== */

function getDestinationFeatures() {
  const features =
    destinationEditorState
      .destination
      ?.features;

  if (!Array.isArray(features)) {
    return [];
  }

  return [...features].sort(
    function (first, second) {
      const sortDifference =
        Number(
          first.sortOrder || 0
        ) -
        Number(
          second.sortOrder || 0
        );

      if (sortDifference !== 0) {
        return sortDifference;
      }

      return String(first.id).localeCompare(
        String(second.id)
      );
    }
  );
}

function findDestinationFeature(
  featureId
) {
  return (
    getDestinationFeatures().find(
      function (feature) {
        return feature.id ===
          featureId;
      }
    ) ||
    null
  );
}

function renderDestinationFeatures() {
  if (
    !destinationFeatureList ||
    !destinationFeatureEmpty
  ) {
    return;
  }

  const features =
    getDestinationFeatures();

  if (destinationFeatureResultLine) {
    destinationFeatureResultLine.textContent =
      features.length > 0
        ? `Hiện có ${features.length} đặc điểm nổi bật.`
        : 'Chưa có đặc điểm nổi bật.';
  }

  const relatedFeatureCount =
    document.getElementById(
      'relatedFeatureCount'
    );

  if (relatedFeatureCount) {
    relatedFeatureCount.textContent =
      `${features.length} mục`;
  }

  if (features.length === 0) {
    destinationFeatureList.innerHTML =
      '';

    destinationFeatureEmpty.hidden =
      false;

    return;
  }

  destinationFeatureEmpty.hidden =
    true;

  destinationFeatureList.innerHTML =
    features
      .map(
        function (feature) {
          const isPending =
            destinationEditorState
              .featureEditor
              .pendingIds
              .has(feature.id);

          const icon =
            feature.icon || '✨';

          return `
            <article
              class="destination-feature-item"
              data-feature-id="${escapeHtml(
                feature.id
              )}"
            >
              <div
                class="destination-feature-icon"
                title="${escapeHtml(
                  feature.icon ||
                  'Chưa chọn biểu tượng'
                )}"
              >
                ${escapeHtml(icon)}
              </div>

              <div class="destination-feature-information">
                <h4>
                  ${escapeHtml(
                    feature.title
                  )}
                </h4>

                <p class="destination-feature-content">
                  ${escapeHtml(
                    feature.content
                  )}
                </p>

                <div class="destination-feature-meta">
                  <span>
                    Thứ tự:
                    ${escapeHtml(
                      feature.sortOrder ?? 0
                    )}
                  </span>

                  ${
                    feature.icon
                      ? `
                        <span>
                          Icon:
                          ${escapeHtml(
                            feature.icon
                          )}
                        </span>
                      `
                      : ''
                  }
                </div>

                <div class="destination-feature-actions">
                  <button
                    type="button"
                    class="
                      destination-feature-action-btn
                      destination-feature-edit-btn
                    "
                    data-feature-action="edit"
                    data-feature-id="${escapeHtml(
                      feature.id
                    )}"
                    ${isPending ? 'disabled' : ''}
                  >
                    Chỉnh sửa
                  </button>

                  <button
                    type="button"
                    class="
                      destination-feature-action-btn
                      destination-feature-delete-btn
                    "
                    data-feature-action="delete"
                    data-feature-id="${escapeHtml(
                      feature.id
                    )}"
                    ${isPending ? 'disabled' : ''}
                  >
                    ${
                      isPending
                        ? 'Đang xử lý...'
                        : 'Xóa'
                    }
                  </button>
                </div>
              </div>
            </article>
          `;
        }
      )
      .join('');
}

function updateDestinationFeatureCounter() {
  if (
    !destinationFeatureContentInput ||
    !destinationFeatureContentCounter
  ) {
    return;
  }

  destinationFeatureContentCounter.textContent =
    String(
      destinationFeatureContentInput
        .value
        .length
    );
}

function setDestinationFeatureSaving(
  isSaving
) {
  destinationEditorState
    .featureEditor
    .saving = isSaving;

  [
    saveDestinationFeatureBtn,
    resetDestinationFeatureBtn,
    cancelEditDestinationFeatureBtn
  ].forEach(
    function (button) {
      if (button) {
        button.disabled =
          isSaving;
      }
    }
  );

  if (saveDestinationFeatureBtn) {
    saveDestinationFeatureBtn.textContent =
      isSaving
        ? 'Đang lưu...'
        : destinationEditorState
            .featureEditor
            .editingFeatureId
          ? 'Lưu thay đổi'
          : 'Thêm đặc điểm';
  }
}

function resetDestinationFeatureForm() {
  destinationEditorState
    .featureEditor
    .editingFeatureId = null;

  if (destinationFeatureTitleInput) {
    destinationFeatureTitleInput.value =
      '';
  }

  if (destinationFeatureContentInput) {
    destinationFeatureContentInput.value =
      '';
  }

  if (destinationFeatureIconInput) {
    destinationFeatureIconInput.value =
      '';
  }

  if (destinationFeatureSortOrderInput) {
    destinationFeatureSortOrderInput.value =
      '0';
  }

  if (destinationFeatureFormTitle) {
    destinationFeatureFormTitle.textContent =
      'Thêm đặc điểm';
  }

  if (destinationFeatureFormDescription) {
    destinationFeatureFormDescription.textContent =
      'Nhập tiêu đề và nội dung của đặc điểm nổi bật.';
  }

  if (cancelEditDestinationFeatureBtn) {
    cancelEditDestinationFeatureBtn.hidden =
      true;
  }

  updateDestinationFeatureCounter();
  setDestinationFeatureSaving(false);
}

function startEditingDestinationFeature(
  featureId
) {
  const feature =
    findDestinationFeature(
      featureId
    );

  if (!feature) {
    showToast(
      'Không tìm thấy đặc điểm nổi bật.',
      'error'
    );

    return;
  }

  destinationEditorState
    .featureEditor
    .editingFeatureId =
    feature.id;

  destinationFeatureTitleInput.value =
    feature.title || '';

  destinationFeatureContentInput.value =
    feature.content || '';

  destinationFeatureIconInput.value =
    feature.icon || '';

  destinationFeatureSortOrderInput.value =
    String(
      feature.sortOrder ?? 0
    );

  destinationFeatureFormTitle.textContent =
    'Chỉnh sửa đặc điểm';

  destinationFeatureFormDescription.textContent =
    'Cập nhật tiêu đề, nội dung và thứ tự hiển thị.';

  cancelEditDestinationFeatureBtn.hidden =
    false;

  updateDestinationFeatureCounter();
  setDestinationFeatureSaving(false);

  destinationFeaturesSection?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

  destinationFeatureTitleInput?.focus();
}

function buildDestinationFeaturePayload() {
  const title =
    destinationFeatureTitleInput
      ?.value
      .trim() || '';

  const content =
    destinationFeatureContentInput
      ?.value
      .trim() || '';

  if (title.length < 2) {
    throw new Error(
      'Tiêu đề đặc điểm phải có ít nhất 2 ký tự.'
    );
  }

  if (title.length > 180) {
    throw new Error(
      'Tiêu đề đặc điểm không được vượt quá 180 ký tự.'
    );
  }

  if (content.length < 2) {
    throw new Error(
      'Nội dung đặc điểm phải có ít nhất 2 ký tự.'
    );
  }

  if (content.length > 5000) {
    throw new Error(
      'Nội dung đặc điểm không được vượt quá 5000 ký tự.'
    );
  }

  const sortOrder =
    Number(
      destinationFeatureSortOrderInput
        ?.value || 0
    );

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    throw new Error(
      'Thứ tự đặc điểm phải là số nguyên lớn hơn hoặc bằng 0.'
    );
  }

  return {
    title,
    content,

    icon:
      nullableString(
        destinationFeatureIconInput
          ?.value
      ),

    sortOrder
  };
}

async function saveDestinationFeature() {
  if (
    destinationEditorState
      .featureEditor
      .saving
  ) {
    return;
  }

  const destinationId =
    destinationEditorState
      .destinationId;

  if (!destinationId) {
    showToast(
      'Hãy lưu địa điểm trước khi thêm đặc điểm.',
      'error'
    );

    return;
  }

  let payload;

  try {
    payload =
      buildDestinationFeaturePayload();
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : 'Thông tin đặc điểm chưa hợp lệ.',
      'error'
    );

    return;
  }

  const editingFeatureId =
    destinationEditorState
      .featureEditor
      .editingFeatureId;

  setDestinationFeatureSaving(true);

  try {
    const result =
      await requestAdminJson(
        editingFeatureId
          ? `/api/admin/destinations/${encodeURIComponent(
              destinationId
            )}/features/${encodeURIComponent(
              editingFeatureId
            )}`
          : `/api/admin/destinations/${encodeURIComponent(
              destinationId
            )}/features`,
        {
          method:
            editingFeatureId
              ? 'PATCH'
              : 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json'
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    showToast(
      result?.message ||
      (
        editingFeatureId
          ? 'Cập nhật đặc điểm thành công.'
          : 'Thêm đặc điểm thành công.'
      ),
      'success'
    );

    resetDestinationFeatureForm();
    await loadDestination();
  } catch (error) {
    console.error(
      'Lỗi lưu đặc điểm:',
      error
    );

    showToast(
      error instanceof Error
        ? error.message
        : 'Không thể lưu đặc điểm.',
      'error'
    );
  } finally {
    setDestinationFeatureSaving(false);
  }
}

async function runDestinationFeatureAction(
  featureId,
  callback
) {
  const pendingIds =
    destinationEditorState
      .featureEditor
      .pendingIds;

  if (pendingIds.has(featureId)) {
    return;
  }

  pendingIds.add(featureId);
  renderDestinationFeatures();

  try {
    await callback();
  } finally {
    pendingIds.delete(featureId);
    renderDestinationFeatures();
  }
}

async function deleteDestinationFeature(
  feature
) {
  const confirmed =
    await confirmEditorAction({
      type: 'danger',

      title:
        'Xóa đặc điểm nổi bật',

      message:
        `Đặc điểm "${feature.title}" sẽ bị xóa khỏi địa điểm.`,

      confirmText:
        'Xóa đặc điểm',

      cancelText:
        'Hủy'
    });

  if (!confirmed) {
    return;
  }

  const destinationId =
    destinationEditorState
      .destinationId;

  await runDestinationFeatureAction(
    feature.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destinationId
          )}/features/${encodeURIComponent(
            feature.id
          )}`,
          {
            method: 'DELETE',

            headers: {
              Accept:
                'application/json'
            }
          }
        );

      showToast(
        result?.message ||
        'Xóa đặc điểm thành công.',
        'success'
      );

      if (
        destinationEditorState
          .featureEditor
          .editingFeatureId ===
        feature.id
      ) {
        resetDestinationFeatureForm();
      }

      await loadDestination();
    }
  );
}

async function handleDestinationFeatureListClick(
  event
) {
  const button =
    event.target.closest(
      '[data-feature-action]'
    );

  if (
    !button ||
    button.disabled
  ) {
    return;
  }

  const featureId =
    button.dataset.featureId;

  const action =
    button.dataset.featureAction;

  const feature =
    findDestinationFeature(
      featureId
    );

  if (!feature) {
    showToast(
      'Không tìm thấy đặc điểm nổi bật.',
      'error'
    );

    return;
  }

  try {
    if (action === 'edit') {
      startEditingDestinationFeature(
        feature.id
      );

      return;
    }

    if (action === 'delete') {
      await deleteDestinationFeature(
        feature
      );
    }
  } catch (error) {
    console.error(
      'Lỗi thao tác đặc điểm:',
      error
    );

    showToast(
      error instanceof Error
        ? error.message
        : 'Không thể thực hiện thao tác đặc điểm.',
      'error'
    );
  }
}
/* =====================================
   QUẢN LÝ ĐIỂM KHÁM PHÁ
===================================== */

function getDestinationAttractions() {
  const attractions =
    destinationEditorState
      .destination
      ?.attractions;

  if (!Array.isArray(attractions)) {
    return [];
  }

  return [...attractions].sort(
    function (first, second) {
      const sortDifference =
        Number(
          first.sortOrder || 0
        ) -
        Number(
          second.sortOrder || 0
        );

      if (sortDifference !== 0) {
        return sortDifference;
      }

      return String(first.id).localeCompare(
        String(second.id)
      );
    }
  );
}

function findDestinationAttraction(
  attractionId
) {
  return (
    getDestinationAttractions().find(
      function (attraction) {
        return attraction.id ===
          attractionId;
      }
    ) ||
    null
  );
}

function buildAttractionMapUrl(
  attraction
) {
  const latitude =
    attraction.latitude;

  const longitude =
    attraction.longitude;

  if (
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined
  ) {
    return (
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(
        `${latitude},${longitude}`
      )
    );
  }

  const mapQuery =
    attraction.mapQuery ||
    attraction.address ||
    attraction.name;

  if (!mapQuery) {
    return '';
  }

  return (
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(mapQuery)
  );
}

function renderDestinationAttractions() {
  if (
    !destinationAttractionList ||
    !destinationAttractionEmpty
  ) {
    return;
  }

  const attractions =
    getDestinationAttractions();

  if (destinationAttractionResultLine) {
    destinationAttractionResultLine.textContent =
      attractions.length > 0
        ? `Hiện có ${attractions.length} điểm khám phá.`
        : 'Chưa có điểm khám phá.';
  }

  const relatedAttractionCount =
    document.getElementById(
      'relatedAttractionCount'
    );

  if (relatedAttractionCount) {
    relatedAttractionCount.textContent =
      `${attractions.length} mục`;
  }

  if (attractions.length === 0) {
    destinationAttractionList.innerHTML =
      '';

    destinationAttractionEmpty.hidden =
      false;

    return;
  }

  destinationAttractionEmpty.hidden =
    true;

  destinationAttractionList.innerHTML =
    attractions
      .map(
        function (attraction) {
          const isPending =
            destinationEditorState
              .attractionEditor
              .pendingIds
              .has(attraction.id);

          const isActive =
            Boolean(
              attraction.isActive
            );

          const mapUrl =
            buildAttractionMapUrl(
              attraction
            );

          const hasCoordinates =
            attraction.latitude !==
              null &&
            attraction.latitude !==
              undefined &&
            attraction.longitude !==
              null &&
            attraction.longitude !==
              undefined;

          return `
            <article
              class="destination-attraction-item"
              data-attraction-id="${escapeHtml(
                attraction.id
              )}"
            >
              <div class="destination-attraction-preview">
                ${
                  attraction.imageUrl
                    ? `
                      <img
                        src="${escapeHtml(
                          attraction.imageUrl
                        )}"
                        alt="${escapeHtml(
                          attraction.imageAlt ||
                          attraction.name
                        )}"
                        loading="lazy"
                        data-fallback="/assets/images/bg-vietnam.jpg"
                      />
                    `
                    : `
                      <div
                        class="destination-attraction-placeholder"
                      >
                        🏞️
                      </div>
                    `
                }

                <span
                  class="
                    destination-attraction-status
                    ${isActive ? '' : 'inactive'}
                  "
                >
                  ${
                    isActive
                      ? 'Đang hiển thị'
                      : 'Đang tắt'
                  }
                </span>
              </div>

              <div class="destination-attraction-information">
                <h4>
                  ${escapeHtml(
                    attraction.name
                  )}
                </h4>

                ${
                  attraction.description
                    ? `
                      <p
                        class="destination-attraction-description"
                      >
                        ${escapeHtml(
                          attraction.description
                        )}
                      </p>
                    `
                    : ''
                }

                ${
                  attraction.address
                    ? `
                      <div
                        class="destination-attraction-address"
                      >
                        <span>📍</span>

                        <span>
                          ${escapeHtml(
                            attraction.address
                          )}
                        </span>
                      </div>
                    `
                    : ''
                }

                <div class="destination-attraction-meta">
                  <span>
                    Thứ tự:
                    ${escapeHtml(
                      attraction.sortOrder ?? 0
                    )}
                  </span>

                  ${
                    hasCoordinates
                      ? `
                        <span>
                          ${escapeHtml(
                            attraction.latitude
                          )},
                          ${escapeHtml(
                            attraction.longitude
                          )}
                        </span>
                      `
                      : ''
                  }

                  ${
                    attraction.imageCredit
                      ? `
                        <span>
                          ${escapeHtml(
                            attraction.imageCredit
                          )}
                        </span>
                      `
                      : ''
                  }
                </div>

                <div class="destination-attraction-actions">
                  <button
                    type="button"
                    class="
                      destination-attraction-action-btn
                      destination-attraction-edit-btn
                    "
                    data-attraction-action="edit"
                    data-attraction-id="${escapeHtml(
                      attraction.id
                    )}"
                    ${isPending ? 'disabled' : ''}
                  >
                    Chỉnh sửa
                  </button>

                  <button
                    type="button"
                    class="
                      destination-attraction-action-btn
                      ${
                        isActive
                          ? 'destination-attraction-inactive-btn'
                          : 'destination-attraction-active-btn'
                      }
                    "
                    data-attraction-action="active"
                    data-attraction-id="${escapeHtml(
                      attraction.id
                    )}"
                    ${isPending ? 'disabled' : ''}
                  >
                    ${
                      isActive
                        ? 'Tắt hiển thị'
                        : 'Bật hiển thị'
                    }
                  </button>

                  ${
                    mapUrl
                      ? `
                        <a
                          class="destination-attraction-map-link"
                          href="${escapeHtml(
                            mapUrl
                          )}"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Mở bản đồ
                        </a>
                      `
                      : ''
                  }

                  <button
                    type="button"
                    class="
                      destination-attraction-action-btn
                      destination-attraction-delete-btn
                    "
                    data-attraction-action="delete"
                    data-attraction-id="${escapeHtml(
                      attraction.id
                    )}"
                    ${isPending ? 'disabled' : ''}
                  >
                    ${
                      isPending
                        ? 'Đang xử lý...'
                        : 'Xóa'
                    }
                  </button>
                </div>
              </div>
            </article>
          `;
        }
      )
      .join('');

  window.ImageUtils?.scan(
    destinationAttractionList
  );
}

function updateDestinationAttractionCounter() {
  if (
    !destinationAttractionDescriptionInput ||
    !destinationAttractionDescriptionCounter
  ) {
    return;
  }

  destinationAttractionDescriptionCounter.textContent =
    String(
      destinationAttractionDescriptionInput
        .value
        .length
    );
}

function setDestinationAttractionSaving(
  isSaving
) {
  destinationEditorState
    .attractionEditor
    .saving = isSaving;

  [
    saveDestinationAttractionBtn,
    resetDestinationAttractionBtn,
    cancelEditDestinationAttractionBtn
  ].forEach(
    function (button) {
      if (button) {
        button.disabled =
          isSaving;
      }
    }
  );

  if (saveDestinationAttractionBtn) {
    saveDestinationAttractionBtn.textContent =
      isSaving
        ? 'Đang lưu...'
        : destinationEditorState
            .attractionEditor
            .editingAttractionId
          ? 'Lưu thay đổi'
          : 'Thêm điểm khám phá';
  }
}

function resetDestinationAttractionForm() {
  destinationEditorState
    .attractionEditor
    .editingAttractionId = null;

  if (destinationAttractionNameInput) {
    destinationAttractionNameInput.value =
      '';
  }

  if (destinationAttractionDescriptionInput) {
    destinationAttractionDescriptionInput.value =
      '';
  }

  if (destinationAttractionAddressInput) {
    destinationAttractionAddressInput.value =
      '';
  }

  if (destinationAttractionMapQueryInput) {
    destinationAttractionMapQueryInput.value =
      '';
  }

  if (destinationAttractionLatitudeInput) {
    destinationAttractionLatitudeInput.value =
      '';
  }

  if (destinationAttractionLongitudeInput) {
    destinationAttractionLongitudeInput.value =
      '';
  }

  if (destinationAttractionImageUrlInput) {
    destinationAttractionImageUrlInput.value =
      '';
  }

  if (destinationAttractionImageAltInput) {
    destinationAttractionImageAltInput.value =
      '';
  }

  if (destinationAttractionSourceUrlInput) {
    destinationAttractionSourceUrlInput.value =
      '';
  }

  if (destinationAttractionImageCreditInput) {
    destinationAttractionImageCreditInput.value =
      '';
  }

  if (destinationAttractionSortOrderInput) {
    destinationAttractionSortOrderInput.value =
      '0';
  }

  if (destinationAttractionIsActiveInput) {
    destinationAttractionIsActiveInput.checked =
      true;
  }

  if (destinationAttractionFormTitle) {
    destinationAttractionFormTitle.textContent =
      'Thêm điểm khám phá';
  }

  if (destinationAttractionFormDescription) {
    destinationAttractionFormDescription.textContent =
      'Nhập thông tin địa điểm tham quan nổi bật.';
  }

  if (cancelEditDestinationAttractionBtn) {
    cancelEditDestinationAttractionBtn.hidden =
      true;
  }

  updateDestinationAttractionCounter();
  setDestinationAttractionSaving(false);
}

function startEditingDestinationAttraction(
  attractionId
) {
  const attraction =
    findDestinationAttraction(
      attractionId
    );

  if (!attraction) {
    showToast(
      'Không tìm thấy điểm khám phá.',
      'error'
    );

    return;
  }

  destinationEditorState
    .attractionEditor
    .editingAttractionId =
    attraction.id;

  destinationAttractionNameInput.value =
    attraction.name || '';

  destinationAttractionDescriptionInput.value =
    attraction.description || '';

  destinationAttractionAddressInput.value =
    attraction.address || '';

  destinationAttractionMapQueryInput.value =
    attraction.mapQuery || '';

  destinationAttractionLatitudeInput.value =
    attraction.latitude ?? '';

  destinationAttractionLongitudeInput.value =
    attraction.longitude ?? '';

  destinationAttractionImageUrlInput.value =
    attraction.imageUrl || '';

  destinationAttractionImageAltInput.value =
    attraction.imageAlt || '';

  destinationAttractionSourceUrlInput.value =
    attraction.sourceUrl || '';

  destinationAttractionImageCreditInput.value =
    attraction.imageCredit || '';

  destinationAttractionSortOrderInput.value =
    String(
      attraction.sortOrder ?? 0
    );

  destinationAttractionIsActiveInput.checked =
    Boolean(
      attraction.isActive
    );

  destinationAttractionFormTitle.textContent =
    'Chỉnh sửa điểm khám phá';

  destinationAttractionFormDescription.textContent =
    'Cập nhật thông tin, ảnh, vị trí và trạng thái hiển thị.';

  cancelEditDestinationAttractionBtn.hidden =
    false;

  updateDestinationAttractionCounter();
  setDestinationAttractionSaving(false);

  destinationAttractionsSection
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  destinationAttractionNameInput
    ?.focus();
}

function readNullableAttractionNumber(
  input,
  fieldName,
  minimum,
  maximum
) {
  const value =
    input?.value?.trim() || '';

  if (!value) {
    return null;
  }

  const numberValue =
    Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error(
      `${fieldName} phải là một số hợp lệ.`
    );
  }

  if (
    numberValue < minimum ||
    numberValue > maximum
  ) {
    throw new Error(
      `${fieldName} phải nằm trong khoảng ${minimum} đến ${maximum}.`
    );
  }

  return numberValue;
}

function buildDestinationAttractionPayload() {
  const name =
    destinationAttractionNameInput
      ?.value
      .trim() || '';

  if (name.length < 2) {
    throw new Error(
      'Tên điểm khám phá phải có ít nhất 2 ký tự.'
    );
  }

  if (name.length > 180) {
    throw new Error(
      'Tên điểm khám phá không được vượt quá 180 ký tự.'
    );
  }

  const description =
    nullableString(
      destinationAttractionDescriptionInput
        ?.value
    );

  if (
    description &&
    description.length > 5000
  ) {
    throw new Error(
      'Mô tả điểm khám phá không được vượt quá 5000 ký tự.'
    );
  }

  const imageUrl =
    nullableString(
      destinationAttractionImageUrlInput
        ?.value
    );

  if (
    imageUrl &&
    !/^(https?:\/\/|\/)/i.test(
      imageUrl
    )
  ) {
    throw new Error(
      'Đường dẫn ảnh phải bắt đầu bằng /, http:// hoặc https://.'
    );
  }

  const sourceUrl =
    nullableString(
      destinationAttractionSourceUrlInput
        ?.value
    );

  if (
    sourceUrl &&
    !/^https?:\/\//i.test(
      sourceUrl
    )
  ) {
    throw new Error(
      'URL nguồn ảnh phải bắt đầu bằng http:// hoặc https://.'
    );
  }

  const sortOrder =
    Number(
      destinationAttractionSortOrderInput
        ?.value || 0
    );

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    throw new Error(
      'Thứ tự điểm khám phá phải là số nguyên lớn hơn hoặc bằng 0.'
    );
  }

  const latitude =
    readNullableAttractionNumber(
      destinationAttractionLatitudeInput,
      'Vĩ độ',
      -90,
      90
    );

  const longitude =
    readNullableAttractionNumber(
      destinationAttractionLongitudeInput,
      'Kinh độ',
      -180,
      180
    );

  return {
    name,

    description,

    address:
      nullableString(
        destinationAttractionAddressInput
          ?.value
      ),

    mapQuery:
      nullableString(
        destinationAttractionMapQueryInput
          ?.value
      ),

    latitude,

    longitude,

    imageUrl,

    imageAlt:
      nullableString(
        destinationAttractionImageAltInput
          ?.value
      ),

    sourceUrl,

    imageCredit:
      nullableString(
        destinationAttractionImageCreditInput
          ?.value
      ),

    sortOrder,

    isActive:
      Boolean(
        destinationAttractionIsActiveInput
          ?.checked
      )
  };
}

async function saveDestinationAttraction() {
  if (
    destinationEditorState
      .attractionEditor
      .saving
  ) {
    return;
  }

  const destinationId =
    destinationEditorState
      .destinationId;

  if (!destinationId) {
    showToast(
      'Hãy lưu địa điểm trước khi thêm điểm khám phá.',
      'error'
    );

    return;
  }

  let payload;

  try {
    payload =
      buildDestinationAttractionPayload();
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : 'Thông tin điểm khám phá chưa hợp lệ.',
      'error'
    );

    return;
  }

  const editingAttractionId =
    destinationEditorState
      .attractionEditor
      .editingAttractionId;

  setDestinationAttractionSaving(
    true
  );

  try {
    const result =
      await requestAdminJson(
        editingAttractionId
          ? `/api/admin/destinations/${encodeURIComponent(
              destinationId
            )}/attractions/${encodeURIComponent(
              editingAttractionId
            )}`
          : `/api/admin/destinations/${encodeURIComponent(
              destinationId
            )}/attractions`,
        {
          method:
            editingAttractionId
              ? 'PATCH'
              : 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json'
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    showToast(
      result?.message ||
      (
        editingAttractionId
          ? 'Cập nhật điểm khám phá thành công.'
          : 'Thêm điểm khám phá thành công.'
      ),
      'success'
    );

    resetDestinationAttractionForm();
    await loadDestination();
  } catch (error) {
    console.error(
      'Lỗi lưu điểm khám phá:',
      error
    );

    showToast(
      error instanceof Error
        ? error.message
        : 'Không thể lưu điểm khám phá.',
      'error'
    );
  } finally {
    setDestinationAttractionSaving(
      false
    );
  }
}

async function runDestinationAttractionAction(
  attractionId,
  callback
) {
  const pendingIds =
    destinationEditorState
      .attractionEditor
      .pendingIds;

  if (
    pendingIds.has(
      attractionId
    )
  ) {
    return;
  }

  pendingIds.add(
    attractionId
  );

  renderDestinationAttractions();

  try {
    await callback();
  } finally {
    pendingIds.delete(
      attractionId
    );

    renderDestinationAttractions();
  }
}

async function patchDestinationAttraction(
  attraction,
  payload,
  successMessage
) {
  const destinationId =
    destinationEditorState
      .destinationId;

  await runDestinationAttractionAction(
    attraction.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destinationId
          )}/attractions/${encodeURIComponent(
            attraction.id
          )}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json'
            },

            body:
              JSON.stringify(
                payload
              )
          }
        );

      showToast(
        result?.message ||
        successMessage,
        'success'
      );

      await loadDestination();
    }
  );
}

async function toggleDestinationAttractionActive(
  attraction
) {
  await patchDestinationAttraction(
    attraction,
    {
      isActive:
        !Boolean(
          attraction.isActive
        )
    },
    attraction.isActive
      ? 'Đã tắt điểm khám phá.'
      : 'Đã bật điểm khám phá.'
  );
}

async function deleteDestinationAttraction(
  attraction
) {
  const confirmed =
    await confirmEditorAction({
      type: 'danger',

      title:
        'Xóa điểm khám phá',

      message:
        `Điểm khám phá "${attraction.name}" sẽ bị xóa khỏi địa điểm.`,

      confirmText:
        'Xóa điểm khám phá',

      cancelText:
        'Hủy'
    });

  if (!confirmed) {
    return;
  }

  const destinationId =
    destinationEditorState
      .destinationId;

  await runDestinationAttractionAction(
    attraction.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destinationId
          )}/attractions/${encodeURIComponent(
            attraction.id
          )}`,
          {
            method: 'DELETE',

            headers: {
              Accept:
                'application/json'
            }
          }
        );

      showToast(
        result?.message ||
        'Xóa điểm khám phá thành công.',
        'success'
      );

      if (
        destinationEditorState
          .attractionEditor
          .editingAttractionId ===
        attraction.id
      ) {
        resetDestinationAttractionForm();
      }

      await loadDestination();
    }
  );
}

async function handleDestinationAttractionListClick(
  event
) {
  const button =
    event.target.closest(
      '[data-attraction-action]'
    );

  if (
    !button ||
    button.disabled
  ) {
    return;
  }

  const attractionId =
    button.dataset.attractionId;

  const action =
    button.dataset.attractionAction;

  const attraction =
    findDestinationAttraction(
      attractionId
    );

  if (!attraction) {
    showToast(
      'Không tìm thấy điểm khám phá.',
      'error'
    );

    return;
  }

  try {
    if (action === 'edit') {
      startEditingDestinationAttraction(
        attraction.id
      );

      return;
    }

    if (action === 'active') {
      await toggleDestinationAttractionActive(
        attraction
      );

      return;
    }

    if (action === 'delete') {
      await deleteDestinationAttraction(
        attraction
      );
    }
  } catch (error) {
    console.error(
      'Lỗi thao tác điểm khám phá:',
      error
    );

    showToast(
      error instanceof Error
        ? error.message
        : 'Không thể thực hiện thao tác điểm khám phá.',
      'error'
    );
  }
}
/* =====================================
   QUẢN LÝ MÓN ĂN GỢI Ý
===================================== */

function getDestinationFoods() {
  const foods =
    destinationEditorState
      .destination
      ?.foods;

  if (!Array.isArray(foods)) {
    return [];
  }

  return [...foods].sort(
    function (first, second) {
      const sortDifference =
        Number(
          first.sortOrder || 0
        ) -
        Number(
          second.sortOrder || 0
        );

      if (sortDifference !== 0) {
        return sortDifference;
      }

      return String(first.id).localeCompare(
        String(second.id)
      );
    }
  );
}

function findDestinationFood(
  foodId
) {
  return (
    getDestinationFoods().find(
      function (food) {
        return food.id === foodId;
      }
    ) ||
    null
  );
}

function formatDestinationFoodCurrency(
  value
) {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(numberValue) ||
    numberValue < 0
  ) {
    return '';
  }

  return new Intl.NumberFormat(
    'vi-VN'
  ).format(numberValue);
}

function formatDestinationFoodPrice(
  food
) {
  const hasMinimum =
    food.priceMin !== null &&
    food.priceMin !== undefined &&
    Number.isFinite(
      Number(food.priceMin)
    );

  const hasMaximum =
    food.priceMax !== null &&
    food.priceMax !== undefined &&
    Number.isFinite(
      Number(food.priceMax)
    );

  if (
    hasMinimum &&
    hasMaximum
  ) {
    return (
      `${formatDestinationFoodCurrency(
        food.priceMin
      )} - ` +
      `${formatDestinationFoodCurrency(
        food.priceMax
      )} đồng`
    );
  }

  if (hasMinimum) {
    return (
      `Từ ${formatDestinationFoodCurrency(
        food.priceMin
      )} đồng`
    );
  }

  if (hasMaximum) {
    return (
      `Đến ${formatDestinationFoodCurrency(
        food.priceMax
      )} đồng`
    );
  }

  return '';
}

function renderDestinationFoods() {
  if (
    !destinationFoodList ||
    !destinationFoodEmpty
  ) {
    return;
  }

  const foods =
    getDestinationFoods();

  if (destinationFoodResultLine) {
    destinationFoodResultLine.textContent =
      foods.length > 0
        ? `Hiện có ${foods.length} món ăn gợi ý.`
        : 'Chưa có món ăn gợi ý.';
  }

  const relatedFoodCount =
    document.getElementById(
      'relatedFoodCount'
    );

  if (relatedFoodCount) {
    relatedFoodCount.textContent =
      `${foods.length} mục`;
  }

  if (foods.length === 0) {
    destinationFoodList.innerHTML =
      '';

    destinationFoodEmpty.hidden =
      false;

    return;
  }

  destinationFoodEmpty.hidden =
    true;

  destinationFoodList.innerHTML =
    foods
      .map(
        function (food) {
          const isPending =
            destinationEditorState
              .foodEditor
              .pendingIds
              .has(food.id);

          const isActive =
            Boolean(food.isActive);

          const price =
            formatDestinationFoodPrice(
              food
            );

          return `
            <article
              class="destination-food-item"
              data-food-id="${escapeHtml(
                food.id
              )}"
            >
              <div class="destination-food-preview">
                ${
                  food.imageUrl
                    ? `
                      <img
                        src="${escapeHtml(
                          food.imageUrl
                        )}"
                        alt="${escapeHtml(
                          food.imageAlt ||
                          food.name ||
                          'Món ăn địa phương'
                        )}"
                        loading="lazy"
                        data-fallback="/assets/images/bg-vietnam.jpg"
                      />
                    `
                    : `
                      <div
                        class="destination-food-placeholder"
                      >
                        🍜
                      </div>
                    `
                }

                <span
                  class="
                    destination-food-status
                    ${isActive ? '' : 'inactive'}
                  "
                >
                  ${
                    isActive
                      ? 'Đang hiển thị'
                      : 'Đang tắt'
                  }
                </span>
              </div>

              <div class="destination-food-information">
                <h4>
                  ${escapeHtml(
                    food.name
                  )}
                </h4>

                ${
                  food.description
                    ? `
                      <p
                        class="destination-food-description"
                      >
                        ${escapeHtml(
                          food.description
                        )}
                      </p>
                    `
                    : ''
                }

                ${
                  price
                    ? `
                      <div class="destination-food-price">
                        <span>💰</span>

                        <span>
                          ${escapeHtml(price)}
                        </span>
                      </div>
                    `
                    : ''
                }

                ${
                  food.priceNote
                    ? `
                      <p class="destination-food-price-note">
                        ${escapeHtml(
                          food.priceNote
                        )}
                      </p>
                    `
                    : ''
                }

                ${
                  food.suggestedArea
                    ? `
                      <div class="destination-food-area">
                        <span>📍</span>

                        <span>
                          ${escapeHtml(
                            food.suggestedArea
                          )}
                        </span>
                      </div>
                    `
                    : ''
                }

                <div class="destination-food-meta">
                  <span>
                    Thứ tự:
                    ${escapeHtml(
                      food.sortOrder ?? 0
                    )}
                  </span>

                  ${
                    food.imageCredit
                      ? `
                        <span>
                          ${escapeHtml(
                            food.imageCredit
                          )}
                        </span>
                      `
                      : ''
                  }
                </div>

                <div class="destination-food-actions">
                  <button
                    type="button"
                    class="
                      destination-food-action-btn
                      destination-food-edit-btn
                    "
                    data-food-action="edit"
                    data-food-id="${escapeHtml(
                      food.id
                    )}"
                    ${isPending ? 'disabled' : ''}
                  >
                    Chỉnh sửa
                  </button>

                  <button
                    type="button"
                    class="
                      destination-food-action-btn
                      ${
                        isActive
                          ? 'destination-food-inactive-btn'
                          : 'destination-food-active-btn'
                      }
                    "
                    data-food-action="active"
                    data-food-id="${escapeHtml(
                      food.id
                    )}"
                    ${isPending ? 'disabled' : ''}
                  >
                    ${
                      isActive
                        ? 'Tắt hiển thị'
                        : 'Bật hiển thị'
                    }
                  </button>

                  <button
                    type="button"
                    class="
                      destination-food-action-btn
                      destination-food-delete-btn
                    "
                    data-food-action="delete"
                    data-food-id="${escapeHtml(
                      food.id
                    )}"
                    ${isPending ? 'disabled' : ''}
                  >
                    ${
                      isPending
                        ? 'Đang xử lý...'
                        : 'Xóa'
                    }
                  </button>
                </div>
              </div>
            </article>
          `;
        }
      )
      .join('');

  window.ImageUtils?.scan(
    destinationFoodList
  );
}

function updateDestinationFoodCounter() {
  if (
    !destinationFoodDescriptionInput ||
    !destinationFoodDescriptionCounter
  ) {
    return;
  }

  destinationFoodDescriptionCounter.textContent =
    String(
      destinationFoodDescriptionInput
        .value
        .length
    );
}

function setDestinationFoodSaving(
  isSaving
) {
  destinationEditorState
    .foodEditor
    .saving = isSaving;

  [
    saveDestinationFoodBtn,
    resetDestinationFoodBtn,
    cancelEditDestinationFoodBtn
  ].forEach(
    function (button) {
      if (button) {
        button.disabled =
          isSaving;
      }
    }
  );

  if (saveDestinationFoodBtn) {
    saveDestinationFoodBtn.textContent =
      isSaving
        ? 'Đang lưu...'
        : destinationEditorState
            .foodEditor
            .editingFoodId
          ? 'Lưu thay đổi'
          : 'Thêm món ăn';
  }
}

function resetDestinationFoodForm() {
  destinationEditorState
    .foodEditor
    .editingFoodId = null;

  if (destinationFoodNameInput) {
    destinationFoodNameInput.value =
      '';
  }

  if (destinationFoodDescriptionInput) {
    destinationFoodDescriptionInput.value =
      '';
  }

  if (destinationFoodImageUrlInput) {
    destinationFoodImageUrlInput.value =
      '';
  }

  if (destinationFoodImageAltInput) {
    destinationFoodImageAltInput.value =
      '';
  }

  if (destinationFoodPriceMinInput) {
    destinationFoodPriceMinInput.value =
      '';
  }

  if (destinationFoodPriceMaxInput) {
    destinationFoodPriceMaxInput.value =
      '';
  }

  if (destinationFoodPriceNoteInput) {
    destinationFoodPriceNoteInput.value =
      '';
  }

  if (destinationFoodSuggestedAreaInput) {
    destinationFoodSuggestedAreaInput.value =
      '';
  }

  if (destinationFoodSourceUrlInput) {
    destinationFoodSourceUrlInput.value =
      '';
  }

  if (destinationFoodImageCreditInput) {
    destinationFoodImageCreditInput.value =
      '';
  }

  if (destinationFoodSortOrderInput) {
    destinationFoodSortOrderInput.value =
      '0';
  }

  if (destinationFoodIsActiveInput) {
    destinationFoodIsActiveInput.checked =
      true;
  }

  if (destinationFoodFormTitle) {
    destinationFoodFormTitle.textContent =
      'Thêm món ăn';
  }

  if (destinationFoodFormDescription) {
    destinationFoodFormDescription.textContent =
      'Nhập thông tin món ăn đặc trưng của địa điểm.';
  }

  if (cancelEditDestinationFoodBtn) {
    cancelEditDestinationFoodBtn.hidden =
      true;
  }

  updateDestinationFoodCounter();
  setDestinationFoodSaving(false);
}

function startEditingDestinationFood(
  foodId
) {
  const food =
    findDestinationFood(
      foodId
    );

  if (!food) {
    showToast(
      'Không tìm thấy món ăn.',
      'error'
    );

    return;
  }

  destinationEditorState
    .foodEditor
    .editingFoodId =
    food.id;

  destinationFoodNameInput.value =
    food.name || '';

  destinationFoodDescriptionInput.value =
    food.description || '';

  destinationFoodImageUrlInput.value =
    food.imageUrl || '';

  destinationFoodImageAltInput.value =
    food.imageAlt || '';

  destinationFoodPriceMinInput.value =
    food.priceMin ?? '';

  destinationFoodPriceMaxInput.value =
    food.priceMax ?? '';

  destinationFoodPriceNoteInput.value =
    food.priceNote || '';

  destinationFoodSuggestedAreaInput.value =
    food.suggestedArea || '';

  destinationFoodSourceUrlInput.value =
    food.sourceUrl || '';

  destinationFoodImageCreditInput.value =
    food.imageCredit || '';

  destinationFoodSortOrderInput.value =
    String(
      food.sortOrder ?? 0
    );

  destinationFoodIsActiveInput.checked =
    Boolean(food.isActive);

  destinationFoodFormTitle.textContent =
    'Chỉnh sửa món ăn';

  destinationFoodFormDescription.textContent =
    'Cập nhật thông tin, mức giá, ảnh và trạng thái hiển thị.';

  cancelEditDestinationFoodBtn.hidden =
    false;

  updateDestinationFoodCounter();
  setDestinationFoodSaving(false);

  destinationFoodsSection
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  destinationFoodNameInput
    ?.focus();
}

function readNullableFoodInteger(
  input,
  fieldName
) {
  const value =
    input?.value?.trim() || '';

  if (!value) {
    return null;
  }

  const numberValue =
    Number(value);

  if (
    !Number.isInteger(numberValue) ||
    numberValue < 0
  ) {
    throw new Error(
      `${fieldName} phải là số nguyên lớn hơn hoặc bằng 0.`
    );
  }

  if (
    numberValue >
    2147483647
  ) {
    throw new Error(
      `${fieldName} vượt quá giới hạn cho phép.`
    );
  }

  return numberValue;
}

function buildDestinationFoodPayload() {
  const name =
    destinationFoodNameInput
      ?.value
      .trim() || '';

  if (name.length < 2) {
    throw new Error(
      'Tên món ăn phải có ít nhất 2 ký tự.'
    );
  }

  if (name.length > 180) {
    throw new Error(
      'Tên món ăn không được vượt quá 180 ký tự.'
    );
  }

  const description =
    nullableString(
      destinationFoodDescriptionInput
        ?.value
    );

  if (
    description &&
    description.length > 5000
  ) {
    throw new Error(
      'Mô tả món ăn không được vượt quá 5000 ký tự.'
    );
  }

  const imageUrl =
    nullableString(
      destinationFoodImageUrlInput
        ?.value
    );

  if (
    imageUrl &&
    !/^(https?:\/\/|\/)/i.test(
      imageUrl
    )
  ) {
    throw new Error(
      'Đường dẫn ảnh phải bắt đầu bằng /, http:// hoặc https://.'
    );
  }

  const sourceUrl =
    nullableString(
      destinationFoodSourceUrlInput
        ?.value
    );

  if (
    sourceUrl &&
    !/^https?:\/\//i.test(
      sourceUrl
    )
  ) {
    throw new Error(
      'URL nguồn ảnh phải bắt đầu bằng http:// hoặc https://.'
    );
  }

  const priceMin =
    readNullableFoodInteger(
      destinationFoodPriceMinInput,
      'Giá thấp nhất'
    );

  const priceMax =
    readNullableFoodInteger(
      destinationFoodPriceMaxInput,
      'Giá cao nhất'
    );

  if (
    priceMin !== null &&
    priceMax !== null &&
    priceMin > priceMax
  ) {
    throw new Error(
      'Giá thấp nhất không được lớn hơn giá cao nhất.'
    );
  }

  const sortOrder =
    Number(
      destinationFoodSortOrderInput
        ?.value || 0
    );

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    throw new Error(
      'Thứ tự món ăn phải là số nguyên lớn hơn hoặc bằng 0.'
    );
  }

  return {
    name,

    description,

    imageUrl,

    imageAlt:
      nullableString(
        destinationFoodImageAltInput
          ?.value
      ),

    priceMin,

    priceMax,

    priceNote:
      nullableString(
        destinationFoodPriceNoteInput
          ?.value
      ),

    suggestedArea:
      nullableString(
        destinationFoodSuggestedAreaInput
          ?.value
      ),

    sourceUrl,

    imageCredit:
      nullableString(
        destinationFoodImageCreditInput
          ?.value
      ),

    sortOrder,

    isActive:
      Boolean(
        destinationFoodIsActiveInput
          ?.checked
      )
  };
}

async function saveDestinationFood() {
  if (
    destinationEditorState
      .foodEditor
      .saving
  ) {
    return;
  }

  const destinationId =
    destinationEditorState
      .destinationId;

  if (!destinationId) {
    showToast(
      'Hãy lưu địa điểm trước khi thêm món ăn.',
      'error'
    );

    return;
  }

  let payload;

  try {
    payload =
      buildDestinationFoodPayload();
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : 'Thông tin món ăn chưa hợp lệ.',
      'error'
    );

    return;
  }

  const editingFoodId =
    destinationEditorState
      .foodEditor
      .editingFoodId;

  setDestinationFoodSaving(
    true
  );

  try {
    const result =
      await requestAdminJson(
        editingFoodId
          ? `/api/admin/destinations/${encodeURIComponent(
              destinationId
            )}/foods/${encodeURIComponent(
              editingFoodId
            )}`
          : `/api/admin/destinations/${encodeURIComponent(
              destinationId
            )}/foods`,
        {
          method:
            editingFoodId
              ? 'PATCH'
              : 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json'
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    showToast(
      result?.message ||
      (
        editingFoodId
          ? 'Cập nhật món ăn thành công.'
          : 'Thêm món ăn thành công.'
      ),
      'success'
    );

    resetDestinationFoodForm();

    /*
     * Tải lại toàn bộ chi tiết để nhận
     * danh sách món ăn mới nhất từ backend.
     */
    await loadDestination();
  } catch (error) {
    console.error(
      'Lỗi lưu món ăn:',
      error
    );

    showToast(
      error instanceof Error
        ? error.message
        : 'Không thể lưu món ăn.',
      'error'
    );
  } finally {
    setDestinationFoodSaving(
      false
    );
  }
}

async function runDestinationFoodAction(
  foodId,
  callback
) {
  const pendingIds =
    destinationEditorState
      .foodEditor
      .pendingIds;

  if (
    pendingIds.has(
      foodId
    )
  ) {
    return;
  }

  pendingIds.add(
    foodId
  );

  renderDestinationFoods();

  try {
    await callback();
  } finally {
    pendingIds.delete(
      foodId
    );

    renderDestinationFoods();
  }
}

async function patchDestinationFood(
  food,
  payload,
  successMessage
) {
  const destinationId =
    destinationEditorState
      .destinationId;

  await runDestinationFoodAction(
    food.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destinationId
          )}/foods/${encodeURIComponent(
            food.id
          )}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Accept:
                'application/json'
            },

            body:
              JSON.stringify(
                payload
              )
          }
        );

      showToast(
        result?.message ||
        successMessage,
        'success'
      );

      await loadDestination();
    }
  );
}

async function toggleDestinationFoodActive(
  food
) {
  await patchDestinationFood(
    food,
    {
      isActive:
        !Boolean(
          food.isActive
        )
    },
    food.isActive
      ? 'Đã tắt món ăn.'
      : 'Đã bật món ăn.'
  );
}

async function deleteDestinationFood(
  food
) {
  const confirmed =
    await confirmEditorAction({
      type: 'danger',

      title:
        'Xóa món ăn',

      message:
        `Món ăn "${food.name}" sẽ bị xóa khỏi địa điểm.`,

      confirmText:
        'Xóa món ăn',

      cancelText:
        'Hủy'
    });

  if (!confirmed) {
    return;
  }

  const destinationId =
    destinationEditorState
      .destinationId;

  await runDestinationFoodAction(
    food.id,
    async function () {
      const result =
        await requestAdminJson(
          `/api/admin/destinations/${encodeURIComponent(
            destinationId
          )}/foods/${encodeURIComponent(
            food.id
          )}`,
          {
            method: 'DELETE',

            headers: {
              Accept:
                'application/json'
            }
          }
        );

      showToast(
        result?.message ||
        'Xóa món ăn thành công.',
        'success'
      );

      if (
        destinationEditorState
          .foodEditor
          .editingFoodId ===
        food.id
      ) {
        resetDestinationFoodForm();
      }

      await loadDestination();
    }
  );
}

async function handleDestinationFoodListClick(
  event
) {
  const button =
    event.target.closest(
      '[data-food-action]'
    );

  if (
    !button ||
    button.disabled
  ) {
    return;
  }

  const foodId =
    button.dataset.foodId;

  const action =
    button.dataset.foodAction;

  const food =
    findDestinationFood(
      foodId
    );

  if (!food) {
    showToast(
      'Không tìm thấy món ăn.',
      'error'
    );

    return;
  }

  try {
    if (action === 'edit') {
      startEditingDestinationFood(
        food.id
      );

      return;
    }

    if (action === 'active') {
      await toggleDestinationFoodActive(
        food
      );

      return;
    }

    if (action === 'delete') {
      await deleteDestinationFood(
        food
      );
    }
  } catch (error) {
    console.error(
      'Lỗi thao tác món ăn:',
      error
    );

    showToast(
      error instanceof Error
        ? error.message
        : 'Không thể thực hiện thao tác món ăn.',
      'error'
    );
  }
}
/* =====================================
   SỰ KIỆN
===================================== */

function setupEditorEvents() {
  destinationEditorForm
    ?.addEventListener(
      'submit',
      saveDestination
    );

  destinationNameInput
    ?.addEventListener(
      'input',
      function () {
        if (
          destinationEditorState
            .destinationId ||
          destinationEditorState
            .slugEdited
        ) {
          return;
        }

        destinationSlugInput.value =
          slugify(
            destinationNameInput.value
          );
      }
    );

  destinationSlugInput
    ?.addEventListener(
      'input',
      function () {
        destinationEditorState
          .slugEdited = true;

        const currentPosition =
          destinationSlugInput
            .selectionStart;

        destinationSlugInput.value =
          slugify(
            destinationSlugInput.value
          );

        try {
          destinationSlugInput
            .setSelectionRange(
              currentPosition,
              currentPosition
            );
        } catch {
          // Không cần xử lý.
        }
      }
    );

  destinationPrimaryCategorySelect
    ?.addEventListener(
      'change',
      ensurePrimaryCategoryChecked
    );

  destinationShortDescriptionInput
    ?.addEventListener(
      'input',
      function () {
        updateTextCounter(
          destinationShortDescriptionInput,
          document.getElementById(
            'shortDescriptionCounter'
          )
        );
      }
    );

  destinationMetaDescriptionInput
    ?.addEventListener(
      'input',
      function () {
        updateTextCounter(
          destinationMetaDescriptionInput,
          document.getElementById(
            'metaDescriptionCounter'
          )
        );
      }
    );

document.querySelectorAll(
  '[data-related-section]'
).forEach(
  function (button) {
    button.addEventListener(
      'click',
      function () {
        const section =
          button.dataset
            .relatedSection;

        if (
          section === 'images' &&
          destinationImagesSection
        ) {
          destinationImagesSection
            .scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });

          destinationImageUrlInput
            ?.focus();

          return;
        }
        if (
            section === 'features' &&
            destinationFeaturesSection
          ) {
            destinationFeaturesSection
              .scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });

            destinationFeatureTitleInput
              ?.focus();

            return;
          }
          if (
              section === 'attractions' &&
              destinationAttractionsSection
            ) {
              destinationAttractionsSection
                .scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });

              destinationAttractionNameInput
                ?.focus();

              return;
            }
            if (
                section === 'foods' &&
                destinationFoodsSection
              ) {
                destinationFoodsSection
                  .scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });

                destinationFoodNameInput
                  ?.focus();

                return;
              }

        showToast(
          'Phần quản lý nội dung này sẽ được hoàn thiện trong bước tiếp theo.',
          'info'
        );
      }
    );
  }
);
saveDestinationImageBtn
  ?.addEventListener(
    'click',
    saveDestinationImage
  );

resetDestinationImageBtn
  ?.addEventListener(
    'click',
    resetDestinationImageForm
  );

cancelEditDestinationImageBtn
  ?.addEventListener(
    'click',
    resetDestinationImageForm
  );

destinationImageTypeSelect
  ?.addEventListener(
    'change',
    syncDestinationImageActiveControl
  );

destinationImageList
  ?.addEventListener(
    'click',
    handleDestinationImageListClick
  );

destinationImagesSection
  ?.addEventListener(
    'keydown',
    function (event) {
      if (
        event.key !== 'Enter' ||
        event.shiftKey ||
        event.target.tagName ===
          'TEXTAREA'
      ) {
        return;
      }

      if (
        event.target.matches(
          'input, select'
        )
      ) {
        event.preventDefault();
        saveDestinationImage();
      }
    }
  );
}
saveDestinationFoodBtn
  ?.addEventListener(
    'click',
    saveDestinationFood
  );

resetDestinationFoodBtn
  ?.addEventListener(
    'click',
    resetDestinationFoodForm
  );

cancelEditDestinationFoodBtn
  ?.addEventListener(
    'click',
    resetDestinationFoodForm
  );

destinationFoodDescriptionInput
  ?.addEventListener(
    'input',
    updateDestinationFoodCounter
  );

destinationFoodList
  ?.addEventListener(
    'click',
    handleDestinationFoodListClick
  );

destinationFoodsSection
  ?.addEventListener(
    'keydown',
    function (event) {
      if (
        event.key !== 'Enter' ||
        event.shiftKey ||
        event.target.tagName ===
          'TEXTAREA'
      ) {
        return;
      }

      if (
        event.target.matches(
          'input, select'
        )
      ) {
        event.preventDefault();

        saveDestinationFood();
      }
    }
  );
saveDestinationAttractionBtn
  ?.addEventListener(
    'click',
    saveDestinationAttraction
  );

resetDestinationAttractionBtn
  ?.addEventListener(
    'click',
    resetDestinationAttractionForm
  );

cancelEditDestinationAttractionBtn
  ?.addEventListener(
    'click',
    resetDestinationAttractionForm
  );

destinationAttractionDescriptionInput
  ?.addEventListener(
    'input',
    updateDestinationAttractionCounter
  );

destinationAttractionList
  ?.addEventListener(
    'click',
    handleDestinationAttractionListClick
  );

destinationAttractionsSection
  ?.addEventListener(
    'keydown',
    function (event) {
      if (
        event.key !== 'Enter' ||
        event.shiftKey ||
        event.target.tagName ===
          'TEXTAREA'
      ) {
        return;
      }

      if (
        event.target.matches(
          'input, select'
        )
      ) {
        event.preventDefault();

        saveDestinationAttraction();
      }
    }
  );
saveDestinationFeatureBtn
  ?.addEventListener(
    'click',
    saveDestinationFeature
  );

resetDestinationFeatureBtn
  ?.addEventListener(
    'click',
    resetDestinationFeatureForm
  );

cancelEditDestinationFeatureBtn
  ?.addEventListener(
    'click',
    resetDestinationFeatureForm
  );

destinationFeatureContentInput
  ?.addEventListener(
    'input',
    updateDestinationFeatureCounter
  );

destinationFeatureList
  ?.addEventListener(
    'click',
    handleDestinationFeatureListClick
  );

destinationFeaturesSection
  ?.addEventListener(
    'keydown',
    function (event) {
      if (
        event.key !== 'Enter' ||
        event.shiftKey ||
        event.target.tagName ===
          'TEXTAREA'
      ) {
        return;
      }

      if (
        event.target.matches(
          'input, select'
        )
      ) {
        event.preventDefault();
        saveDestinationFeature();
      }
    }
  );

/* =====================================
   KHỞI TẠO
===================================== */

async function initializeDestinationEditor() {
  try {
    if (window.AuthGuard?.ready) {
      await window.AuthGuard.ready;
    }

    const currentUser =
      getCurrentUser();

    if (!currentUser) {
      window.location.replace(
        '/login.html'
      );

      return;
    }

    if (!isAdmin(currentUser)) {
      window.location.replace(
        '/index.html'
      );

      return;
    }
    updateEditorMode();
    setupEditorEvents();

    resetDestinationImageForm();
    resetDestinationFeatureForm();
    resetDestinationAttractionForm();
    resetDestinationFoodForm();

    await loadFormOptions();

    await loadDestination({
      forceFill: true
    });

    setupDestinationUnsavedChangesProtection();

    const query =
      new URLSearchParams(
        window.location.search
      );

    if (query.get('created') === '1') {
      showEditorMessage(
        'Tạo địa điểm thành công. Bạn có thể tiếp tục bổ sung ảnh và nội dung liên quan.',
        'success'
      );

      query.delete('created');

      const normalizedQuery =
        query.toString();

      window.history.replaceState(
        {},
        '',
        normalizedQuery
          ? `${window.location.pathname}?${normalizedQuery}`
          : window.location.pathname
      );
    }
  } catch (error) {
    console.error(
      'Lỗi khởi tạo trang chỉnh sửa địa điểm:',
      error
    );

    showEditorMessage(
      error instanceof Error
        ? error.message
        : 'Không thể mở trang chỉnh sửa địa điểm.'
    );
  } finally {
    document.documentElement
      .classList.remove(
        'auth-checking'
      );
  }
}

initializeDestinationEditor();