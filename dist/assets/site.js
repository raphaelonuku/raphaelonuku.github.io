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
  const chemistryScenes = {
    research: `<svg class="header-scene scene-research" viewBox="0 0 560 340" focusable="false">
      <text class="scene-heading" x="34" y="42">ALANINE SCAN</text>
      <text class="scene-note" x="34" y="68">ONE POSITION · ONE SUBSTITUTION · ONE QUESTION</text>
      <path class="scene-bond" d="M55 166 L145 126 L235 166 L325 126 L415 166 L505 126"/>
      <g class="scan-site" style="--delay:0s" transform="translate(55 166)"><circle r="29"/><text class="scan-native">Val</text><text class="scan-ala">Ala</text></g>
      <g class="scan-site" style="--delay:1.2s" transform="translate(145 126)"><circle r="29"/><text class="scan-native">Phe</text><text class="scan-ala">Ala</text></g>
      <g class="scan-site" style="--delay:2.4s" transform="translate(235 166)"><circle r="29"/><text class="scan-native">Leu</text><text class="scan-ala">Ala</text></g>
      <g class="scan-site" style="--delay:3.6s" transform="translate(325 126)"><circle r="29"/><text class="scan-native">Ser</text><text class="scan-ala">Ala</text></g>
      <g class="scan-site" style="--delay:4.8s" transform="translate(415 166)"><circle r="29"/><text class="scan-native">Tyr</text><text class="scan-ala">Ala</text></g>
      <g class="scan-site" style="--delay:6s" transform="translate(505 126)"><circle r="29"/><text class="scan-native">Gly</text><text class="scan-ala">Ala</text></g>
      <path class="reaction-arrow" d="M70 260 H475 M475 260 l-16 -10 M475 260 l-16 10"/>
      <text class="reaction-text" x="272" y="238">Fmoc–NH–PEPTIDE + BASE</text>
      <text class="reaction-text product-text" x="272" y="296">H₂N–PEPTIDE + DBF ADDUCT</text>
      <circle class="scan-probe" r="6"/>
    </svg>`,
    publications: `<svg class="header-scene scene-publications" viewBox="0 0 560 340" focusable="false">
      <text class="scene-heading" x="30" y="42">EVIDENCE PIPELINE</text>
      <path class="publication-molecule scene-bond" d="M58 190 L105 110 L198 110 L245 190 L198 270 L105 270 Z M245 190 H302"/>
      <circle class="publication-atom" cx="58" cy="190" r="8"/><circle class="publication-atom" cx="198" cy="110" r="8"/><circle class="publication-atom" cx="198" cy="270" r="8"/>
      <path class="data-trace" d="M292 214 L315 214 L326 170 L338 238 L353 194 L369 214 L390 214"/>
      <rect class="paper-sheet" x="390" y="72" width="138" height="208" rx="4"/>
      <path class="paper-line" d="M414 112 H503 M414 140 H486 M414 168 H503 M414 224 H486"/>
      <path class="paper-figure" d="M414 198 L432 180 L450 191 L471 156 L500 178"/>
      <circle class="evidence-pulse" r="6"/>
      <text class="scene-note" x="390" y="310">STRUCTURE → DATA → RECORD</text>
    </svg>`,
    writing: `<svg class="header-scene scene-writing" viewBox="0 0 560 340" focusable="false">
      <text class="scene-heading" x="32" y="42">MOLECULAR NOTEBOOK</text>
      <path class="notebook" d="M305 62 H510 V288 H305 Z M330 100 H478 M330 134 H462 M330 168 H482 M330 246 H462"/>
      <path class="writing-structure" d="M52 184 L105 92 L211 92 L264 184 L211 276 L105 276 Z M264 184 H326 M105 92 L80 52 M211 276 L238 316"/>
      <path class="ink-stroke" d="M52 184 L105 92 L211 92 L264 184 L211 276 L105 276 Z M264 184 H326 M330 100 H478 M330 134 H462 M330 168 H482"/>
      <circle class="ink-tip" r="5"/>
      <text class="scene-note" x="305" y="318">OBSERVE · INTERPRET · SHARE</text>
    </svg>`,
    about: `<svg class="header-scene scene-about" viewBox="0 0 560 340" focusable="false">
      <text class="scene-heading" x="34" y="42">SCIENTIFIC JOURNEY</text>
      <path class="about-route" d="M62 236 Q158 74 276 176 T505 102"/>
      <g class="about-stop stop-one" transform="translate(62 236)"><circle r="23"/><text x="0" y="45">NIGERIA</text></g>
      <g class="about-stop stop-two" transform="translate(276 176)"><circle r="23"/><text x="0" y="45">TAIWAN</text></g>
      <g class="about-stop stop-three" transform="translate(505 102)"><circle r="23"/><text x="0" y="45">UNITED STATES</text></g>
      <circle class="journey-marker" r="7"/>
      <path class="about-backbone" d="M100 300 l32 -18 32 18 32 -18 32 18 32 -18 32 18"/>
      <text class="scene-note" x="100" y="327">PHARMACY → MEDICINAL CHEMISTRY → PEPTIDE SCIENCE</text>
    </svg>`,
    impact: `<svg class="header-scene scene-impact" viewBox="0 0 560 340" focusable="false">
      <text class="scene-heading" x="32" y="42">KNOWLEDGE PROPAGATION</text>
      <path class="impact-link" d="M280 170 L120 92 M280 170 L440 92 M280 170 L92 250 M280 170 L468 250"/>
      <g class="impact-node impact-core" transform="translate(280 170)"><circle r="49"/><text>ACCESS</text></g>
      <g class="impact-node" style="--delay:0s" transform="translate(120 92)"><circle r="29"/><text>MENTOR</text></g>
      <g class="impact-node" style="--delay:1.2s" transform="translate(440 92)"><circle r="29"/><text>LEARN</text></g>
      <g class="impact-node" style="--delay:2.4s" transform="translate(92 250)"><circle r="29"/><text>APPLY</text></g>
      <g class="impact-node" style="--delay:3.6s" transform="translate(468 250)"><circle r="29"/><text>GROW</text></g>
      <circle class="impact-signal signal-a" r="6"/><circle class="impact-signal signal-b" r="6"/>
    </svg>`,
    media: `<svg class="header-scene scene-media" viewBox="0 0 560 340" focusable="false">
      <text class="scene-heading" x="32" y="42">SCIENCE IN PUBLIC</text>
      <path class="media-molecule scene-bond" d="M60 170 L108 87 L204 87 L252 170 L204 253 L108 253 Z"/>
      <circle class="media-source-dot" cx="156" cy="170" r="14"/>
      <path class="media-wave" d="M270 170 C286 110 302 230 318 170 S350 110 366 170 S398 230 414 170 S446 110 462 170"/>
      <rect class="media-frame" x="438" y="86" width="92" height="168" rx="8"/>
      <path class="media-play" d="M474 143 L474 197 L510 170 Z"/>
      <circle class="media-photon" r="6"/>
      <text class="scene-note" x="270" y="302">MOLECULE → SIGNAL → STORY</text>
    </svg>`,
    contact: `<svg class="header-scene scene-contact" viewBox="0 0 560 340" focusable="false">
      <text class="scene-heading" x="32" y="42">MOLECULAR RECOGNITION</text>
      <path class="receptor-pocket" d="M328 65 C425 72 498 128 505 218 C468 194 432 194 399 224 C370 251 332 274 286 262 C326 224 340 193 323 158 C307 124 302 93 328 65 Z"/>
      <g class="contact-ligand"><path d="M74 168 L118 92 L206 92 L250 168 L206 244 L118 244 Z M250 168 H296"/><circle cx="74" cy="168" r="8"/><circle cx="206" cy="92" r="8"/></g>
      <path class="recognition-guide" d="M270 168 H390"/>
      <circle class="recognition-flash" cx="394" cy="168" r="10"/>
      <text class="scene-note" x="32" y="304">QUESTION + FIT → COLLABORATION</text>
    </svg>`
  };
  pageHero.dataset.chemistry = section;
  const chemistry = document.createElement('div');
  chemistry.className = 'header-chemistry';
  chemistry.setAttribute('aria-hidden', 'true');
  chemistry.innerHTML = chemistryScenes[section] || chemistryScenes.research;
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
