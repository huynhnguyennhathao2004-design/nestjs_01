const authBox = document.getElementById('authBox');

function getCurrentUser() {
  const user = localStorage.getItem('user');

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch (error) {
    localStorage.removeItem('user');
    return null;
  }
}

if (authBox) {
  const currentUser = getCurrentUser();

  if (currentUser) {
    authBox.innerHTML = `
      <div class="user-menu">
        <span class="user-name">Xin chào, ${currentUser.name}</span>
        <button type="button" class="logout-btn" id="logoutBtn">Đăng xuất</button>
      </div>
    `;

    const logoutBtn = document.getElementById('logoutBtn');

    logoutBtn.addEventListener('click', function () {
      localStorage.removeItem('user');
      window.location.href = '/index.html';
    });
  } else {
    authBox.innerHTML = `
      <a href="/login.html" class="login-btn">Đăng nhập</a>
    `;
  }
}