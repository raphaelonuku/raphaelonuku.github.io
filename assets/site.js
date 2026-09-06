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

document.querySelectorAll('[data-pathway]').forEach((pathway) => {
  const steps = [...pathway.querySelectorAll('[data-pathway-step]')];
  const detail = pathway.querySelector('[data-pathway-detail]:not([data-pathway-step])');
  const activate = (selected) => {
    steps.forEach((step) => {
      const active = step === selected;
      step.classList.toggle('is-active', active);
      step.setAttribute('aria-pressed', String(active));
    });
    if (detail) detail.textContent = selected.dataset.pathwayDetail;
  };
  steps.forEach((step) => {
    step.addEventListener('click', () => activate(step));
    step.addEventListener('focus', () => activate(step));
  });
});

document.querySelectorAll('[data-publication-filters]').forEach((filters) => {
  const section = filters.closest('.publication-explorer');
  const buttons = [...filters.querySelectorAll('[data-publication-filter]')];
  const publications = [...section.querySelectorAll('[data-topics]')];
  const count = section.querySelector('[data-publication-count]');
  const applyFilter = (selected) => {
    const topic = selected.dataset.publicationFilter;
    let visible = 0;
    publications.forEach((publication) => {
      const show = topic === 'all' || publication.dataset.topics.split(' ').includes(topic);
      publication.hidden = !show;
      if (show) visible += 1;
    });
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button === selected)));
    if (count) count.textContent = `${visible} publication${visible === 1 ? '' : 's'}`;
  };
  buttons.forEach((button) => button.addEventListener('click', () => applyFilter(button)));
});
