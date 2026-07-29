const authBox =
  document.getElementById(
    'authBox'
  );


function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function getInitial(name) {
  return String(name || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();
}


function renderGuestMenu() {
  if (!authBox) {
    return;
  }

  authBox.innerHTML = `
    <a
      href="/login.html"
      class="login-btn"
    >
      Đăng nhập
    </a>

    <a
      href="/register.html"
      class="register-navbar-btn"
    >
      Tạo tài khoản
    </a>
  `;
}


function renderUserMenu(user) {
  if (!authBox) {
    return;
  }

  const userName =
    escapeHtml(
      user.name || user.email
    );

  const isAdmin =
    AuthStore.isAdmin(user);

  const avatarHtml =
    user.avatar
      ? `
        <img
          src="${escapeHtml(
            user.avatar
          )}"
          alt="${userName}"
          class="account-avatar-image"
          onerror="
            this.style.display='none';
            this.nextElementSibling.style.display='flex';
          "
        />

        <span
          class="account-avatar-fallback"
          style="display:none"
        >
          ${getInitial(user.name)}
        </span>
      `
      : `
        <span
          class="account-avatar-fallback"
        >
          ${getInitial(user.name)}
        </span>
      `;

  const adminMenu =
    isAdmin
      ? `
        <a
          href="/admin-users.html"
          class="account-menu-item"
        >
          <span class="account-menu-icon">
            ⚙
          </span>

          <span>
            Quản lý tài khoản
          </span>
        </a>
      `
      : '';

  authBox.innerHTML = `
    <div class="account-dropdown">
      <button
        type="button"
        class="account-trigger"
        id="accountMenuButton"
        aria-expanded="false"
        
      >
        <span class="account-avatar">
          ${avatarHtml}
        </span>

        <span class="account-summary">
          <strong>${userName}</strong>

          <small>
            ${
              isAdmin
                ? 'Quản trị viên'
                : 'Người dùng'
            }
          </small>
        </span>

        <span class="account-arrow">
          ▾
        </span>
      </button>

      <div
        class="account-dropdown-menu"
        id="accountDropdownMenu"
      >
        <div class="account-menu-header">
          <strong>${userName}</strong>

          <span>
            ${escapeHtml(user.email)}
          </span>
        </div>

        <a
          href="/account.html"
          class="account-menu-item"
        >
          <span class="account-menu-icon">
            👤
          </span>

          <span>
            Thông tin tài khoản
          </span>
        </a>

        ${adminMenu}

        <button
          type="button"
          class="account-menu-item logout-menu-item"
          id="logoutBtn"
        >
          <span class="account-menu-icon">
            ↪
          </span>

          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  `;

  setupUserMenu();
}


function setupUserMenu() {
  const accountMenuButton =
    document.getElementById(
      'accountMenuButton'
    );

  const accountDropdownMenu =
    document.getElementById(
      'accountDropdownMenu'
    );

  const logoutBtn =
    document.getElementById(
      'logoutBtn'
    );

  if (
    !accountMenuButton ||
    !accountDropdownMenu
  ) {
    return;
  }

  function closeMenu() {
    accountDropdownMenu.classList.remove(
      'show'
    );

    accountMenuButton.classList.remove(
      'active'
    );

    accountMenuButton.setAttribute(
      'aria-expanded',
      'false'
    );
  }

  accountMenuButton.addEventListener(
    'click',
    function (event) {
      event.stopPropagation();

      const isOpen =
        accountDropdownMenu
          .classList
          .toggle('show');

      accountMenuButton.classList.toggle(
        'active',
        isOpen
      );

      accountMenuButton.setAttribute(
        'aria-expanded',
        String(isOpen)
      );
    }
  );

  accountDropdownMenu.addEventListener(
    'click',
    function (event) {
      event.stopPropagation();
    }
  );

  document.addEventListener(
    'click',
    closeMenu
  );

  document.addEventListener(
    'keydown',
    function (event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    }
  );

  if (logoutBtn) {
    logoutBtn.addEventListener(
      'click',
      function () {
        AuthStore.logout();

        window.location.href =
          '/index.html';
      }
    );
  }
}


function renderAuthenticationUI() {


  const currentUser =
    AuthStore.getCurrentUser();

  if (!currentUser) {
    renderGuestMenu();

    return;
  }

  renderUserMenu(
    currentUser
  );
}

function showAuthGuardNotice() {
  if (
    !window.AuthGuard ||
    !window.Toast
  ) {
    return;
  }

  const notice =
    AuthGuard.consumeNotice();

  if (
    !notice ||
    !notice.message
  ) {
    return;
  }

  const method =
    Toast[notice.type] ||
    Toast.info;

  method(notice.message);
}


renderAuthenticationUI();
showAuthGuardNotice();