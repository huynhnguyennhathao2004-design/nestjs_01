const loginForm =
  document.getElementById(
    'loginForm'
  );

const emailInput =
  document.getElementById(
    'email'
  );

const passwordInput =
  document.getElementById(
    'password'
  );

const loginMessage =
  document.getElementById(
    'loginMessage'
  );

const togglePassword =
  document.getElementById(
    'togglePassword'
  );

const rememberMe =
  document.getElementById(
    'rememberMe'
  );


const DEFAULT_ADMIN = {
  id: 1,
  name: 'Admin',
  email: 'admin@gmail.com',
  password: '123456',
  role: 'ADMIN',
  status: 'ACTIVE',
  provider: 'LOCAL',
  avatar: '',
  createdAt:
    new Date().toISOString()
};


function saveAccounts(accounts) {
  localStorage.setItem(
    'travelTtsAccounts',
    JSON.stringify(accounts)
  );
}


function getAccounts() {
  const savedAccounts =
    localStorage.getItem(
      'travelTtsAccounts'
    );

  if (savedAccounts) {
    try {
      const accounts =
        JSON.parse(savedAccounts);

      if (Array.isArray(accounts)) {
        return accounts;
      }
    } catch (error) {
      localStorage.removeItem(
        'travelTtsAccounts'
      );
    }
  }

  const oldAccount =
    localStorage.getItem(
      'travelTtsAccount'
    );

  if (oldAccount) {
    try {
      const parsedOldAccount =
        JSON.parse(oldAccount);

      const migratedAccount = {
        id:
          parsedOldAccount.id || 1,

        name:
          parsedOldAccount.name ||
          'Admin',

        email:
          parsedOldAccount.email ||
          'admin@gmail.com',

        password:
          parsedOldAccount.password ||
          '123456',

        role:
          parsedOldAccount.role ||
          'ADMIN',

        status:
          parsedOldAccount.status ||
          'ACTIVE',

        provider:
          parsedOldAccount.provider ||
          'LOCAL',

        avatar:
          parsedOldAccount.avatar ||
          '',

        createdAt:
          parsedOldAccount.createdAt ||
          new Date().toISOString()
      };

      const accounts = [
        migratedAccount
      ];

      saveAccounts(accounts);

      localStorage.removeItem(
        'travelTtsAccount'
      );

      return accounts;
    } catch (error) {
      localStorage.removeItem(
        'travelTtsAccount'
      );
    }
  }

  const accounts = [
    DEFAULT_ADMIN
  ];

  saveAccounts(accounts);

  return accounts;
}


function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}


function showLoginError(message) {
  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    message;

  loginMessage.classList.add(
    'error'
  );
}


function clearLoginMessage() {
  if (!loginMessage) {
    return;
  }

  loginMessage.textContent = '';

  loginMessage.classList.remove(
    'error'
  );
}


function loadEmailFromUrl() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const registeredEmail =
    params.get('email');

  if (
    registeredEmail &&
    emailInput
  ) {
    emailInput.value =
      registeredEmail;

    passwordInput.focus();
  }
}


if (togglePassword && passwordInput) {
  togglePassword.addEventListener(
    'click',
    function () {
      passwordInput.type =
        passwordInput.type ===
        'password'
          ? 'text'
          : 'password';
    }
  );
}


if (loginForm) {
  loginForm.addEventListener(
    'submit',
    function (event) {
      event.preventDefault();

      clearLoginMessage();

      const email =
        normalizeEmail(
          emailInput.value
        );

      const password =
        passwordInput.value;

      const accounts =
        getAccounts();

      const account =
        accounts.find(
          function (item) {
            return (
              normalizeEmail(
                item.email
              ) === email &&
              item.password === password
            );
          }
        );

      if (!account) {
        showLoginError(
          'Tên đăng nhập hoặc mật khẩu bị sai. Vui lòng nhập lại.'
        );

        return;
      }

      if (
        account.status === 'LOCKED'
      ) {
        showLoginError(
          'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'
        );

        return;
      }

      const currentUser = {
        id: account.id,
        name: account.name,
        email: account.email,
        role:
          account.role || 'USER',
        status:
          account.status ||
          'ACTIVE',
        provider:
          account.provider ||
          'LOCAL',
        avatar:
          account.avatar || ''
      };

      sessionStorage.setItem(
        'user',
        JSON.stringify(currentUser)
      );

      if (
        rememberMe &&
        rememberMe.checked
      ) {
        localStorage.setItem(
          'rememberedEmail',
          account.email
        );
      } else {
        localStorage.removeItem(
          'rememberedEmail'
        );
      }

      window.location.href =
        '/index.html';
    }
  );
}


function loadRememberedEmail() {
  const rememberedEmail =
    localStorage.getItem(
      'rememberedEmail'
    );

  if (
    rememberedEmail &&
    emailInput &&
    !emailInput.value
  ) {
    emailInput.value =
      rememberedEmail;

    if (rememberMe) {
      rememberMe.checked = true;
    }
  }
}


loadEmailFromUrl();
loadRememberedEmail();