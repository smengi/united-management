// ============================================================
//   United Management Holdings LLC — Main JS
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  // --- Mobile nav ---
  const hamburger = document.getElementById('hamburger');
  const navLinks   = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  // --- Active nav link ---
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[href]').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  // --- Navbar scroll effect ---
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // --- Scroll reveal ---
  const reveals = document.querySelectorAll(
    '.service-card, .resource-card, .feature-item, .contact-info-block, .reveal, .quick-link-card, .process-step'
  );
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
            entry.target.style.opacity  = '1';
            entry.target.style.transform = 'none';
          }, i * 60);
          ro.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    reveals.forEach(el => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      ro.observe(el);
    });
  }

  // --- Preselect inquiry/request type from ?type= links ---
  // e.g. contact.html?type=maintenance, tenant-resources.html?type=payment
  const typeParam = new URLSearchParams(window.location.search).get('type');
  if (typeParam) {
    const maps = {
      inquiryType: { maintenance: 'tenant-maintenance', payment: 'tenant-payment', insurance: 'tenant-insurance', vendor: 'vendor-general', lease: 'tenant-lease', general: 'management-general' },
      requestType: { maintenance: 'maintenance', payment: 'payment-verify', insurance: 'insurance', vendor: 'vendor-inquiry', lease: 'lease', general: 'tenant-general' }
    };
    ['inquiryType', 'requestType'].forEach(id => {
      const sel = document.getElementById(id);
      const val = maps[id] && maps[id][typeParam];
      if (sel && val && sel.querySelector('option[value="' + val + '"]')) {
        sel.value = val;
      }
    });
    const formEl = document.getElementById('contactForm');
    if (formEl) {
      setTimeout(() => formEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }

  // --- Contact form handler ---
  // If Formspree ID is still a placeholder, show email fallback instead of
  // pretending the form works. Replace YOUR_FORMSPREE_ID with your real ID
  // from https://formspree.io to activate the form.
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');

  if (form) {
    const isPlaceholder = form.action.includes('YOUR_FORMSPREE_ID');

    if (isPlaceholder) {
      // Inject a visible notice that the form endpoint is not yet active
      const notice = document.createElement('div');
      notice.className = 'form-fallback-notice';
      notice.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>' +
        '<span>The online form is not yet active. Please email management directly at ' +
        '<a href="mailto:management@unitedmanagementholdings.com">management@unitedmanagementholdings.com</a> ' +
        'or use the button below to open your email client.</span>';
      form.prepend(notice);

      // Change submit button to open mailto instead
      const btn = form.querySelector('.form-submit');
      if (btn) {
        btn.textContent = 'Open Email Client →';
        btn.type = 'button';
        btn.addEventListener('click', () => {
          const name    = (form.querySelector('[name=firstName]')?.value || '') + ' ' + (form.querySelector('[name=lastName]')?.value || '');
          const subject = encodeURIComponent('Website Inquiry — ' + (form.querySelector('[name=inquiryType], [name=requestType]')?.value || 'General'));
          const body    = encodeURIComponent((form.querySelector('[name=message]')?.value || '') + '\n\nFrom: ' + name.trim());
          window.location.href = 'mailto:management@unitedmanagementholdings.com?subject=' + subject + '&body=' + body;
        });
      }

    } else {
      // Real Formspree endpoint — use fetch submission
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('.form-submit');
        const orig = btn.textContent;
        btn.textContent = 'Sending…';
        btn.disabled = true;
        try {
          const res = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' }
          });
          if (res.ok) {
            form.reset();
            if (success) { success.style.display = 'block'; }
          } else {
            alert('Something went wrong. Please email management@unitedmanagementholdings.com directly.');
          }
        } catch {
          alert('Network error. Please email management@unitedmanagementholdings.com directly.');
        }
        btn.textContent = orig;
        btn.disabled = false;
      });
    }
  }

  // ============================================================
  //   Portal flow (Tenant / Vendor): property select → action → form
  //   No accounts, no fake login — pure client-side guidance over a
  //   single Formspree form. Property selection is required first.
  // ============================================================
  const portal = document.getElementById('portal');
  if (portal) {
    const reveal       = document.getElementById('portalReveal');
    const propBar      = document.getElementById('selectedPropertyBar');
    const propBarName  = document.getElementById('selectedPropertyName');
    const propField    = document.getElementById('propertyField');     // hidden input in the form
    const subjectField = document.getElementById('formSubject');       // hidden _subject for Formspree
    const reqSelect    = document.getElementById('requestType');       // visible request-type select
    const formHeading  = document.getElementById('portalFormHeading'); // form title text
    const portalType   = portal.getAttribute('data-portal') || 'Request';

    function updateSubject() {
      if (!subjectField) return;
      const prop  = (propField && propField.value) ? propField.value : 'Property not selected';
      const label = (reqSelect && reqSelect.options[reqSelect.selectedIndex])
        ? reqSelect.options[reqSelect.selectedIndex].text : 'Request';
      subjectField.value = 'UMH ' + portalType + ' Portal — ' + label + ' — ' + prop;
    }

    function toggleConditional(value) {
      document.querySelectorAll('[data-cond]').forEach(function (el) {
        const list = (el.getAttribute('data-cond') || '').split(/\s+/);
        el.classList.toggle('show', list.indexOf(value) !== -1);
      });
    }

    function selectProperty(name) {
      document.querySelectorAll('.property-select-card[data-property]').forEach(function (c) {
        c.classList.toggle('selected', c.getAttribute('data-property') === name);
      });
      if (propField)   propField.value = name;
      if (propBarName) propBarName.textContent = name;
      if (propBar)     propBar.classList.add('visible');
      if (reveal)      reveal.classList.add('visible');
      updateSubject();
      const actions = document.getElementById('portalActions');
      if (actions) setTimeout(function () { actions.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
    }

    function chooseAction(value, label) {
      if (reqSelect && value) {
        const opt = reqSelect.querySelector('option[value="' + value + '"]');
        if (opt) reqSelect.value = value;
      }
      document.querySelectorAll('.portal-action-card[data-action]').forEach(function (c) {
        c.classList.toggle('selected', c.getAttribute('data-action') === value);
      });
      if (formHeading && label) formHeading.textContent = label;
      toggleConditional(value);
      updateSubject();
      const formSec = document.getElementById('portalForm');
      if (formSec) setTimeout(function () { formSec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
    }

    document.querySelectorAll('.property-select-card[data-property]').forEach(function (card) {
      card.addEventListener('click', function () { selectProperty(card.getAttribute('data-property')); });
    });

    const changeBtn = document.getElementById('changeProperty');
    if (changeBtn) {
      changeBtn.addEventListener('click', function () {
        const sel = document.getElementById('portalSelect');
        if (sel) sel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    document.querySelectorAll('.portal-action-card[data-action]').forEach(function (card) {
      card.addEventListener('click', function () {
        chooseAction(card.getAttribute('data-action'), card.getAttribute('data-label'));
      });
    });

    if (reqSelect) {
      reqSelect.addEventListener('change', function () { toggleConditional(reqSelect.value); updateSubject(); });
    }

    // Deep link: ?action=maintenance auto-selects the only property then the action.
    const actionParam = new URLSearchParams(window.location.search).get('action');
    if (actionParam) {
      const single = document.querySelectorAll('.property-select-card[data-property]:not(.psc-disabled)');
      if (single.length === 1) selectProperty(single[0].getAttribute('data-property'));
      const ac = document.querySelector('.portal-action-card[data-action="' + actionParam + '"]');
      if (ac) chooseAction(ac.getAttribute('data-action'), ac.getAttribute('data-label'));
    }
  }

});
