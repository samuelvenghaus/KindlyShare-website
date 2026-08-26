// KindlyShare — shared site behaviour

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initPricing();
});

function initNavToggle() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  if (!header || !toggle) return;

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  header.querySelectorAll('.main-nav a, .header-actions a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initPricing() {
  const cards = document.querySelectorAll('.price-card');
  const toggleButtons = document.querySelectorAll('.pricing-toggle button');
  if (!cards.length) return;

  function selectCard(card) {
    cards.forEach((c) => {
      c.classList.remove('selected');
      c.setAttribute('aria-pressed', 'false');
    });
    card.classList.add('selected');
    card.setAttribute('aria-pressed', 'true');
  }

  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.price-select-btn')) e.preventDefault();
      selectCard(card);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCard(card);
      }
    });
  });

  if (toggleButtons.length) {
    toggleButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        toggleButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const period = btn.dataset.period;
        document.body.classList.toggle('billing-yearly', period === 'yearly');
        updatePricingDisplay(period);
      });
    });
  }
}

function updatePricingDisplay(period) {
  document.querySelectorAll('[data-monthly][data-yearly]').forEach((el) => {
    el.textContent = period === 'yearly' ? el.dataset.yearly : el.dataset.monthly;
  });
  document.querySelectorAll('.price-billed-note').forEach((el) => {
    el.style.visibility = period === 'yearly' ? 'visible' : 'hidden';
  });
}

