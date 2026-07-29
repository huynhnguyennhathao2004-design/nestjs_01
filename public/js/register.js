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

  


function showRegisterMessage(
  message,
  type
) {


  registerMessage.textContent =
    message;

  registerMessage.className =
    `register-message ${type}`;
}


function clearRegisterMessage() {


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
        registerEmailInput.value
          .trim()
          .toLowerCase();

      const password =
        registerPasswordInput.value;

      const confirmPassword =
        confirmPasswordInput.value;

      if (
        password !==
        confirmPassword
      ) {
        showRegisterMessage(
          'Mật khẩu nhập lại không khớp.',
          'error'
        );

        confirmPasswordInput.focus();

        return;
      }

      if (
        !acceptPolicyInput.checked
      ) {
        showRegisterMessage(
          'Bạn cần đồng ý với điều khoản sử dụng.',
          'error'
        );

        return;
      }

      const result =
        AuthStore.register({
          name: name,
          email: email,
          password: password
        });

      if (!result.ok) {
        showRegisterMessage(
          result.message,
          'error'
        );



        return;
      }



      showRegisterMessage(
        'Tạo tài khoản thành công. Đang chuyển đến trang đăng nhập...',
        'success'
      );

      registerForm.reset();

      window.setTimeout(
        function () {
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
              AuthGuard.sanitizeRedirect(
                redirect,
                '/index.html'
              );

            loginUrl +=
              `&redirect=${encodeURIComponent(
                safeRedirect
              )}`;
          }

          window.location.replace(
            loginUrl
          );
        },
        1000
      );
    }
  );
}