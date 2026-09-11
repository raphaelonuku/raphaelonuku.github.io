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

const pageHero = document.querySelector('.page-hero:not(.article-hero)');
if (pageHero) {
  const section = location.pathname.split('/').filter(Boolean).at(-1) || 'home';
  pageHero.dataset.chemistry = section;
  const chemistry = document.createElement('div');
  chemistry.className = 'header-chemistry';
  chemistry.setAttribute('aria-hidden', 'true');
  chemistry.innerHTML = `<svg viewBox="0 0 500 370" focusable="false">
    <g class="chem-core">
      <path class="chem-ring" d="M42 192 L96 98 L204 98 L258 192 L204 286 L96 286 Z"/>
      <path class="chem-ring" d="M78 192 L114 130 L186 130 L222 192 L186 254 L114 254 Z"/>
      <path class="chem-bond" d="M258 192 L326 192 L384 226 L450 188"/>
      <path class="chem-carbonyl" d="M326 192 L362 130 M334 198 L370 136"/>
      <path class="chem-bond" d="M450 188 L482 206"/>
      <path class="chem-trace" d="M42 192 L96 98 L204 98 L258 192 L204 286 L96 286 Z M258 192 L326 192 L362 130 M326 192 L384 226 L450 188"/>
      <circle class="chem-atom" cx="366" cy="124" r="18"/><text class="chem-label" x="366" y="124">O</text>
      <circle class="chem-atom chem-atom-cyan" cx="390" cy="229" r="18"/><text class="chem-label" x="390" y="229">N</text>
      <circle class="chem-atom chem-atom-cyan" cx="456" cy="185" r="8"/>
      <circle class="chem-pulse" r="5"/><circle class="chem-pulse chem-pulse-two" r="3.5"/>
    </g>
  </svg>`;
  pageHero.prepend(chemistry);

  pageHero.addEventListener('pointermove', (event) => {
    const bounds = pageHero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * 18;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * 14;
    chemistry.style.setProperty('--chem-x', `${x}px`);
    chemistry.style.setProperty('--chem-y', `${y}px`);
  });
  pageHero.addEventListener('pointerleave', () => {
    chemistry.style.setProperty('--chem-x', '0px');
    chemistry.style.setProperty('--chem-y', '0px');
  });
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
