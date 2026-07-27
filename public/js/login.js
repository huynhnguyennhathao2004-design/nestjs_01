const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('loginMessage');

const togglePassword = document.getElementById('togglePassword');

const defaultAccount = {
  email: 'admin@gmail.com',
  password: '123456',
  name: 'Admin'
};

function getAccount() {
  const savedAccount = localStorage.getItem('travelTtsAccount');

  if (savedAccount) {
    return JSON.parse(savedAccount);
  }

  localStorage.setItem('travelTtsAccount', JSON.stringify(defaultAccount));
  return defaultAccount;
}

function getNameFromEmail(email) {
  return email.split('@')[0];
}

if (togglePassword && passwordInput) {
  togglePassword.addEventListener('click', function () {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const account = getAccount();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (email === account.email.toLowerCase() && password === account.password) {
      const user = {
        email: account.email,
        name: account.name || getNameFromEmail(account.email)
      };

      localStorage.setItem('user', JSON.stringify(user));

      window.location.href = '/index.html';
    } else {
      loginMessage.textContent = 'Tên đăng nhập hoặc mật khẩu bị sai. Vui lòng nhập lại';
      loginMessage.classList.add('error');
    }
  });
}
