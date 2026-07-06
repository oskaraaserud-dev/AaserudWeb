// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Header background on scroll
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
});

// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Active nav link on scroll
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.main-nav a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { rootMargin: '-45% 0px -45% 0px' });

sections.forEach(section => sectionObserver.observe(section));

// Reveal on scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Contact form feedback
const form = document.getElementById('contact-form');
const formNote = document.getElementById('form-note');
const nextField = document.getElementById('next-field');

if (nextField) {
  // Resolve to an absolute URL so FormSubmit redirects back to *this* site
  // (works both locally via file:// and once the site is hosted on a domain).
  nextField.value = new URL('takk.html', window.location.href).href;
}

if (form) {
  form.addEventListener('submit', () => {
    formNote.textContent = 'Sender melding...';
  });
}
