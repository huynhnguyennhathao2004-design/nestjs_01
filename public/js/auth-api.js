(function (window) {
  'use strict';

  const API_BASE_URL = '/api/auth';

  const SESSION_KEYS = {
    accessToken: 'travelTtsAccessToken',
    accessTokenExpiresAt:
      'travelTtsAccessTokenExpiresAt',
    currentUser: 'user'
  };

  const LOCAL_KEYS = {
    rememberedEmail: 'rememberedEmail',

    refreshSessionHint:
      'travelTtsHasRefreshSession',

    legacyAccounts: 'travelTtsAccounts',
    legacyAccount: 'travelTtsAccount',
    legacyCurrentUser: 'user'
  };

  /*
   * Ngăn nhiều request cùng lúc
   * tạo nhiều lần xoay refresh token.
   */
  let refreshPromise = null;

  function safeParse(value, fallback) {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function normalizeEmail(value) {
    return String(value || '')
      .trim()
      .toLowerCase();
  }

  function normalizeUser(user) {
    if (!user) {
      return null;
    }

    return {
      id: String(user.id || ''),

      name: String(
        user.name ||
        user.fullName ||
        user.email ||
        'Người dùng'
      ).trim(),

      fullName: String(
        user.fullName ||
        user.name ||
        user.email ||
        'Người dùng'
      ).trim(),

      email: normalizeEmail(
        user.email
      ),

      role:
        String(user.role || '')
          .toUpperCase() === 'ADMIN'
          ? 'ADMIN'
          : 'USER',

      status: String(
        user.status || 'ACTIVE'
      ).toUpperCase(),

      provider: String(
        user.provider || 'LOCAL'
      ).toUpperCase(),

      avatar: String(
        user.avatar ||
        user.avatarUrl ||
        ''
      ).trim(),

      avatarUrl:
        user.avatarUrl ||
        user.avatar ||
        null,

      emailVerifiedAt:
        user.emailVerifiedAt || null,

      lastLoginAt:
        user.lastLoginAt || null,

      createdAt:
        user.createdAt || null,

      updatedAt:
        user.updatedAt || null
    };
  }

  function extractErrorMessage(
    responseData,
    fallback
  ) {
    if (
      responseData &&
      Array.isArray(
        responseData.message
      )
    ) {
      return responseData
        .message
        .join(' ');
    }

    if (
      responseData &&
      typeof responseData.message ===
        'string'
    ) {
      return responseData.message;
    }

    return fallback;
  }

  async function parseResponse(
    response,
    fallbackMessage
  ) {
    let responseData = null;

    try {
      responseData =
        await response.json();
    } catch (error) {
      responseData = null;
    }

    if (!response.ok) {
      const requestError =
        new Error(
          extractErrorMessage(
            responseData,
            fallbackMessage
          )
        );

      requestError.status =
        response.status;

      requestError.data =
        responseData;

      throw requestError;
    }

    return responseData;
  }

  function saveCurrentUser(user) {
    const normalizedUser =
      normalizeUser(user);

    if (
      !normalizedUser ||
      !normalizedUser.id ||
      !normalizedUser.email
    ) {
      sessionStorage.removeItem(
        SESSION_KEYS.currentUser
      );

      return null;
    }

    sessionStorage.setItem(
      SESSION_KEYS.currentUser,
      JSON.stringify(normalizedUser)
    );

    return normalizedUser;
  }

  function getCurrentUser() {
    const savedUser = safeParse(
      sessionStorage.getItem(
        SESSION_KEYS.currentUser
      ),
      null
    );

    if (!savedUser) {
      return null;
    }

    const user =
      normalizeUser(savedUser);

    if (
      !user ||
      user.status !== 'ACTIVE'
    ) {
      clearLocalSession();
      return null;
    }

    return user;
  }

  function saveAccessToken(
    token,
    expiresInSeconds
  ) {
    sessionStorage.setItem(
      SESSION_KEYS.accessToken,
      String(token)
    );

    const seconds =
      Number(expiresInSeconds);

    if (
      Number.isFinite(seconds) &&
      seconds > 0
    ) {
      /*
       * Trừ 5 giây để không sử dụng token
       * ngay sát thời điểm hết hạn.
       */
      const expiresAt =
        Date.now() +
        Math.max(
          seconds - 5,
          1
        ) * 1000;

      sessionStorage.setItem(
        SESSION_KEYS
          .accessTokenExpiresAt,
        String(expiresAt)
      );
    } else {
      sessionStorage.removeItem(
        SESSION_KEYS
          .accessTokenExpiresAt
      );
    }
  }

  function clearAccessToken() {
    sessionStorage.removeItem(
      SESSION_KEYS.accessToken
    );

    sessionStorage.removeItem(
      SESSION_KEYS
        .accessTokenExpiresAt
    );
  }

  function setRefreshSessionHint(
    enabled
  ) {
    if (enabled) {
      localStorage.setItem(
        LOCAL_KEYS.refreshSessionHint,
        '1'
      );

      return;
    }

    localStorage.removeItem(
      LOCAL_KEYS.refreshSessionHint
    );
  }

  function hasRefreshSessionHint() {
    return (
      localStorage.getItem(
        LOCAL_KEYS.refreshSessionHint
      ) === '1'
    );
  }

  function clearLocalSession() {
    clearAccessToken();

    sessionStorage.removeItem(
      SESSION_KEYS.currentUser
    );
  }

  function getAccessToken() {
    const token =
      sessionStorage.getItem(
        SESSION_KEYS.accessToken
      );

    if (!token) {
      return '';
    }

    const expiresAt = Number(
      sessionStorage.getItem(
        SESSION_KEYS
          .accessTokenExpiresAt
      )
    );

    if (
      Number.isFinite(expiresAt) &&
      expiresAt > 0 &&
      Date.now() >= expiresAt
    ) {
      /*
       * Chỉ xóa access token.
       * Không xóa refresh session vì
       * frontend còn phải gọi /refresh.
       */
      clearAccessToken();

      return '';
    }

    return token;
  }

  function getAuthHeaders(
    additionalHeaders
  ) {
    const headers =
      Object.assign(
        {},
        additionalHeaders || {}
      );

    const token =
      getAccessToken();

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    return headers;
  }

  async function register(account) {
    const payload =
      account || {};

    const fullName = String(
      payload.fullName ||
      payload.name ||
      ''
    )
      .trim()
      .replace(/\s+/g, ' ');

    const email =
      normalizeEmail(
        payload.email
      );

    const password =
      String(
        payload.password || ''
      );

    try {
      const response = await fetch(
        `${API_BASE_URL}/register`,
        {
          method: 'POST',

          credentials:
            'same-origin',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            fullName,
            email,
            password
          })
        }
      );

      const responseData =
        await parseResponse(
          response,
          'Không thể tạo tài khoản.'
        );

      if (
        !responseData ||
        !responseData.user
      ) {
        throw new Error(
          'Backend không trả về dữ liệu đăng ký hợp lệ.'
        );
      }

      return {
        ok: true,

        message:
          responseData.message ||
          'Tạo tài khoản thành công.',

        user: normalizeUser(
          responseData.user
        )
      };
    } catch (error) {
      return {
        ok: false,

        code:
          error &&
          error.status === 409
            ? 'EMAIL_EXISTS'
            : 'REGISTER_FAILED',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể tạo tài khoản.'
      };
    }
  }

  async function login(
    email,
    password,
    options
  ) {
    const settings =
      options || {};

    const normalizedEmail =
      normalizeEmail(email);

    try {
      const response = await fetch(
        `${API_BASE_URL}/login`,
        {
          method: 'POST',

          credentials:
            'same-origin',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            email:
              normalizedEmail,

            password:
              String(
                password || ''
              )
          })
        }
      );

      const responseData =
        await parseResponse(
          response,
          'Không thể đăng nhập.'
        );

      if (
        !responseData ||
        !responseData.accessToken ||
        !responseData.user
      ) {
        throw new Error(
          'Backend không trả về dữ liệu đăng nhập hợp lệ.'
        );
      }

      saveAccessToken(
        responseData.accessToken,
        responseData.expiresIn
      );

      const currentUser =
        saveCurrentUser(
          responseData.user
        );

      /*
       * Cookie thật là HttpOnly.
       * Giá trị này chỉ là dấu hiệu để
       * frontend biết có thể thử refresh.
       */
      setRefreshSessionHint(true);

      if (settings.remember) {
        localStorage.setItem(
          LOCAL_KEYS.rememberedEmail,
          normalizedEmail
        );
      } else {
        localStorage.removeItem(
          LOCAL_KEYS.rememberedEmail
        );
      }

      return {
        ok: true,
        user: currentUser
      };
    } catch (error) {
      clearLocalSession();
      setRefreshSessionHint(false);

      return {
        ok: false,

        code:
          error &&
          error.status === 401
            ? 'INVALID_CREDENTIALS'
            : 'LOGIN_FAILED',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể đăng nhập.'
      };
    }
  }

  async function performRefresh() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/refresh`,
        {
          method: 'POST',

          credentials:
            'same-origin',

          headers: {
            Accept:
              'application/json'
          }
        }
      );

      const responseData =
        await parseResponse(
          response,
          'Không thể làm mới phiên đăng nhập.'
        );

      if (
        !responseData ||
        !responseData.accessToken ||
        !responseData.user
      ) {
        throw new Error(
          'Backend không trả về dữ liệu refresh hợp lệ.'
        );
      }

      saveAccessToken(
        responseData.accessToken,
        responseData.expiresIn
      );

      const user =
        saveCurrentUser(
          responseData.user
        );

      setRefreshSessionHint(true);

      return {
        ok: true,
        user
      };
    } catch (error) {
      if (
        error &&
        (
          error.status === 401 ||
          error.status === 403
        )
      ) {
        clearLocalSession();
        setRefreshSessionHint(false);
      } else {
        console.error(
          'Không thể refresh token:',
          error
        );
      }

      return {
        ok: false,

        status:
          error &&
          error.status
            ? error.status
            : 0,

        message:
          error instanceof Error
            ? error.message
            : 'Không thể làm mới phiên đăng nhập.'
      };
    }
  }

  function refreshAccessToken() {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise =
      performRefresh()
        .finally(function () {
          refreshPromise = null;
        });

    return refreshPromise;
  }

  async function ensureAccessToken(
  forceRefresh
) {
  if (!forceRefresh) {
    const currentToken =
      getAccessToken();

    if (currentToken) {
      return currentToken;
    }
  }

  /*
   * Luôn thử gọi refresh khi access token
   * không còn. Nếu không có cookie,
   * backend sẽ trả 401 và frontend
   * xử lý đăng xuất.
   */
  const refreshResult =
    await refreshAccessToken();

  if (!refreshResult.ok) {
    return '';
  }

  return getAccessToken();
}

  async function requestCurrentUser(
    token
  ) {
    return fetch(
      `${API_BASE_URL}/me`,
      {
        method: 'GET',

        credentials:
          'same-origin',

        headers: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            'application/json'
        }
      }
    );
  }

  async function refreshCurrentUser() {
    let token =
      await ensureAccessToken(false);

    if (!token) {
      return null;
    }

    try {
      let response =
        await requestCurrentUser(
          token
        );

      /*
       * Token có thể vừa hết hạn giữa
       * thời điểm kiểm tra và request.
       */
      if (
        response.status === 401
      ) {
        token =
          await ensureAccessToken(
            true
          );

        if (!token) {
          return null;
        }

        response =
          await requestCurrentUser(
            token
          );
      }

      const responseData =
        await parseResponse(
          response,
          'Không thể kiểm tra phiên đăng nhập.'
        );

      return saveCurrentUser(
        responseData.user
      );
    } catch (error) {
      if (
        error &&
        (
          error.status === 401 ||
          error.status === 403
        )
      ) {
        clearLocalSession();
        setRefreshSessionHint(false);

        return null;
      }

      /*
       * Mất mạng tạm thời:
       * vẫn giữ thông tin đã có trong
       * sessionStorage.
       */
      console.error(
        'Không thể kiểm tra phiên đăng nhập:',
        error
      );

      return getCurrentUser();
    }
  }

  /*
   * Dùng hàm này cho các API cần đăng nhập.
   * Nếu nhận 401, hàm sẽ refresh và thử lại
   * request đúng một lần.
   */
  async function authFetch(
    input,
    options
  ) {
    const requestOptions =
      Object.assign(
        {},
        options || {}
      );

    const headers =
      new Headers(
        requestOptions.headers ||
        {}
      );

    const token =
      await ensureAccessToken(false);

    if (token) {
      headers.set(
        'Authorization',
        `Bearer ${token}`
      );
    }

    let response =
      await fetch(
        input,
        {
          ...requestOptions,

          credentials:
            'same-origin',

          headers
        }
      );

    if (
      response.status !== 401
    ) {
      return response;
    }

    const nextToken =
      await ensureAccessToken(true);

    if (!nextToken) {
      return response;
    }

    const retryHeaders =
      new Headers(
        requestOptions.headers ||
        {}
      );

    retryHeaders.set(
      'Authorization',
      `Bearer ${nextToken}`
    );

    response =
      await fetch(
        input,
        {
          ...requestOptions,

          credentials:
            'same-origin',

          headers:
            retryHeaders
        }
      );

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      clearLocalSession();
      setRefreshSessionHint(false);
    }

    return response;
  }

  async function logout() {
    let serverLogoutSucceeded =
      false;

    try {
      const response = await fetch(
        `${API_BASE_URL}/logout`,
        {
          method: 'POST',

          credentials:
            'same-origin',

          headers: {
            Accept:
              'application/json'
          }
        }
      );

      serverLogoutSucceeded =
        response.ok;
    } catch (error) {
      console.error(
        'Không thể thông báo đăng xuất đến server:',
        error
      );
    } finally {
      /*
       * Dù backend mất kết nối, vẫn xóa
       * phiên phía trình duyệt.
       */
      clearLocalSession();
      setRefreshSessionHint(false);
    }

    return {
      ok: true,
      serverLogoutSucceeded
    };
  }

  function isAdmin(user) {
    const targetUser =
      user || getCurrentUser();

    return Boolean(
      targetUser &&
      String(targetUser.role)
        .toUpperCase() ===
          'ADMIN'
    );
  }

  function getRememberedEmail() {
    return (
      localStorage.getItem(
        LOCAL_KEYS.rememberedEmail
      ) || ''
    );
  }

  function clearRememberedEmail() {
    localStorage.removeItem(
      LOCAL_KEYS.rememberedEmail
    );
  }

  function removeLegacySensitiveData() {
    /*
     * Xóa các dữ liệu cũ từng
     * chứa mật khẩu dạng rõ.
     */
    localStorage.removeItem(
      LOCAL_KEYS.legacyAccounts
    );

    localStorage.removeItem(
      LOCAL_KEYS.legacyAccount
    );

    localStorage.removeItem(
      LOCAL_KEYS.legacyCurrentUser
    );
  }

  if (!window.AuthStore) {
    window.AuthStore = {};
  }

  Object.assign(
    window.AuthStore,
    {
      register,
      login,
      logout,

      getCurrentUser,
      saveCurrentUser,

      getAccessToken,
      getAuthHeaders,

      refreshAccessToken,
      refreshCurrentUser,
      ensureAccessToken,

      authFetch,

      isAdmin,

      getRememberedEmail,
      clearRememberedEmail
    }
  );

  removeLegacySensitiveData();
})(window);