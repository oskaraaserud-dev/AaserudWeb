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

// Kontaktskjema
// Vi sender skjemaet i bakgrunnen (fetch) i stedet for å la nettleseren
// navigere bort til Formspree. Da kan vi vise en tydelig feilmelding hvis
// tjenesten er nede, i stedet for at brukeren blir sittende og vente.
const form = document.getElementById('contact-form');
const formNote = document.getElementById('form-note');
const nextField = document.getElementById('next-field');

// Absolutt URL, så den peker riktig både lokalt og i produksjon.
const TAKK_URL = new URL('takk.html', window.location.href).href;

if (nextField) {
  // Kun reserve: hvis JavaScript ikke kjører, poster nettleseren skjemaet
  // direkte, og Formspree sender brukeren hit etterpå.
  nextField.value = TAKK_URL;
}

if (form) {
  const submitBtn = form.querySelector('button[type="submit"]');

  // Meldingen brukeren får hvis noe går galt. Vi gir alltid en vei videre.
  function showError() {
    formNote.classList.add('error');
    formNote.innerHTML =
      'Beklager, meldingen kunne ikke sendes akkurat nå. Prøv igjen, eller send ' +
      'en e-post direkte til <a href="mailto:oskar@aaserudweb.no">oskar@aaserudweb.no</a>.';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    formNote.classList.remove('error');
    formNote.textContent = 'Sender melding...';
    if (submitBtn) submitBtn.disabled = true;

    // Gi opp etter 15 sekunder, så skjemaet aldri kan henge i det uendelige.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });

      if (response.ok) {
        window.location.href = TAKK_URL;
        return;
      }
      showError();
    } catch (err) {
      // Nettverksfeil, timeout, eller tjenesten er nede.
      showError();
    } finally {
      clearTimeout(timeout);
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
