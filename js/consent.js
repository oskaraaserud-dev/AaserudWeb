/* =============================================================================
   Samtykke + Google Analytics 4 (ekomloven § 3-15 / GDPR)
   -----------------------------------------------------------------------------
   Prinsipp: Vi laster IKKE Google Analytics-skriptet før brukeren aktivt har
   samtykket til statistikk. Ingen Analytics-cookie kan derfor settes på forhånd.

   Valget lagres i localStorage (ikke en cookie), slik at vi ikke engang setter
   en cookie før samtykke, og slik at banneret ikke dukker opp ved hvert besøk.

   Ingen eksterne bibliotek. Alt som skjer er synlig i denne filen.
   ============================================================================= */

(function () {
  'use strict';

  /* ---------------------------------------------------------------------------
     KONFIGURASJON
     --------------------------------------------------------------------------- */

  // 👉 LIM INN DIN EGEN GA4 MÅLE-ID HER (erstatt plassholderen under).
  //    Du finner den i Google Analytics under: Administrator → Datastrømmer →
  //    (din nettstrøm) → "Måle-ID". Den ser slik ut: G-XXXXXXXXXX
  var MEASUREMENT_ID = 'G-TQYLXKVLD2';

  // Nøkkel valget lagres under i localStorage.
  var STORAGE_KEY = 'aw_consent';

  // Øk dette tallet hvis du senere endrer hva samtykket dekker. Da blir alle
  // brukere spurt på nytt (gammelt lagret valg regnes som utløpt).
  var CONSENT_VERSION = 1;

  /* ---------------------------------------------------------------------------
     LAGRING: lese og skrive brukerens valg
     --------------------------------------------------------------------------- */

  // Leser lagret valg. Returnerer null hvis brukeren ikke har bestemt seg ennå,
  // eller hvis samtykkeversjonen er utdatert.
  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.version !== CONSENT_VERSION) return null;
      return data;
    } catch (e) {
      return null; // Hvis localStorage er blokkert e.l., spør på nytt.
    }
  }

  // Lagrer valget. `statistics` er true/false.
  function saveConsent(statistics) {
    var data = {
      version: CONSENT_VERSION,
      statistics: !!statistics,
      // ISO-tidsstempel er nyttig dokumentasjon på NÅR samtykket ble gitt.
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* Ignorer, da gjelder valget kun for denne økten. */
    }
    return data;
  }

  /* ---------------------------------------------------------------------------
     GOOGLE ANALYTICS 4: lastes KUN når statistikk er samtykket
     --------------------------------------------------------------------------- */

  var gaLoaded = false; // Hindrer at skriptet lastes to ganger.

  function loadAnalytics() {
    if (gaLoaded) return;
    // Ikke last noe hvis måle-ID-en fortsatt er tom.
    if (!MEASUREMENT_ID) return;
    gaLoaded = true;

    // 1) Legg til Googles gtag.js-skript i <head>. FØRST her lastes noe fra
    //    Google, og FØRST nå kan Analytics-cookies (_ga, _ga_*) settes.
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(s);

    // 2) Standard gtag-oppsett (samme som Googles utklippskode).
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', MEASUREMENT_ID);
  }

  // Sletter Google Analytics sine cookies (brukes hvis samtykket trekkes tilbake).
  function deleteAnalyticsCookies() {
    var cookies = document.cookie ? document.cookie.split(';') : [];
    for (var i = 0; i < cookies.length; i++) {
      var name = cookies[i].split('=')[0].trim();
      // GA4 bruker _ga og _ga_<STREAM-ID>. _gid/_gat brukes av eldre oppsett.
      if (name.indexOf('_ga') === 0 || name === '_gid' || name.indexOf('_gat') === 0) {
        // Slett på både gjeldende host og på "punkt-domenet" (f.eks. .aaserudweb.no).
        document.cookie = name + '=; Max-Age=0; path=/';
        document.cookie = name + '=; Max-Age=0; path=/; domain=' + location.hostname;
        document.cookie = name + '=; Max-Age=0; path=/; domain=.' + location.hostname;
      }
    }
  }

  /* ---------------------------------------------------------------------------
     BANNER-MARKUP: bygges i JS så vi slipper å duplisere HTML på hver side
     --------------------------------------------------------------------------- */

  var bannerEl = null; // Referanse til banneret så vi kan vise/skjule det.

  function buildBanner() {
    if (bannerEl) return bannerEl;

    var wrapper = document.createElement('div');
    wrapper.className = 'consent';
    wrapper.setAttribute('role', 'dialog');
    wrapper.setAttribute('aria-live', 'polite');
    wrapper.setAttribute('aria-label', 'Samtykke til informasjonskapsler');
    wrapper.hidden = true;

    wrapper.innerHTML = [
      '<div class="consent-box">',

      // --- Hovedvisning: kort tekst + tre likeverdige valg ---
      '  <div class="consent-main" data-consent-view="main">',
      '    <h2 class="consent-title">Vi respekterer personvernet ditt</h2>',
      '    <p class="consent-text">',
      '      Vi bruker informasjonskapsler til statistikk (Google Analytics) for å',
      '      forstå hvordan nettsiden brukes. Statistikk starter kun hvis du sier ja.',
      '      Du kan når som helst endre valget via «Endre samtykke» nederst på siden.',
      '    </p>',
      '    <div class="consent-actions">',
      // Rekkefølge og lik styling: Avvis er like lett å nå som Godta.
      '      <button type="button" class="btn btn-ghost consent-btn" data-consent="reject">Avvis alle</button>',
      '      <button type="button" class="btn btn-ghost consent-btn" data-consent="customize">Tilpass</button>',
      '      <button type="button" class="btn btn-primary consent-btn" data-consent="accept">Godta alle</button>',
      '    </div>',
      '  </div>',

      // --- Tilpass-visning: skru statistikk av/på ---
      '  <div class="consent-customize" data-consent-view="customize" hidden>',
      '    <h2 class="consent-title">Tilpass samtykke</h2>',
      '    <div class="consent-category">',
      '      <div>',
      '        <p class="consent-cat-name">Nødvendige</p>',
      '        <p class="consent-cat-desc">Kreves for at nettsiden skal fungere. Kan ikke slås av.</p>',
      '      </div>',
      '      <span class="consent-cat-fixed">Alltid på</span>',
      '    </div>',
      '    <div class="consent-category">',
      '      <div>',
      '        <p class="consent-cat-name">Statistikk</p>',
      '        <p class="consent-cat-desc">Google Analytics for anonym bruksstatistikk.</p>',
      '      </div>',
      '      <label class="consent-switch">',
      '        <input type="checkbox" data-consent-toggle="statistics">',
      '        <span class="consent-slider" aria-hidden="true"></span>',
      '        <span class="consent-switch-label">Tillat</span>',
      '      </label>',
      '    </div>',
      '    <div class="consent-actions">',
      '      <button type="button" class="btn btn-ghost consent-btn" data-consent="back">Tilbake</button>',
      '      <button type="button" class="btn btn-primary consent-btn" data-consent="save">Lagre valg</button>',
      '    </div>',
      '  </div>',

      '</div>'
    ].join('\n');

    document.body.appendChild(wrapper);
    bannerEl = wrapper;
    wireBanner(wrapper);
    return wrapper;
  }

  /* ---------------------------------------------------------------------------
     VISNING: vise/skjule banner og bytte mellom de to visningene
     --------------------------------------------------------------------------- */

  function showBanner() {
    var el = buildBanner();
    showView('main');
    el.hidden = false;
    document.body.classList.add('consent-open');
  }

  function hideBanner() {
    if (!bannerEl) return;
    bannerEl.hidden = true;
    document.body.classList.remove('consent-open');
  }

  // Bytter mellom 'main' og 'customize' inne i banneret.
  function showView(name) {
    if (!bannerEl) return;
    var views = bannerEl.querySelectorAll('[data-consent-view]');
    for (var i = 0; i < views.length; i++) {
      views[i].hidden = views[i].getAttribute('data-consent-view') !== name;
    }
  }

  /* ---------------------------------------------------------------------------
     HANDLINGER: hva som skjer når brukeren trykker på knappene
     --------------------------------------------------------------------------- */

  // Tar imot brukerens endelige valg, lagrer det og starter/stopper Analytics.
  function applyChoice(statistics) {
    saveConsent(statistics);
    if (statistics) {
      loadAnalytics();
    } else {
      // Avvist: fjern eventuelle GA-cookies (f.eks. hvis brukeren tidligere sa ja).
      deleteAnalyticsCookies();
    }
    hideBanner();
  }

  function wireBanner(el) {
    // Én felles klikk-lytter for alle knappene i banneret.
    el.addEventListener('click', function (event) {
      var target = event.target.closest('[data-consent]');
      if (!target) return;
      var action = target.getAttribute('data-consent');

      if (action === 'accept') {
        applyChoice(true);
      } else if (action === 'reject') {
        applyChoice(false);
      } else if (action === 'customize') {
        // Forhåndsutfyll bryteren med et evt. tidligere valg.
        var saved = readConsent();
        var toggle = el.querySelector('[data-consent-toggle="statistics"]');
        if (toggle) toggle.checked = !!(saved && saved.statistics);
        showView('customize');
      } else if (action === 'back') {
        showView('main');
      } else if (action === 'save') {
        var stat = el.querySelector('[data-consent-toggle="statistics"]');
        applyChoice(!!(stat && stat.checked));
      }
    });
  }

  /* ---------------------------------------------------------------------------
     "ENDRE SAMTYKKE": lenken i footeren åpner banneret på nytt
     --------------------------------------------------------------------------- */

  function wireReopenLinks() {
    var links = document.querySelectorAll('[data-consent-reopen]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        e.preventDefault();
        showBanner();
      });
    }
  }

  /* ---------------------------------------------------------------------------
     OPPSTART
     --------------------------------------------------------------------------- */

  function init() {
    wireReopenLinks();

    var saved = readConsent();
    if (saved) {
      // Brukeren har allerede bestemt seg. Start Analytics kun hvis ja til statistikk.
      if (saved.statistics) loadAnalytics();
    } else {
      // Første besøk (eller utløpt samtykke): vis banneret.
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
