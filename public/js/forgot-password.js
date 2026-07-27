const emailForm = document.getElementById('emailForm');
const resetForm = document.getElementById('resetForm');

const emailInput = document.getElementById('email');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

const emailMessage = document.getElementById('emailMessage');
const resetMessage = document.getElementById('resetMessage');

const defaultAccount = {
  email: 'admin@gmail.com',
  password: '123456'
};

function getAccount() {
  const savedAccount = localStorage.getItem('travelTtsAccount');

  if (savedAccount) {
    return JSON.parse(savedAccount);
  }

  localStorage.setItem('travelTtsAccount', JSON.stringify(defaultAccount));
  return defaultAccount;
}

function setMessage(element, message, type = 'error') {
  element.textContent = message;

  if (type === 'success') {
    element.classList.add('success');
  } else {
    element.classList.remove('success');
  }
}

function togglePassword(buttonId, inputId) {
  const button = document.getElementById(buttonId);
  const input = document.getElementById(inputId);

  if (!button || !input) return;

  button.addEventListener('click', function () {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
  });
}

togglePassword('toggleNewPassword', 'newPassword');
togglePassword('toggleConfirmPassword', 'confirmPassword');

let verifiedEmail = '';

emailForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const account = getAccount();
  const email = emailInput.value.trim().toLowerCase();

  if (!email) {
    setMessage(emailMessage, 'Vui lòng nhập email.');
    return;
  }

  if (email !== account.email.toLowerCase()) {
    setMessage(emailMessage, 'Email này chưa tồn tại trong hệ thống.');
    return;
  }

  verifiedEmail = email;

  setMessage(emailMessage, 'Email hợp lệ. Bạn có thể đặt lại mật khẩu.', 'success');

  emailForm.classList.add('hidden');
  resetForm.classList.remove('hidden');
});

resetForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (newPassword.length < 6) {
    setMessage(resetMessage, 'Mật khẩu mới phải có ít nhất 6 ký tự.');
    return;
  }

  if (newPassword !== confirmPassword) {
    setMessage(resetMessage, 'Mật khẩu xác nhận không khớp.');
    return;
  }

  const newAccount = {
    email: verifiedEmail,
    password: newPassword
  };

  localStorage.setItem('travelTtsAccount', JSON.stringify(newAccount));

  setMessage(resetMessage, 'Đổi mật khẩu thành công. Đang quay lại trang đăng nhập...', 'success');

  setTimeout(function () {
    window.location.href = '/login.html';
  }, 1500);
});