(function (window) {
  'use strict';

  const NOTICE_KEY =
    'travelTtsAuthNotice';

  const AUTH_MODES = {
    PUBLIC: 'public',
    GUEST: 'guest',
    REQUIRED: 'required',
    ADMIN: 'admin'
  };

  const state = {
    checked: false,
    accessGranted: false,
    mode: AUTH_MODES.PUBLIC,
    user: null
  };


  function revealPage() {
    document.documentElement.classList.remove(
      'auth-checking'
    );
  }


  function getCurrentRelativeUrl() {
    return (
      window.location.pathname +
      window.location.search +
      window.location.hash
    );
  }


  function sanitizeRedirect(
    value,
    fallback
  ) {
    const defaultPath =
      fallback || '/index.html';

    if (!value) {
      return defaultPath;
    }

    try {
      const candidate =
        String(value).trim();

      if (
        !candidate ||
        candidate.startsWith('//')
      ) {
        return defaultPath;
      }

      const url =
        new URL(
          candidate,
          window.location.origin
        );

      if (
        url.origin !==
        window.location.origin
      ) {
        return defaultPath;
      }

      return (
        url.pathname +
        url.search +
        url.hash
      );
    } catch (error) {
      return defaultPath;
    }
  }


  function getRedirectTarget(
    fallback
  ) {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const redirect =
      params.get('redirect');

    return sanitizeRedirect(
      redirect,
      fallback || '/index.html'
    );
  }


  function createLoginUrl() {
    const currentUrl =
      getCurrentRelativeUrl();

    return (
      '/login.html?redirect=' +
      encodeURIComponent(currentUrl)
    );
  }


  function setNotice(
    message,
    type
  ) {
    sessionStorage.setItem(
      NOTICE_KEY,
      JSON.stringify({
        message: message,
        type: type || 'error',
        createdAt:
          new Date().toISOString()
      })
    );
  }


  function consumeNotice() {
    const savedNotice =
      sessionStorage.getItem(
        NOTICE_KEY
      );

    if (!savedNotice) {
      return null;
    }

    sessionStorage.removeItem(
      NOTICE_KEY
    );

    try {
      return JSON.parse(
        savedNotice
      );
    } catch (error) {
      return null;
    }
  }


  function redirectTo(path) {
    state.accessGranted = false;

    window.__AUTH_REDIRECTING__ =
      true;

    revealPage();

    window.location.replace(path);

    return false;
  }


  function isGuestPage(path) {
    try {
      const url =
        new URL(
          path,
          window.location.origin
        );

      return [
        '/login.html',
        '/register.html'
      ].includes(url.pathname);
    } catch (error) {
      return false;
    }
  }


  function enforce() {
    state.checked = true;

    const body =
      document.body;

    if (!body) {
      revealPage();

      state.accessGranted = true;

      return true;
    }

    if (!window.AuthStore) {
      console.error(
        'AuthStore chưa được tải. Hãy đặt auth-store.js trước auth-guard.js.'
      );

      revealPage();

      state.accessGranted = false;

      return false;
    }

    const mode =
      String(
        body.dataset.auth ||
        AUTH_MODES.PUBLIC
      ).toLowerCase();

    const currentUser =
      AuthStore.getCurrentUser();

    state.mode = mode;
    state.user = currentUser;

    /*
     * Trang công khai:
     * ai cũng được truy cập.
     */
    if (
      mode === AUTH_MODES.PUBLIC
    ) {
      state.accessGranted = true;

      revealPage();

      return true;
    }

    /*
     * Trang dành cho khách:
     * login.html, register.html
     */
    if (
      mode === AUTH_MODES.GUEST
    ) {
      if (!currentUser) {
        state.accessGranted = true;

        revealPage();

        return true;
      }

      let redirectTarget =
        getRedirectTarget(
          body.dataset.authRedirect ||
          '/index.html'
        );

      if (
        isGuestPage(
          redirectTarget
        )
      ) {
        redirectTarget =
          '/index.html';
      }

      return redirectTo(
        redirectTarget
      );
    }

    /*
     * Trang yêu cầu đăng nhập.
     */
    if (
      mode === AUTH_MODES.REQUIRED
    ) {
      if (!currentUser) {
        setNotice(
          'Bạn cần đăng nhập để truy cập trang này.',
          'error'
        );

        return redirectTo(
          createLoginUrl()
        );
      }

      state.accessGranted = true;

      revealPage();

      return true;
    }

    /*
     * Trang chỉ dành cho ADMIN.
     */
    if (
      mode === AUTH_MODES.ADMIN
    ) {
      if (!currentUser) {
        setNotice(
          'Bạn cần đăng nhập bằng tài khoản quản trị.',
          'error'
        );

        return redirectTo(
          createLoginUrl()
        );
      }

      if (
        !AuthStore.isAdmin(
          currentUser
        )
      ) {
        setNotice(
          'Bạn không có quyền truy cập trang quản trị.',
          'error'
        );

        return redirectTo(
          '/index.html'
        );
      }

      state.accessGranted = true;

      revealPage();

      return true;
    }

    console.warn(
      `Giá trị data-auth không hợp lệ: ${mode}`
    );

    state.accessGranted = true;

    revealPage();

    return true;
  }


  function requireUser() {
    const user =
      AuthStore.getCurrentUser();

    if (!user) {
      redirectTo(
        createLoginUrl()
      );

      return null;
    }

    return user;
  }


  function requireAdmin() {
    const user =
      requireUser();

    if (!user) {
      return null;
    }

    if (
      !AuthStore.isAdmin(user)
    ) {
      setNotice(
        'Bạn không có quyền truy cập trang quản trị.',
        'error'
      );

      redirectTo(
        '/index.html'
      );

      return null;
    }

    return user;
  }


  const AuthGuard = {
    modes: AUTH_MODES,
    state: state,

    enforce: enforce,

    requireUser:
      requireUser,

    requireAdmin:
      requireAdmin,

    sanitizeRedirect:
      sanitizeRedirect,

    getRedirectTarget:
      getRedirectTarget,

    createLoginUrl:
      createLoginUrl,

    setNotice:
      setNotice,

    consumeNotice:
      consumeNotice
  };

  window.AuthGuard =
    AuthGuard;

  if (document.body) {
    enforce();
  } else {
    document.addEventListener(
      'DOMContentLoaded',
      enforce,
      {
        once: true
      }
    );
  }
})(window);