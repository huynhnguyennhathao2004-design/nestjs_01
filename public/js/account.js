const profileForm =
  document.getElementById(
    'profileForm'
  );

const profileSubmitButton =
  profileForm
    ? profileForm.querySelector(
        'button[type="submit"]'
      )
    : null;

const passwordForm =
  document.getElementById(
    'passwordForm'
  );

const passwordSubmitButton =
  document.getElementById(
    'passwordSubmitButton'
  );

const accountNameInput =
  document.getElementById(
    'accountName'
  );

const accountEmailInput =
  document.getElementById(
    'accountEmail'
  );

const accountAvatarInput =
  document.getElementById(
    'accountAvatar'
  );

const currentPasswordInput =
  document.getElementById(
    'currentPassword'
  );

const newPasswordInput =
  document.getElementById(
    'newPassword'
  );

const confirmNewPasswordInput =
  document.getElementById(
    'confirmNewPassword'
  );

const accountMessage =
  document.getElementById(
    'accountMessage'
  );

const accountLogoutBtn =
  document.getElementById(
    'accountLogoutBtn'
  );

const passwordPanel =
  document.getElementById(
    'passwordPanel'
  );

const googlePasswordNotice =
  document.getElementById(
    'googlePasswordNotice'
  );

let currentUser = null;
let currentAccount = null;


/* =====================================
   ĐỌC VÀ LƯU DỮ LIỆU
===================================== */

function getCurrentUser() {
  return AuthStore.getCurrentUser();
}




function saveCurrentUser(user) {
  return AuthStore.saveCurrentUser(
    user
  );
}


/* =====================================
   HÀM HỖ TRỢ
===================================== */

function isSameId(firstId, secondId) {
  return (
    String(firstId) ===
    String(secondId)
  );
}


function getInitial(name) {
  return String(name || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();
}


function formatDate(value) {
  if (!value) {
    return 'Chưa xác định';
  }

  const date =
    new Date(value);

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
      year: 'numeric'
    }
  ).format(date);
}


function showMessage(
  message,
  type
) {
  if (!window.Toast) {
    console.log(message);

    return;
  }

  const toastMethod =
    Toast[type] ||
    Toast.info;

  toastMethod(message);
}


function createAvatarHtml(
  avatarUrl,
  name
) {
  if (!avatarUrl) {
    return getInitial(name);
  }

  return `
    <img
      src="${avatarUrl}"
      alt="Ảnh đại diện"
      onerror="
        this.parentElement.textContent =
        '${getInitial(name)}';
      "
    />
  `;
}


/* =====================================
   BẢO VỆ TRANG
===================================== */

async function protectAccountPage() {
  /*
   * Chờ auth-guard hoàn tất refresh token
   * và kiểm tra người dùng.
   */
  if (
    window.AuthGuard &&
    window.AuthGuard.ready
  ) {
    await window.AuthGuard.ready;
  }

  currentUser =
    window.AuthStore &&
    typeof AuthStore
      .getCurrentUser === 'function'
      ? AuthStore.getCurrentUser()
      : null;

  if (!currentUser) {
    window.location.replace(
      '/login.html?redirect=' +
      encodeURIComponent(
        '/account.html'
      )
    );

    return false;
  }

  if (
    String(
      currentUser.status || ''
    ).toUpperCase() !== 'ACTIVE'
  ) {
    await AuthStore.logout();

    window.location.replace(
      '/login.html'
    );

    return false;
  }

  /*
   * Không còn lấy tài khoản từ localStorage.
   * Dùng người dùng đã được backend xác thực.
   */
  currentAccount =
    currentUser;

  return true;
}


/* =====================================
   HIỂN THỊ THÔNG TIN
===================================== */

function renderAccount() {
  if (!currentAccount) {
    return;
  }

  const role =
    String(
      currentAccount.role || 'USER'
    ).toUpperCase();

  const provider =
    String(
      currentAccount.provider ||
      'LOCAL'
    ).toUpperCase();

  const profileAvatar =
    document.getElementById(
      'profileAvatar'
    );

  const avatarPreview =
    document.getElementById(
      'avatarPreview'
    );

  const profileRole =
    document.getElementById(
      'profileRole'
    );

  const profileProvider =
    document.getElementById(
      'profileProvider'
    );

  document.getElementById(
    'profileName'
  ).textContent =
    currentAccount.name;

  document.getElementById(
    'profileEmail'
  ).textContent =
    currentAccount.email;

  document.getElementById(
    'profileStatus'
  ).textContent =
    currentAccount.status ===
    'LOCKED'
      ? 'Đã bị khóa'
      : 'Đang hoạt động';

  document.getElementById(
    'profileCreatedAt'
  ).textContent =
    formatDate(
      currentAccount.createdAt
    );

  document.getElementById(
    'profileId'
  ).textContent =
    currentAccount.id;

  profileRole.textContent =
    role === 'ADMIN'
      ? 'Quản trị viên'
      : 'Người dùng';

  profileRole.className =
    `profile-badge ${
      role === 'ADMIN'
        ? 'role-admin'
        : 'role-user'
    }`;

  profileProvider.textContent =
    provider === 'GOOGLE'
      ? 'Google'
      : 'Tài khoản thường';

  profileProvider.className =
    `profile-badge ${
      provider === 'GOOGLE'
        ? 'provider-google'
        : 'provider-local'
    }`;

  profileAvatar.innerHTML =
    createAvatarHtml(
      currentAccount.avatar,
      currentAccount.name
    );

  avatarPreview.innerHTML =
    createAvatarHtml(
      currentAccount.avatar,
      currentAccount.name
    );

  accountNameInput.value =
    currentAccount.name || '';

  accountEmailInput.value =
    currentAccount.email || '';

  accountAvatarInput.value =
    currentAccount.avatar || '';

  if (provider === 'GOOGLE') {
    passwordPanel.style.display =
      'none';

    googlePasswordNotice.classList.add(
      'show'
    );
  } else {
    passwordPanel.style.display =
      '';

    googlePasswordNotice.classList.remove(
      'show'
    );
  }
}


/* =====================================
   XEM TRƯỚC AVATAR
===================================== */

function updateAvatarPreview() {
  const avatarPreview =
    document.getElementById(
      'avatarPreview'
    );

  const name =
    accountNameInput.value.trim() ||
    currentAccount.name;

  const avatarUrl =
    accountAvatarInput.value.trim();

  avatarPreview.innerHTML =
    createAvatarHtml(
      avatarUrl,
      name
    );
}


/* =====================================
   CẬP NHẬT THÔNG TIN
===================================== */

function setProfileSubmitting(
  isSubmitting
) {
  if (!profileSubmitButton) {
    return;
  }

  profileSubmitButton.disabled =
    isSubmitting;

  profileSubmitButton.textContent =
    isSubmitting
      ? 'Đang lưu...'
      : 'Lưu thay đổi';
}

async function updateProfile() {
  const fullName =
    String(
      accountNameInput.value || ''
    )
      .trim()
      .replace(/\s+/g, ' ');

  if (fullName.length < 2) {
    showMessage(
      'Họ và tên phải có ít nhất 2 ký tự.',
      'error'
    );

    accountNameInput.focus();

    return;
  }

  if (fullName.length > 120) {
    showMessage(
      'Họ và tên không được vượt quá 120 ký tự.',
      'error'
    );

    accountNameInput.focus();

    return;
  }

  if (
    !window.AuthStore ||
    typeof AuthStore.authFetch !==
      'function'
  ) {
    showMessage(
      'Thành phần xác thực chưa được tải.',
      'error'
    );

    return;
  }

  setProfileSubmitting(true);

  try {
    const response =
      await AuthStore.authFetch(
        '/api/auth/me/profile',
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json'
          },

          body: JSON.stringify({
            fullName
          })
        }
      );

    let responseData = null;

    try {
      responseData =
        await response.json();
    } catch (error) {
      responseData = null;
    }

    if (!response.ok) {
      let errorMessage =
        'Không thể cập nhật hồ sơ.';

      if (
        responseData &&
        Array.isArray(
          responseData.message
        )
      ) {
        errorMessage =
          responseData.message.join(' ');
      } else if (
        responseData &&
        typeof responseData.message ===
          'string'
      ) {
        errorMessage =
          responseData.message;
      }

      throw new Error(
        errorMessage
      );
    }

    if (
      !responseData ||
      !responseData.user
    ) {
      throw new Error(
        'Backend không trả về thông tin người dùng hợp lệ.'
      );
    }

    const savedUser =
      AuthStore.saveCurrentUser(
        responseData.user
      );

    if (!savedUser) {
      throw new Error(
        'Không thể lưu thông tin người dùng mới.'
      );
    }

    currentUser =
      savedUser;

    currentAccount =
      savedUser;

    renderAccount();

    showMessage(
      responseData.message ||
        'Cập nhật hồ sơ thành công.',
      'success'
    );

    /*
     * Tải lại sau một khoảng ngắn
     * để navbar hiển thị tên mới.
     */
    window.setTimeout(
      function () {
        window.location.reload();
      },
      800
    );
  } catch (error) {
    console.error(
      'Lỗi cập nhật hồ sơ:',
      error
    );

    showMessage(
      error instanceof Error
        ? error.message
        : 'Không thể cập nhật hồ sơ.',
      'error'
    );
  } finally {
    setProfileSubmitting(false);
  }
}


/* =====================================
   ĐỔI MẬT KHẨU
===================================== */

function setPasswordSubmitting(
  isSubmitting
) {
  if (!passwordSubmitButton) {
    return;
  }

  passwordSubmitButton.disabled =
    isSubmitting;

  passwordSubmitButton.textContent =
    isSubmitting
      ? 'Đang cập nhật...'
      : 'Cập nhật mật khẩu';
}


async function changePassword() {
  const currentPassword =
    String(
      currentPasswordInput?.value ||
      ''
    );

  const newPassword =
    String(
      newPasswordInput?.value ||
      ''
    );

  const confirmNewPassword =
    String(
      confirmNewPasswordInput?.value ||
      ''
    );

  if (!currentPassword) {
    showMessage(
      'Vui lòng nhập mật khẩu hiện tại.',
      'error'
    );

    currentPasswordInput?.focus();
    return;
  }

  if (currentPassword.length > 128) {
    showMessage(
      'Mật khẩu hiện tại không được vượt quá 128 ký tự.',
      'error'
    );

    currentPasswordInput?.focus();
    return;
  }

  if (newPassword.length < 8) {
    showMessage(
      'Mật khẩu mới phải có ít nhất 8 ký tự.',
      'error'
    );

    newPasswordInput?.focus();
    return;
  }

  if (newPassword.length > 128) {
    showMessage(
      'Mật khẩu mới không được vượt quá 128 ký tự.',
      'error'
    );

    newPasswordInput?.focus();
    return;
  }

  if (
    newPassword !==
    confirmNewPassword
  ) {
    showMessage(
      'Mật khẩu xác nhận không khớp.',
      'error'
    );

    confirmNewPasswordInput?.focus();
    confirmNewPasswordInput?.select();

    return;
  }

  if (
    newPassword ===
    currentPassword
  ) {
    showMessage(
      'Mật khẩu mới phải khác mật khẩu hiện tại.',
      'error'
    );

    newPasswordInput?.focus();
    newPasswordInput?.select();

    return;
  }

  if (
    !window.AuthStore ||
    typeof AuthStore.authFetch !==
      'function'
  ) {
    showMessage(
      'Thành phần xác thực chưa được tải.',
      'error'
    );

    return;
  }

  setPasswordSubmitting(true);

  let passwordChanged = false;

  try {
    const response =
      await AuthStore.authFetch(
        '/api/auth/me/password',
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Accept:
              'application/json'
          },

          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmNewPassword
          })
        }
      );

    let responseData = null;

    try {
      responseData =
        await response.json();
    } catch (error) {
      responseData = null;
    }

    if (!response.ok) {
      let errorMessage =
        'Không thể đổi mật khẩu.';

      if (
        responseData &&
        Array.isArray(
          responseData.message
        )
      ) {
        errorMessage =
          responseData.message.join(' ');
      } else if (
        responseData &&
        typeof responseData.message ===
          'string'
      ) {
        errorMessage =
          responseData.message;
      }

      throw new Error(
        errorMessage
      );
    }

    if (
      !responseData ||
      responseData.success !== true
    ) {
      throw new Error(
        'Backend không trả về kết quả đổi mật khẩu hợp lệ.'
      );
    }

    passwordChanged = true;

    passwordForm?.reset();

    showMessage(
      responseData.message ||
        'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
      'success'
    );

    /*
     * Endpoint đã tăng tokenVersion,
     * thu hồi refresh sessions và
     * xóa refresh cookie.
     *
     * AuthStore.logout() xóa tiếp
     * access token và user ở trình duyệt.
     */
    await new Promise(
      function (resolve) {
        window.setTimeout(
          resolve,
          1200
        );
      }
    );

    await AuthStore.logout();

    window.location.replace(
      '/login.html'
    );
  } catch (error) {
    console.error(
      'Lỗi đổi mật khẩu:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Không thể đổi mật khẩu.';

    showMessage(
      message,
      'error'
    );

    if (
      message.includes(
        'Mật khẩu hiện tại'
      )
    ) {
      currentPasswordInput?.focus();
      currentPasswordInput?.select();
    }
  } finally {
    /*
     * Khi thành công, giữ nút bị khóa
     * cho đến khi chuyển sang login.
     */
    if (!passwordChanged) {
      setPasswordSubmitting(false);
    }
  }
}


/* =====================================
   SỰ KIỆN
===================================== */

if (profileForm) {
  profileForm.addEventListener(
    'submit',
    async function (event) {
      event.preventDefault();

      await updateProfile();
    }
  );
}

if (passwordForm) {
  passwordForm.addEventListener(
    'submit',
    async function (event) {
      event.preventDefault();

      await changePassword();
    }
  );
}


if (accountNameInput) {
  accountNameInput.addEventListener(
    'input',
    updateAvatarPreview
  );
}


if (accountAvatarInput) {
  accountAvatarInput.addEventListener(
    'input',
    updateAvatarPreview
  );
}


document
  .querySelectorAll(
    '.password-toggle-btn'
  )
  .forEach(function (button) {
    button.addEventListener(
      'click',
      function () {
        const targetId =
          button.dataset.passwordTarget;

        const input =
          document.getElementById(
            targetId
          );

        if (!input) {
          return;
        }

        input.type =
          input.type === 'password'
            ? 'text'
            : 'password';
      }
    );
  });


if (accountLogoutBtn) {
  accountLogoutBtn.addEventListener(
    'click',
    async function () {
      accountLogoutBtn.disabled =
        true;

      try {
        await AuthStore.logout();
      } finally {
        window.location.replace(
          '/index.html'
        );
      }
    }
  );
}


/* =====================================
   KHỞI TẠO
===================================== */
async function initializeAccountPage() {
  const allowed =
    await protectAccountPage();

  if (allowed) {
    renderAccount();
  }
}

initializeAccountPage()
  .catch(function (error) {
    console.error(
      'Không thể khởi tạo trang tài khoản:',
      error
    );
  });