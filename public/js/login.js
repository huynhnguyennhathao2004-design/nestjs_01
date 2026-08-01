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

const submitButton =
  loginForm
    ? loginForm.querySelector(
        '.login-submit'
      )
    : null;

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

function setSubmitting(isSubmitting) {
  if (!submitButton) {
    return;
  }

  submitButton.disabled =
    isSubmitting;

  submitButton.textContent =
    isSubmitting
      ? 'Đang đăng nhập...'
      : 'Đăng nhập';
}

function loadEmail() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const emailFromUrl =
    params.get('email');

  const rememberedEmail =
    AuthStore.getRememberedEmail();

  if (emailFromUrl) {
    emailInput.value =
      emailFromUrl;

    passwordInput.focus();
    return;
  }

  if (rememberedEmail) {
    emailInput.value =
      rememberedEmail;

    if (rememberMe) {
      rememberMe.checked = true;
    }
  }
}

function updateRegisterLink() {
  const registerLinks =
    document.querySelectorAll(
      'a[href^="/register.html"]'
    );

  if (
    !registerLinks ||
    registerLinks.length === 0
  ) {
    return;
  }

  const params =
    new URLSearchParams(
      window.location.search
    );

  const redirect =
    params.get('redirect');

  if (!redirect) {
    return;
  }

  const safeRedirect =
    window.AuthGuard
      ? AuthGuard.sanitizeRedirect(
          redirect,
          '/index.html'
        )
      : '/index.html';

  registerLinks.forEach(
    function (registerLink) {
      registerLink.href =
        `/register.html?redirect=${encodeURIComponent(
          safeRedirect
        )}`;
    }
  );
}

function showLoginNotice() {
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

if (
  togglePassword &&
  passwordInput
) {
  togglePassword.addEventListener(
    'click',
    function () {
      const showPassword =
        passwordInput.type ===
        'password';

      passwordInput.type =
        showPassword
          ? 'text'
          : 'password';

      togglePassword.setAttribute(
        'aria-label',
        showPassword
          ? 'Ẩn mật khẩu'
          : 'Hiện mật khẩu'
      );
    }
  );
}

if (loginForm) {
  loginForm.addEventListener(
    'submit',
    async function (event) {
      event.preventDefault();

      if (
        !window.AuthStore ||
        typeof AuthStore.login !==
          'function'
      ) {
        showLoginError(
          'Thành phần đăng nhập chưa được tải.'
        );

        return;
      }

      clearLoginMessage();
      setSubmitting(true);

      const result =
        await AuthStore.login(
          emailInput.value,
          passwordInput.value,
          {
            remember: Boolean(
              rememberMe &&
              rememberMe.checked
            )
          }
        );

      if (!result.ok) {
        setSubmitting(false);

        showLoginError(
          result.message
        );

        passwordInput.focus();
        passwordInput.select();

        return;
      }

      const redirectTarget =
        window.AuthGuard
          ? AuthGuard.getRedirectTarget(
              '/index.html'
            )
          : '/index.html';

      window.location.replace(
        redirectTarget
      );
    }
  );
}

loadEmail();
updateRegisterLink();
showLoginNotice();