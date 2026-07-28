const authBox =
  document.getElementById('authBox');


function getCurrentUser() {
  const savedUser =
    sessionStorage.getItem('user');

  if (!savedUser) {
    return null;
  }

  try {
    const user =
      JSON.parse(savedUser);

    if (!user || !user.email) {
      sessionStorage.removeItem('user');
      return null;
    }

    return user;
  } catch (error) {
    console.error(
      'Không thể đọc thông tin đăng nhập:',
      error
    );

    sessionStorage.removeItem('user');

    return null;
  }
}


function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function getUserInitial(name) {
  const safeName =
    String(name || 'U').trim();

  return safeName
    .charAt(0)
    .toUpperCase();
}


function logout() {
  sessionStorage.removeItem('user');

  window.location.href =
    '/index.html';
}


function renderGuestActions() {
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

  const userRole =
    String(user.role || 'USER')
      .toUpperCase();

  const avatar =
    user.avatar
      ? `
        <img
          src="${escapeHtml(user.avatar)}"
          alt="Ảnh đại diện ${userName}"
          class="account-avatar-image"
          onerror="
            this.style.display='none';
            this.nextElementSibling.style.display='flex';
          "
        />

        <span
          class="account-avatar-fallback"
          style="display: none;"
        >
          ${getUserInitial(userName)}
        </span>
      `
      : `
        <span class="account-avatar-fallback">
          ${getUserInitial(userName)}
        </span>
      `;

  const adminMenuItem =
    userRole === 'ADMIN'
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
        aria-controls="accountDropdownMenu"
      >
        <span class="account-avatar">
          ${avatar}
        </span>

        <span class="account-summary">
          <strong>${userName}</strong>

          <small>
            ${
              userRole === 'ADMIN'
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

        ${adminMenuItem}

        <button
          type="button"
          class="account-menu-item logout-menu-item"
          id="logoutBtn"
        >
          <span class="account-menu-icon">
            ↪
          </span>

          <span>
            Đăng xuất
          </span>
        </button>
      </div>
    </div>
  `;

  setupAccountMenu();
}


function setupAccountMenu() {
  const menuButton =
    document.getElementById(
      'accountMenuButton'
    );

  const dropdownMenu =
    document.getElementById(
      'accountDropdownMenu'
    );

  const logoutButton =
    document.getElementById(
      'logoutBtn'
    );

  if (
    !menuButton ||
    !dropdownMenu
  ) {
    return;
  }

  function closeMenu() {
    dropdownMenu.classList.remove(
      'show'
    );

    menuButton.classList.remove(
      'active'
    );

    menuButton.setAttribute(
      'aria-expanded',
      'false'
    );
  }

  function toggleMenu() {
    const isOpen =
      dropdownMenu.classList.toggle(
        'show'
      );

    menuButton.classList.toggle(
      'active',
      isOpen
    );

    menuButton.setAttribute(
      'aria-expanded',
      String(isOpen)
    );
  }

  menuButton.addEventListener(
    'click',
    function (event) {
      event.stopPropagation();

      toggleMenu();
    }
  );

  dropdownMenu.addEventListener(
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

  if (logoutButton) {
    logoutButton.addEventListener(
      'click',
      logout
    );
  }
}


function renderAuthenticationUI() {
  if (!authBox) {
    return;
  }

  const currentUser =
    getCurrentUser();

  if (!currentUser) {
    renderGuestActions();
    return;
  }

  if (
    currentUser.status === 'LOCKED'
  ) {
    sessionStorage.removeItem('user');

    renderGuestActions();

    return;
  }

  renderUserMenu(currentUser);
}


renderAuthenticationUI();