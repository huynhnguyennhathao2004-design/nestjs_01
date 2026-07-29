const profileForm =
  document.getElementById(
    'profileForm'
  );

const passwordForm =
  document.getElementById(
    'passwordForm'
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


function getAccounts() {
  return AuthStore.getAccounts();
}


function saveAccounts(accounts) {
  return AuthStore.saveAccounts(
    accounts
  );
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

function protectAccountPage() {
  currentUser =
    getCurrentUser();

  if (!currentUser) {
    window.location.replace(
      '/login.html'
    );

    return false;
  }

  if (
    String(currentUser.status)
      .toUpperCase() === 'LOCKED'
  ) {
    sessionStorage.removeItem('user');

    window.location.replace(
      '/login.html'
    );

    return false;
  }

  const accounts =
    getAccounts();

  currentAccount =
    accounts.find(
      function (account) {
        return isSameId(
          account.id,
          currentUser.id
        );
      }
    );

  if (!currentAccount) {
    sessionStorage.removeItem('user');

    window.location.replace(
      '/login.html'
    );

    return false;
  }

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

function updateProfile() {
  const name =
    accountNameInput.value.trim();

  const avatar =
    accountAvatarInput.value.trim();

  if (name.length < 2) {
    showMessage(
      'Họ và tên phải có ít nhất 2 ký tự.',
      'error'
    );

    accountNameInput.focus();

    return;
  }

  const accounts =
    getAccounts();

  const accountIndex =
    accounts.findIndex(
      function (account) {
        return isSameId(
          account.id,
          currentAccount.id
        );
      }
    );

  if (accountIndex === -1) {
    showMessage(
      'Không tìm thấy tài khoản.',
      'error'
    );

    return;
  }

  accounts[accountIndex].name =
    name;

  accounts[accountIndex].avatar =
    avatar;

  saveAccounts(accounts);

  currentAccount =
    accounts[accountIndex];

  currentUser = {
    ...currentUser,
    name: name,
    avatar: avatar
  };

  saveCurrentUser(currentUser);

  renderAccount();

  showMessage(
    'Cập nhật thông tin tài khoản thành công.',
    'success'
  );

  window.setTimeout(
    function () {
      window.location.reload();
    },
    700
  );
}


/* =====================================
   ĐỔI MẬT KHẨU
===================================== */

function changePassword() {
  const currentPassword =
    currentPasswordInput.value;

  const newPassword =
    newPasswordInput.value;

  const confirmNewPassword =
    confirmNewPasswordInput.value;

  if (
    currentPassword !==
    currentAccount.password
  ) {
    showMessage(
      'Mật khẩu hiện tại không chính xác.',
      'error'
    );

    currentPasswordInput.focus();

    return;
  }

  if (newPassword.length < 8) {
    showMessage(
      'Mật khẩu mới phải có ít nhất 8 ký tự.',
      'error'
    );

    newPasswordInput.focus();

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

    newPasswordInput.focus();

    return;
  }

  if (
    newPassword !==
    confirmNewPassword
  ) {
    showMessage(
      'Mật khẩu nhập lại không khớp.',
      'error'
    );

    confirmNewPasswordInput.focus();

    return;
  }

  const accounts =
    getAccounts();

  const accountIndex =
    accounts.findIndex(
      function (account) {
        return isSameId(
          account.id,
          currentAccount.id
        );
      }
    );

  if (accountIndex === -1) {
    showMessage(
      'Không tìm thấy tài khoản.',
      'error'
    );

    return;
  }

  accounts[accountIndex].password =
    newPassword;

  saveAccounts(accounts);

  currentAccount =
    accounts[accountIndex];

  passwordForm.reset();

  showMessage(
    'Đổi mật khẩu thành công.',
    'success'
  );
}


/* =====================================
   SỰ KIỆN
===================================== */

if (profileForm) {
  profileForm.addEventListener(
    'submit',
    function (event) {
      event.preventDefault();

      updateProfile();
    }
  );
}


if (passwordForm) {
  passwordForm.addEventListener(
    'submit',
    function (event) {
      event.preventDefault();

      changePassword();
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
    function () {
      AuthStore.logout();

      window.location.href =
        '/index.html';
    }
  );
  
}if (accountLogoutBtn) {
  accountLogoutBtn.addEventListener(
    'click',
    function () {
      AuthStore.logout();

      window.location.href =
        '/index.html';
    }
  );
}


/* =====================================
   KHỞI TẠO
===================================== */

if (protectAccountPage()) {
  renderAccount();
}
