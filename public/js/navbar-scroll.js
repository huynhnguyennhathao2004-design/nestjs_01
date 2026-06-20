const navbar = document.querySelector('.navbar');

let lastScrollY = window.scrollY;

window.addEventListener('scroll', function () {
  if (!navbar) return;

  const currentScrollY = window.scrollY;

  if (currentScrollY > 40) {
    navbar.classList.add('nav-scrolled');
  } else {
    navbar.classList.remove('nav-scrolled');
  }

  if (currentScrollY > lastScrollY && currentScrollY > 120) {
    navbar.classList.add('nav-hidden');
  } else {
    navbar.classList.remove('nav-hidden');
  }

  lastScrollY = currentScrollY;
});