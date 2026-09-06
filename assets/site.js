const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
}

const revealItems = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

document.querySelectorAll('[data-writing-pagination]').forEach((pagination) => {
  const archive = pagination.closest('.writing-archive');
  const pages = [...archive.querySelectorAll('[data-writing-page]')];
  const pageButtons = [...pagination.querySelectorAll('[data-writing-page-button]')];
  const previous = pagination.querySelector('[data-writing-prev]');
  const next = pagination.querySelector('[data-writing-next]');
  const status = pagination.querySelector('[data-writing-status]');
  let current = 1;

  const showPage = (page) => {
    current = Math.min(Math.max(page, 1), pages.length);
    pages.forEach((group, index) => {
      group.hidden = index + 1 !== current;
    });
    pageButtons.forEach((button, index) => {
      if (index + 1 === current) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    previous.disabled = current === 1;
    next.disabled = current === pages.length;
    status.textContent = `Page ${current} of ${pages.length}`;
  };

  previous.addEventListener('click', () => showPage(current - 1));
  next.addEventListener('click', () => showPage(current + 1));
  pageButtons.forEach((button) => {
    button.addEventListener('click', () => showPage(Number(button.dataset.writingPageButton)));
  });
});

const orbitAnimation = document.querySelector('[data-orbit-animation]');
if (orbitAnimation) {
  if ('IntersectionObserver' in window) {
    const orbitObserver = new IntersectionObserver(([entry]) => {
      orbitAnimation.classList.toggle('is-visible', entry.isIntersecting);
    }, { threshold: 0.15 });
    orbitObserver.observe(orbitAnimation);
  } else {
    orbitAnimation.classList.add('is-visible');
  }
}
