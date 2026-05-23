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
          const subject = encodeURIComponent('Website Inquiry — ' + (form.querySelector('[name=inquiryType,name=requestType]')?.value || 'General'));
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

});
