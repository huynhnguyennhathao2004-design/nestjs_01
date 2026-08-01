(function (window) {
  'use strict';

  /*
   * AuthStore hiện chỉ chịu trách nhiệm:
   * - lưu người dùng hiện tại trong sessionStorage;
   * - lưu email được ghi nhớ;
   * - cung cấp các hàm cơ bản cho auth-api.js.
   *
   * Đăng nhập, đăng ký, refresh token,
   * đăng xuất và cập nhật tài khoản
   * được thực hiện qua API backend.
   */

  const STORAGE_KEYS = {
    currentUser: 'user',
    rememberedEmail:
      'rememberedEmail'
  };

  /*
   * Các khóa thuộc hệ thống tài khoản
   * localStorage cũ cần xóa.
   */
  const LEGACY_LOCAL_KEYS = [
    'travelTtsAccounts',
    'travelTtsAccount',

    /*
     * Trước đây người dùng hiện tại
     * từng được lưu trong localStorage.
     * Hiện tại dùng sessionStorage.
     */
    'user'
  ];

  function clone(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return value;
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function safeParse(
    value,
    fallback
  ) {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function normalizeEmail(email) {
    return String(email || '')
      .trim()
      .toLowerCase();
  }

  function normalizeUser(user) {
    if (
      !user ||
      typeof user !== 'object'
    ) {
      return null;
    }

    const id =
      user.id !== undefined &&
      user.id !== null
        ? String(user.id)
        : '';

    const fullName =
      String(
        user.fullName ||
        user.name ||
        ''
      ).trim();

    return {
      id,

      name:
        fullName,

      fullName,

      email:
        normalizeEmail(
          user.email
        ),

      role:
        String(
          user.role || 'USER'
        ).toUpperCase(),

      status:
        String(
          user.status ||
          'ACTIVE'
        ).toUpperCase(),

      provider:
        String(
          user.provider ||
          'LOCAL'
        ).toUpperCase(),

      avatar:
        String(
          user.avatar ||
          user.avatarUrl ||
          ''
        ).trim(),

      avatarUrl:
        user.avatarUrl ??
        user.avatar ??
        null,

      emailVerifiedAt:
        user.emailVerifiedAt ??
        null,

      lastLoginAt:
        user.lastLoginAt ??
        null,

      createdAt:
        user.createdAt ??
        null,

      updatedAt:
        user.updatedAt ??
        null
    };
  }

  function saveCurrentUser(user) {
    if (!user) {
      sessionStorage.removeItem(
        STORAGE_KEYS.currentUser
      );

      return null;
    }

    const normalizedUser =
      normalizeUser(user);

    if (
      !normalizedUser ||
      !normalizedUser.id
    ) {
      return null;
    }

    sessionStorage.setItem(
      STORAGE_KEYS.currentUser,
      JSON.stringify(
        normalizedUser
      )
    );

    return clone(
      normalizedUser
    );
  }

  function getCurrentUser() {
    const savedUser =
      safeParse(
        sessionStorage.getItem(
          STORAGE_KEYS.currentUser
        ),
        null
      );

    return normalizeUser(
      savedUser
    );
  }

  function clearCurrentUser() {
    sessionStorage.removeItem(
      STORAGE_KEYS.currentUser
    );
  }

  /*
   * Đây chỉ là hàm dự phòng.
   * auth-api.js sẽ thay thế logout()
   * bằng phiên bản gọi API backend.
   */
  function logout() {
    clearCurrentUser();
  }

  function isAdmin(user) {
    const targetUser =
      user ||
      getCurrentUser();

    return Boolean(
      targetUser &&
      String(
        targetUser.role || ''
      ).toUpperCase() ===
        'ADMIN'
    );
  }

  function setRememberedEmail(
    email
  ) {
    const normalizedEmail =
      normalizeEmail(email);

    if (!normalizedEmail) {
      localStorage.removeItem(
        STORAGE_KEYS
          .rememberedEmail
      );

      return;
    }

    localStorage.setItem(
      STORAGE_KEYS.remembered.rememberedEmail
      );

      return;
    }

    localStorage.setItem(
      STORAGE_KEYS.rememberedEmail,
      normalizedEmail
    );
    

  function getRememberedEmail() {
    return (
      localStorage.getItem(
        STORAGE_KEYS
          .rememberedEmail
      ) || ''
    );
  }

  function clearRememberedEmail() {
    localStorage.removeItem(
      STORAGE_KEYS
        .rememberedEmail
    );
  }

  function removeLegacyData() {
    LEGACY_LOCAL_KEYS.forEach(
      function (key) {
        localStorage.removeItem(
          key
        );
      }
    );
  }

  function initialize() {
    removeLegacyData();

    return true;
  }

  window.AuthStore = {
    keys:
      clone(STORAGE_KEYS),

    initialize,

    normalizeEmail,
    normalizeUser,

    getCurrentUser,
    saveCurrentUser,
    clearCurrentUser,

    logout,
    isAdmin,

    setRememberedEmail,
    getRememberedEmail,
    clearRememberedEmail
  };

  initialize();
})(window);