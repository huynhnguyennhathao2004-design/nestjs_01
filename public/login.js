document.addEventListener('DOMContentLoaded', function () {
  const loginFormElement = document.getElementById('loginForm');
  const messageElement = document.getElementById('message');

  if (!loginFormElement || !messageElement) {
    console.error('Không tìm thấy form đăng nhập hoặc thẻ message');
    return;
  }

  loginFormElement.addEventListener('submit', async function (event) {
    event.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const email = emailInput.value;
    const password = passwordInput.value;

    messageElement.textContent = 'Đang đăng nhập...';
    messageElement.className = 'message';

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        messageElement.textContent = data.message;
        messageElement.className = 'message success';

        localStorage.setItem('user', JSON.stringify(data.user));

        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 800);
      } else {
        messageElement.textContent = data.message || 'Đăng nhập thất bại';
        messageElement.className = 'message error';
      }
    } catch (error) {
      messageElement.textContent = 'Không thể kết nối đến server';
      messageElement.className = 'message error';
    }
  });
});