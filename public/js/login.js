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


if (
  togglePassword &&
  passwordInput
) {
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

      const result =
        AuthStore.login(
          emailInput.value,
          passwordInput.value,
          {
            remember:
              Boolean(
                rememberMe &&
                rememberMe.checked
              )
          }
        );

      if (!result.ok) {
        showLoginError(
          result.message
        );

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

      function updateRegisterLink() {
        const registerLink =
          document.querySelector(
            '.register-link-box a'
          );

        if (!registerLink) {
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
          AuthGuard.sanitizeRedirect(
            redirect,
            '/index.html'
          );

        registerLink.href =
          `/register.html?redirect=${encodeURIComponent(
            safeRedirect
          )}`;
      }
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


loadEmail();
updateRegisterLink();
showLoginNotice();
