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

const submitButton =
  registerForm
    ? registerForm.querySelector(
        '.register-submit'
      )
    : null;

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

function setSubmitting(
  isSubmitting
) {
  if (!submitButton) {
    return;
  }

  submitButton.disabled =
    isSubmitting;

  submitButton.textContent =
    isSubmitting
      ? 'Đang tạo tài khoản...'
      : 'Tạo tài khoản';
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
      const showPassword =
        input.type === 'password';

      input.type =
        showPassword
          ? 'text'
          : 'password';

      button.setAttribute(
        'aria-label',
        showPassword
          ? 'Ẩn mật khẩu'
          : 'Hiện mật khẩu'
      );
    }
  );
}

function createLoginUrl(email) {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const redirect =
    params.get('redirect');

  let loginUrl =
    `/login.html?email=${encodeURIComponent(
      email
    )}`;

  if (redirect) {
    const safeRedirect =
      window.AuthGuard
        ? AuthGuard.sanitizeRedirect(
            redirect,
            '/index.html'
          )
        : '/index.html';

    loginUrl +=
      `&redirect=${encodeURIComponent(
        safeRedirect
      )}`;
  }

  return loginUrl;
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
    async function (event) {
      event.preventDefault();

      clearRegisterMessage();

      const fullName =
        fullNameInput.value
          .trim()
          .replace(/\s+/g, ' ');

      const email =
        registerEmailInput.value
          .trim()
          .toLowerCase();

      const password =
        registerPasswordInput.value;

      const confirmPassword =
        confirmPasswordInput.value;

      if (fullName.length < 2) {
        showRegisterMessage(
          'Họ và tên phải có ít nhất 2 ký tự.',
          'error'
        );

        fullNameInput.focus();
        return;
      }

      if (!email) {
        showRegisterMessage(
          'Vui lòng nhập địa chỉ email.',
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

      if (
        password !==
        confirmPassword
      ) {
        showRegisterMessage(
          'Mật khẩu nhập lại không khớp.',
          'error'
        );

        confirmPasswordInput.focus();
        confirmPasswordInput.select();

        return;
      }

      if (
        !acceptPolicyInput.checked
      ) {
        showRegisterMessage(
          'Bạn cần đồng ý với điều khoản sử dụng.',
          'error'
        );

        acceptPolicyInput.focus();
        return;
      }

      if (
        !window.AuthStore ||
        typeof AuthStore.register !==
          'function'
      ) {
        showRegisterMessage(
          'Thành phần đăng ký chưa được tải.',
          'error'
        );

        return;
      }

      setSubmitting(true);

      const result =
        await AuthStore.register({
          fullName,
          email,
          password
        });

      if (!result.ok) {
        setSubmitting(false);

        showRegisterMessage(
          result.message,
          'error'
        );

        if (
          result.code ===
          'EMAIL_EXISTS'
        ) {
          registerEmailInput.focus();
          registerEmailInput.select();
        }

        return;
      }

      showRegisterMessage(
        result.message ||
        'Tạo tài khoản thành công. Đang chuyển đến trang đăng nhập...',
        'success'
      );

      registerForm.reset();

      window.setTimeout(
        function () {
          window.location.replace(
            createLoginUrl(email)
          );
        },
        1000
      );
    }
  );
}