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

const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const preparedMessage = [
      `Subject ${String(data.get('subject') || 'Website inquiry')}`,
      '',
      String(data.get('message') || ''),
      '',
      `From ${String(data.get('name') || '')}`,
      `Reply to ${String(data.get('email') || '')}`
    ].join('\n');
    const status = contactForm.querySelector('[data-form-status]');
    navigator.clipboard.writeText(preparedMessage).then(() => {
      if (status) status.textContent = 'Message copied. Paste it into an email to ronuku[at]umich.edu.';
    }).catch(() => {
      if (status) status.textContent = 'Copy the completed fields and email them to ronuku[at]umich.edu.';
    });
  });
}
