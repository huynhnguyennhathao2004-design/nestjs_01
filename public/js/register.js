const registerForm =
  document.getElementById(
    'registerForm'
  );

const fullNameInput =
  document.getElementById(
    'fullName'
  );

const registerEmailInput =
  document.getElementById(
    'registerEmail'
  );

const registerPasswordInput =
  document.getElementById(
    'registerPassword'
  );

const confirmPasswordInput =
  document.getElementById(
    'confirmPassword'
  );

const acceptPolicyInput =
  document.getElementById(
    'acceptPolicy'
  );

const registerMessage =
  document.getElementById(
    'registerMessage'
  );

const toggleRegisterPassword =
  document.getElementById(
    'toggleRegisterPassword'
  );

const toggleConfirmPassword =
  document.getElementById(
    'toggleConfirmPassword'
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


function getAccounts() {
  const savedAccounts =
    localStorage.getItem(
      'travelTtsAccounts'
    );

  if (savedAccounts) {
    try {
      const accounts =
        JSON.parse(savedAccounts);

      return Array.isArray(accounts)
        ? accounts
        : [];
    } catch (error) {
      localStorage.removeItem(
        'travelTtsAccounts'
      );
    }
  }

  const accounts = [
    DEFAULT_ADMIN
  ];

  saveAccounts(accounts);

  return accounts;
}


function saveAccounts(accounts) {
  localStorage.setItem(
    'travelTtsAccounts',
    JSON.stringify(accounts)
  );
}


function createAccountId() {
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


function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}


function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}


function showRegisterMessage(
  message,
  type
) {
  if (!registerMessage) {
    return;
  }

  registerMessage.textContent =
    message;

  registerMessage.className =
    `register-message ${type}`;
}


function clearRegisterMessage() {
  if (!registerMessage) {
    return;
  }

  registerMessage.textContent = '';

  registerMessage.className =
    'register-message';
}


function setupPasswordToggle(
  button,
  input
) {
  if (!button || !input) {
    return;
  }

  button.addEventListener(
    'click',
    function () {
      input.type =
        input.type === 'password'
          ? 'text'
          : 'password';
    }
  );
}


setupPasswordToggle(
  toggleRegisterPassword,
  registerPasswordInput
);

setupPasswordToggle(
  toggleConfirmPassword,
  confirmPasswordInput
);


if (registerForm) {
  registerForm.addEventListener(
    'submit',
    function (event) {
      event.preventDefault();

      clearRegisterMessage();

      const name =
        fullNameInput.value.trim();

      const email =
        normalizeEmail(
          registerEmailInput.value
        );

      const password =
        registerPasswordInput.value;

      const confirmPassword =
        confirmPasswordInput.value;

      if (name.length < 2) {
        showRegisterMessage(
          'Họ và tên phải có ít nhất 2 ký tự.',
          'error'
        );

        fullNameInput.focus();

        return;
      }

      if (!isValidEmail(email)) {
        showRegisterMessage(
          'Địa chỉ email không hợp lệ.',
          'error'
        );

        registerEmailInput.focus();

        return;
      }

      if (password.length < 8) {
        showRegisterMessage(
          'Mật khẩu phải có ít nhất 8 ký tự.',
          'error'
        );

        registerPasswordInput.focus();

        return;
      }

      if (password !== confirmPassword) {
        showRegisterMessage(
          'Mật khẩu nhập lại không khớp.',
          'error'
        );

        confirmPasswordInput.focus();

        return;
      }

      if (!acceptPolicyInput.checked) {
        showRegisterMessage(
          'Bạn cần đồng ý với điều khoản sử dụng.',
          'error'
        );

        return;
      }

      const accounts =
        getAccounts();

      const emailExists =
        accounts.some(
          function (account) {
            return (
              normalizeEmail(
                account.email
              ) === email
            );
          }
        );

      if (emailExists) {
        showRegisterMessage(
          'Email này đã được sử dụng.',
          'error'
        );

        registerEmailInput.focus();

        return;
      }

      const newAccount = {
        id: createAccountId(),
        name: name,
        email: email,
        password: password,
        role: 'USER',
        status: 'ACTIVE',
        provider: 'LOCAL',
        avatar: '',
        createdAt:
          new Date().toISOString()
      };

      accounts.push(newAccount);

      saveAccounts(accounts);

      showRegisterMessage(
        'Tạo tài khoản thành công. Đang chuyển tới trang đăng nhập...',
        'success'
      );

      registerForm.reset();

      window.setTimeout(
        function () {
          window.location.href =
            `/login.html?email=${encodeURIComponent(
              email
            )}`;
        },
        1200
      );
    }
  );
}