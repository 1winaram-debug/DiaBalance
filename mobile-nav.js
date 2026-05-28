/**
 * DiaBalance — Mobile Navigation (Burger Menu + Drawer)
 * Pure vanilla JS, no dependencies.
 * Include ONCE at the bottom of <body> on every page.
 *
 * What it does:
 *  1. Creates a burger button and injects it into the nav (mobile only)
 *  2. Builds a slide-in drawer with all nav links from the current page
 *  3. Creates a backdrop overlay
 *  4. Handles open/close, Escape key, outside-click, and
 *     locks body scroll while drawer is open
 *  5. Adds touch-friendly aria attributes throughout
 */
(function () {
  'use strict';

  /* ── 1. Find the nav element ── */
  const nav = document.querySelector('nav, .nav-bar');
  if (!nav) return;

  /* ── 2. Collect existing nav links/buttons to mirror in drawer ── */
  // We collect .nav-back-btn, .gen-btn, .logo — then build drawer items
  const logo = nav.querySelector('.logo');
  const navLinks = Array.from(nav.querySelectorAll('a:not(.logo), button'));

  /* ── 3. Create burger button ── */
  const burger = document.createElement('button');
  burger.className = 'mob-burger';
  burger.setAttribute('aria-label', 'Բացել ցանկը');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-controls', 'mob-drawer');
  burger.innerHTML = `
    <span></span>
    <span></span>
    <span></span>
  `;
  nav.appendChild(burger);

  /* ── 4. Create overlay ── */
  const overlay = document.createElement('div');
  overlay.className = 'mob-drawer-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);

  /* ── 5. Create drawer ── */
  const drawer = document.createElement('nav');
  drawer.className = 'mob-drawer';
  drawer.id = 'mob-drawer';
  drawer.setAttribute('aria-label', 'Գլխավոր ցանկ');
  drawer.setAttribute('role', 'navigation');

  // Header in drawer: logo + close button
  const drawerHeader = document.createElement('div');
  drawerHeader.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid #e2e4ed;';
  if (logo) {
    const drawerLogo = logo.cloneNode(true);
    drawerLogo.style.fontSize = '1.3rem';
    drawerHeader.appendChild(drawerLogo);
  }

  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Փակել ցանկը');
  closeBtn.style.cssText =
    'background:none;border:none;cursor:pointer;color:#1a3c6e;font-size:1.3rem;padding:0.3rem;border-radius:8px;display:flex;align-items:center;justify-content:center;';
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  drawerHeader.appendChild(closeBtn);
  drawer.appendChild(drawerHeader);

  // Nav section header
  const navSection = document.createElement('div');
  navSection.innerHTML = '<div style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;color:#8a91a8;text-transform:uppercase;padding:0 0.5rem;margin-bottom:0.5rem;">Նավիգացիա</div>';
  drawer.appendChild(navSection);

  // Home link (always add)
  const homeLinkEl = document.createElement('a');
  homeLinkEl.href = 'index.html';
  homeLinkEl.innerHTML = '<i class="fa-solid fa-house" style="width:20px;color:#0cbfb0;"></i> Գլխավոր Էջ';
  drawer.appendChild(homeLinkEl);

  // Mirror existing nav links
  navLinks.forEach(el => {
    const isBackBtn = el.classList.contains('nav-back-btn');
    const isGenBtn  = el.classList.contains('gen-btn');
    const href = el.getAttribute('href');
    const text = el.textContent.trim().replace(/^.*?\s/, ''); // strip icon char

    if (isBackBtn) {
      // Already added Home link above
      return;
    }

    if (isGenBtn) {
      // Mirror the generate-weekly button
      const mirrorBtn = document.createElement('button');
      mirrorBtn.innerHTML = el.innerHTML;
      mirrorBtn.style.cssText = 'color:#0cbfb0;font-weight:700;';
      mirrorBtn.onclick = () => {
        closeMobMenu();
        // Trigger the original button
        el.click();
      };
      drawer.appendChild(mirrorBtn);
      return;
    }

    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.innerHTML = el.innerHTML;
      drawer.appendChild(a);
    }
  });

  // Extra portal links (show on all pages)
  const divider = document.createElement('div');
  divider.className = 'mob-drawer-divider';
  drawer.appendChild(divider);

  const extraLabel = document.createElement('div');
  extraLabel.innerHTML = '<div style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;color:#8a91a8;text-transform:uppercase;padding:0 0.5rem;margin-bottom:0.5rem;">Բաժիններ</div>';
  drawer.appendChild(extraLabel);

  const portalLinks = [
    { href: 'types.html',    icon: 'fa-list',           label: 'Դիաբետի Տեսակները' },
    { href: 'tips.html',     icon: 'fa-lightbulb',      label: 'Կյանքի Կերպ' },
    { href: 'control.html',  icon: 'fa-chart-line',     label: 'Վերահսկում' },
    { href: 'menu.html',     icon: 'fa-utensils',       label: 'Ճաշացուցակ' },
    { href: 'quizzes.html',  icon: 'fa-circle-question',label: 'Քվիզներ' },
    { href: 'firstaid.html', icon: 'fa-kit-medical',    label: 'Առաջին Օգնություն' },
    { href: 'recipes.html',  icon: 'fa-bowl-food',      label: 'Բաղադրատոմսեր' },
    { href: 'stories.html',  icon: 'fa-star',           label: 'Պատմություններ' },
    { href: 'about.html',    icon: 'fa-circle-info',    label: 'Մեր Մասին' },
  ];

  const currentPage = location.pathname.split('/').pop() || 'index.html';
  portalLinks.forEach(({ href, icon, label }) => {
    if (href === currentPage) return; // skip current page
    const a = document.createElement('a');
    a.href = href;
    a.innerHTML = `<i class="fa-solid ${icon}" style="width:20px;color:#0cbfb0;"></i> ${label}`;
    drawer.appendChild(a);
  });

  document.body.appendChild(drawer);

  /* ── 6. Open / Close logic ── */
  function openMobMenu() {
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    drawer.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    // Move focus to first link in drawer
    const firstLink = drawer.querySelector('a, button');
    if (firstLink) setTimeout(() => firstLink.focus(), 320);
  }

  function closeMobMenu() {
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
    burger.focus();
  }

  /* ── 7. Event listeners ── */
  burger.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    isOpen ? closeMobMenu() : openMobMenu();
  });

  closeBtn.addEventListener('click', closeMobMenu);
  overlay.addEventListener('click', closeMobMenu);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeMobMenu();
  });

  // Close drawer when a link is clicked (navigation)
  drawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      // small delay lets the link navigate before hiding
      setTimeout(closeMobMenu, 80);
    });
  });

  /* ── 8. Touch-swipe to close (swipe left → close) ── */
  let touchStartX = 0;
  drawer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  drawer.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx < -60) closeMobMenu(); // swipe left
  }, { passive: true });

  /* ── 9. Only show burger on mobile (<1024px) ── */
  // The CSS handles display:none on desktop, but also guard in JS:
  function checkViewport() {
    if (window.innerWidth >= 1024) closeMobMenu();
  }
  window.addEventListener('resize', checkViewport);
})();
