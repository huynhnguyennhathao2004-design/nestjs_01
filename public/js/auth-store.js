(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    accounts: 'travelTtsAccounts',
    oldAccount: 'travelTtsAccount',
    currentUser: 'user',
    rememberedEmail: 'rememberedEmail'
  };

  const DEFAULT_ADMIN = {
    id: 'admin-default',
    name: 'Admin',
    email: 'admin@gmail.com',
    password: '123456',
    role: 'ADMIN',
    status: 'ACTIVE',
    provider: 'LOCAL',
    avatar: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }

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

  function normalizeEmail(email) {
    return String(email || '')
      .trim()
      .toLowerCase();
  }

  function normalizeRole(role) {
    return String(role || '')
      .toUpperCase() === 'ADMIN'
      ? 'ADMIN'
      : 'USER';
  }

  function normalizeStatus(status) {
    return String(status || '')
      .toUpperCase() === 'LOCKED'
      ? 'LOCKED'
      : 'ACTIVE';
  }

  function normalizeProvider(provider) {
    return String(provider || '')
      .toUpperCase() === 'GOOGLE'
      ? 'GOOGLE'
      : 'LOCAL';
  }

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
        'function'
    ) {
      return window.crypto.randomUUID();
    }

    return (
      Date.now().toString() +
      Math.random()
        .toString(16)
        .slice(2)
    );
  }

  function normalizeDate(value) {
    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return new Date().toISOString();
    }

    return date.toISOString();
  }

  function normalizeAccount(account) {
    const source = account || {};

    return {
      id:
        source.id !== undefined &&
        source.id !== null
          ? String(source.id)
          : createId(),

      name:
        String(
          source.name ||
          source.fullName ||
          'Người dùng'
        ).trim(),

      email:
        normalizeEmail(source.email),

      password:
        String(source.password || ''),

      role:
        normalizeRole(source.role),

      status:
        normalizeStatus(
          source.status
        ),

      provider:
        normalizeProvider(
          source.provider
        ),

      avatar:
        String(
          source.avatar ||
          source.avatarUrl ||
          ''
        ).trim(),

      createdAt:
        normalizeDate(
          source.createdAt ||
          new Date().toISOString()
        ),

      updatedAt:
        normalizeDate(
          source.updatedAt ||
          source.createdAt ||
          new Date().toISOString()
        )
    };
  }

  function toPublicAccount(account) {
    if (!account) {
      return null;
    }

    return {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      status: account.status,
      provider: account.provider,
      avatar: account.avatar,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    };
  }

  function removeDuplicateAccounts(accounts) {
    const result = [];
    const usedEmails = new Set();
    const usedIds = new Set();

    accounts.forEach(function (account) {
      const normalized =
        normalizeAccount(account);

      if (!normalized.email) {
        return;
      }

      if (
        usedEmails.has(
          normalized.email
        )
      ) {
        return;
      }

      if (
        usedIds.has(
          normalized.id
        )
      ) {
        normalized.id = createId();
      }

      usedEmails.add(
        normalized.email
      );

      usedIds.add(
        normalized.id
      );

      result.push(normalized);
    });

    return result;
  }

  function ensureAdminExists(accounts) {
    const hasAdmin =
      accounts.some(
        function (account) {
          return (
            account.role === 'ADMIN'
          );
        }
      );

    if (hasAdmin) {
      return accounts;
    }

    const defaultAdminIndex =
      accounts.findIndex(
        function (account) {
          return (
            account.email ===
            DEFAULT_ADMIN.email
          );
        }
      );

    if (defaultAdminIndex !== -1) {
      accounts[
        defaultAdminIndex
      ].role = 'ADMIN';

      accounts[
        defaultAdminIndex
      ].status = 'ACTIVE';

      return accounts;
    }

    accounts.unshift(
      normalizeAccount(
        DEFAULT_ADMIN
      )
    );

    return accounts;
  }

  function writeAccounts(accounts) {
    localStorage.setItem(
      STORAGE_KEYS.accounts,
      JSON.stringify(accounts)
    );
  }

  function initializeAccounts() {
    let accounts = safeParse(
      localStorage.getItem(
        STORAGE_KEYS.accounts
      ),
      null
    );

    if (!Array.isArray(accounts)) {
      const oldAccount =
        safeParse(
          localStorage.getItem(
            STORAGE_KEYS.oldAccount
          ),
          null
        );

      accounts = oldAccount
        ? [oldAccount]
        : [DEFAULT_ADMIN];

      localStorage.removeItem(
        STORAGE_KEYS.oldAccount
      );
    }

    accounts =
      removeDuplicateAccounts(
        accounts
      );

    if (accounts.length === 0) {
      accounts.push(
        normalizeAccount(
          DEFAULT_ADMIN
        )
      );
    }

    accounts =
      ensureAdminExists(
        accounts
      );

    writeAccounts(accounts);

    /*
     * Xóa phiên đăng nhập cũ từng được
     * lưu bằng localStorage.
     *
     * Phiên đăng nhập mới được lưu
     * bằng sessionStorage.
     */
    localStorage.removeItem(
      STORAGE_KEYS.currentUser
    );

    return accounts;
  }

  function getAccounts() {
    return clone(
      initializeAccounts()
    );
  }

  function syncCurrentSession(
    accounts
  ) {
    const savedUser =
      safeParse(
        sessionStorage.getItem(
          STORAGE_KEYS.currentUser
        ),
        null
      );

    if (!savedUser) {
      return;
    }

    const matchedAccount =
      accounts.find(
        function (account) {
          return (
            String(account.id) ===
              String(savedUser.id) ||
            account.email ===
              normalizeEmail(
                savedUser.email
              )
          );
        }
      );

    if (
      !matchedAccount ||
      matchedAccount.status ===
        'LOCKED'
    ) {
      sessionStorage.removeItem(
        STORAGE_KEYS.currentUser
      );

      return;
    }

    sessionStorage.setItem(
      STORAGE_KEYS.currentUser,
      JSON.stringify(
        toPublicAccount(
          matchedAccount
        )
      )
    );
  }

  function saveAccounts(accounts) {
    if (!Array.isArray(accounts)) {
      return {
        ok: false,
        message:
          'Dữ liệu tài khoản không hợp lệ.'
      };
    }

    let normalizedAccounts =
      removeDuplicateAccounts(
        accounts
      );

    if (
      normalizedAccounts.length === 0
    ) {
      normalizedAccounts = [
        normalizeAccount(
          DEFAULT_ADMIN
        )
      ];
    }

    normalizedAccounts =
      ensureAdminExists(
        normalizedAccounts
      );

    writeAccounts(
      normalizedAccounts
    );

    syncCurrentSession(
      normalizedAccounts
    );

    return {
      ok: true,
      accounts:
        clone(
          normalizedAccounts
        )
    };
  }

  function getAccountById(accountId) {
    const accounts =
      getAccounts();

    const account =
      accounts.find(
        function (item) {
          return (
            String(item.id) ===
            String(accountId)
          );
        }
      );

    return account || null;
  }

  function getAccountByEmail(email) {
    const normalizedEmail =
      normalizeEmail(email);

    const accounts =
      getAccounts();

    const account =
      accounts.find(
        function (item) {
          return (
            item.email ===
            normalizedEmail
          );
        }
      );

    return account || null;
  }

  function saveCurrentUser(user) {
    if (!user) {
      sessionStorage.removeItem(
        STORAGE_KEYS.currentUser
      );

      return null;
    }

    const publicUser =
      toPublicAccount(
        normalizeAccount(user)
      );

    sessionStorage.setItem(
      STORAGE_KEYS.currentUser,
      JSON.stringify(publicUser)
    );

    return clone(publicUser);
  }

  function getCurrentUser() {
    const savedUser =
      safeParse(
        sessionStorage.getItem(
          STORAGE_KEYS.currentUser
        ),
        null
      );

    if (!savedUser) {
      return null;
    }

    const accounts =
      getAccounts();

    const account =
      accounts.find(
        function (item) {
          return (
            String(item.id) ===
              String(savedUser.id) ||
            item.email ===
              normalizeEmail(
                savedUser.email
              )
          );
        }
      );

    if (!account) {
      logout();

      return null;
    }

    if (
      account.status === 'LOCKED'
    ) {
      logout();

      return null;
    }

    return saveCurrentUser(
      account
    );
  }

  function login(
    email,
    password,
    options
  ) {
    const settings =
      options || {};

    const normalizedEmail =
      normalizeEmail(email);

    const accounts =
      getAccounts();

    const account =
      accounts.find(
        function (item) {
          return (
            item.email ===
              normalizedEmail &&
            item.password ===
              String(password || '')
          );
        }
      );

    if (!account) {
      return {
        ok: false,
        code:
          'INVALID_CREDENTIALS',
        message:
          'Tên đăng nhập hoặc mật khẩu bị sai. Vui lòng nhập lại.'
      };
    }

    if (
      account.status === 'LOCKED'
    ) {
      return {
        ok: false,
        code: 'ACCOUNT_LOCKED',
        message:
          'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'
      };
    }

    if (settings.remember) {
      localStorage.setItem(
        STORAGE_KEYS.rememberedEmail,
        account.email
      );
    } else {
      localStorage.removeItem(
        STORAGE_KEYS.rememberedEmail
      );
    }

    const currentUser =
      saveCurrentUser(account);

    return {
      ok: true,
      user: currentUser
    };
  }

  function logout() {
    sessionStorage.removeItem(
      STORAGE_KEYS.currentUser
    );
  }

  function register(payload) {
    const data = payload || {};

    const name =
      String(data.name || '')
        .trim();

    const email =
      normalizeEmail(
        data.email
      );

    const password =
      String(
        data.password || ''
      );

    if (name.length < 2) {
      return {
        ok: false,
        message:
          'Họ và tên phải có ít nhất 2 ký tự.'
      };
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return {
        ok: false,
        message:
          'Địa chỉ email không hợp lệ.'
      };
    }

    if (password.length < 8) {
      return {
        ok: false,
        message:
          'Mật khẩu phải có ít nhất 8 ký tự.'
      };
    }

    const accounts =
      getAccounts();

    const emailExists =
      accounts.some(
        function (account) {
          return (
            account.email === email
          );
        }
      );

    if (emailExists) {
      return {
        ok: false,
        message:
          'Email này đã được sử dụng.'
      };
    }

    const newAccount =
      normalizeAccount({
        id: createId(),
        name: name,
        email: email,
        password: password,
        role: 'USER',
        status: 'ACTIVE',
        provider: 'LOCAL',
        avatar: '',
        createdAt:
          new Date().toISOString(),
        updatedAt:
          new Date().toISOString()
      });

    accounts.push(
      newAccount
    );

    saveAccounts(accounts);

    return {
      ok: true,
      account:
        toPublicAccount(
          newAccount
        )
    };
  }

  function updateProfile(
    accountId,
    changes
  ) {
    const data = changes || {};

    const name =
      String(data.name || '')
        .trim();

    const avatar =
      String(data.avatar || '')
        .trim();

    if (name.length < 2) {
      return {
        ok: false,
        message:
          'Họ và tên phải có ít nhất 2 ký tự.'
      };
    }

    const accounts =
      getAccounts();

    const accountIndex =
      accounts.findIndex(
        function (account) {
          return (
            String(account.id) ===
            String(accountId)
          );
        }
      );

    if (accountIndex === -1) {
      return {
        ok: false,
        message:
          'Không tìm thấy tài khoản.'
      };
    }

    accounts[
      accountIndex
    ].name = name;

    accounts[
      accountIndex
    ].avatar = avatar;

    accounts[
      accountIndex
    ].updatedAt =
      new Date().toISOString();

    saveAccounts(accounts);

    return {
      ok: true,
      account:
        toPublicAccount(
          accounts[
            accountIndex
          ]
        )
    };
  }

  function changePassword(
    accountId,
    currentPassword,
    newPassword
  ) {
    const accounts =
      getAccounts();

    const accountIndex =
      accounts.findIndex(
        function (account) {
          return (
            String(account.id) ===
            String(accountId)
          );
        }
      );

    if (accountIndex === -1) {
      return {
        ok: false,
        message:
          'Không tìm thấy tài khoản.'
      };
    }

    const account =
      accounts[accountIndex];

    if (
      account.provider === 'GOOGLE'
    ) {
      return {
        ok: false,
        message:
          'Tài khoản Google không sử dụng mật khẩu của website.'
      };
    }

    if (
      account.password !==
      String(
        currentPassword || ''
      )
    ) {
      return {
        ok: false,
        message:
          'Mật khẩu hiện tại không chính xác.'
      };
    }

    if (
      String(newPassword || '')
        .length < 8
    ) {
      return {
        ok: false,
        message:
          'Mật khẩu mới phải có ít nhất 8 ký tự.'
      };
    }

    if (
      String(newPassword) ===
      account.password
    ) {
      return {
        ok: false,
        message:
          'Mật khẩu mới phải khác mật khẩu hiện tại.'
      };
    }

    account.password =
      String(newPassword);

    account.updatedAt =
      new Date().toISOString();

    saveAccounts(accounts);

    return {
      ok: true,
      message:
        'Đổi mật khẩu thành công.'
    };
  }

  function countAdmins() {
    return getAccounts()
      .filter(
        function (account) {
          return (
            account.role === 'ADMIN'
          );
        }
      )
      .length;
  }

  function setRole(
    accountId,
    newRole
  ) {
    const accounts =
      getAccounts();

    const account =
      accounts.find(
        function (item) {
          return (
            String(item.id) ===
            String(accountId)
          );
        }
      );

    if (!account) {
      return {
        ok: false,
        message:
          'Không tìm thấy tài khoản.'
      };
    }

    const currentUser =
      getCurrentUser();

    if (
      currentUser &&
      String(currentUser.id) ===
        String(account.id)
    ) {
      return {
        ok: false,
        message:
          'Bạn không thể tự thay đổi quyền của chính mình.'
      };
    }

    const normalizedRole =
      normalizeRole(newRole);

    if (
      account.role === 'ADMIN' &&
      normalizedRole === 'USER' &&
      countAdmins() <= 1
    ) {
      return {
        ok: false,
        message:
          'Hệ thống phải có ít nhất một quản trị viên.'
      };
    }

    account.role =
      normalizedRole;

    account.updatedAt =
      new Date().toISOString();

    saveAccounts(accounts);

    return {
      ok: true,
      account:
        toPublicAccount(account)
    };
  }

  function setStatus(
    accountId,
    newStatus
  ) {
    const accounts =
      getAccounts();

    const account =
      accounts.find(
        function (item) {
          return (
            String(item.id) ===
            String(accountId)
          );
        }
      );

    if (!account) {
      return {
        ok: false,
        message:
          'Không tìm thấy tài khoản.'
      };
    }

    const currentUser =
      getCurrentUser();

    if (
      currentUser &&
      String(currentUser.id) ===
        String(account.id)
    ) {
      return {
        ok: false,
        message:
          'Bạn không thể tự khóa tài khoản đang đăng nhập.'
      };
    }

    account.status =
      normalizeStatus(
        newStatus
      );

    account.updatedAt =
      new Date().toISOString();

    saveAccounts(accounts);

    return {
      ok: true,
      account:
        toPublicAccount(account)
    };
  }

  function deleteAccount(
    accountId
  ) {
    const accounts =
      getAccounts();

    const account =
      accounts.find(
        function (item) {
          return (
            String(item.id) ===
            String(accountId)
          );
        }
      );

    if (!account) {
      return {
        ok: false,
        message:
          'Không tìm thấy tài khoản.'
      };
    }

    const currentUser =
      getCurrentUser();

    if (
      currentUser &&
      String(currentUser.id) ===
        String(account.id)
    ) {
      return {
        ok: false,
        message:
          'Bạn không thể xóa tài khoản đang đăng nhập.'
      };
    }

    if (
      account.role === 'ADMIN' &&
      countAdmins() <= 1
    ) {
      return {
        ok: false,
        message:
          'Không thể xóa quản trị viên cuối cùng.'
      };
    }

    const updatedAccounts =
      accounts.filter(
        function (item) {
          return (
            String(item.id) !==
            String(accountId)
          );
        }
      );

    saveAccounts(
      updatedAccounts
    );

    return {
      ok: true
    };
  }

  function isAdmin(user) {
    const targetUser =
      user || getCurrentUser();

    return Boolean(
      targetUser &&
      normalizeRole(
        targetUser.role
      ) === 'ADMIN'
    );
  }

  function getRememberedEmail() {
    return (
      localStorage.getItem(
        STORAGE_KEYS.rememberedEmail
      ) || ''
    );
  }

  function clearRememberedEmail() {
    localStorage.removeItem(
      STORAGE_KEYS.rememberedEmail
    );
  }

  function initialize() {
    initializeAccounts();

    return true;
  }

  window.AuthStore = {
    keys: clone(STORAGE_KEYS),

    initialize: initialize,

    getAccounts: getAccounts,
    saveAccounts: saveAccounts,

    getAccountById:
      getAccountById,

    getAccountByEmail:
      getAccountByEmail,

    getCurrentUser:
      getCurrentUser,

    saveCurrentUser:
      saveCurrentUser,

    login: login,
    logout: logout,
    register: register,

    updateProfile:
      updateProfile,

    changePassword:
      changePassword,

    setRole: setRole,
    setStatus: setStatus,
    deleteAccount:
      deleteAccount,

    countAdmins:
      countAdmins,

    isAdmin: isAdmin,

    getRememberedEmail:
      getRememberedEmail,

    clearRememberedEmail:
      clearRememberedEmail
  };

  window.AuthStore.initialize();
})(window);