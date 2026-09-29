/* Behind The Greens — global theme behavior: mobile nav, cart icon,
   card swipe dots, and the transparent-over-hero header on the homepage.
   Everything here is progressive: without JS the site works and looks
   complete (solid header, first card frame, native swipe). */
(function () {
  var root = document.documentElement;

  // ---------- Mobile nav ----------
  function navEl() { return document.querySelector('[data-btg-mobile-nav]'); }
  function setNav(open) {
    var nav = navEl();
    if (!nav) return;
    nav.classList.toggle('is-open', open);
    nav.setAttribute('aria-hidden', open ? 'false' : 'true');
    root.style.overflow = open ? 'hidden' : '';
    var toggle = document.querySelector('[data-btg-mobile-nav-toggle]');
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-btg-mobile-nav-toggle]')) setNav(true);
    if (e.target.closest('[data-btg-mobile-nav-close]')) setNav(false);
    if (e.target.closest('[data-btg-mobile-nav] a')) setNav(false);
    if (e.target.closest('[data-btg-cart-toggle]')) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('btg:cart:open'));
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNav(false);
  });

  // ---------- Product card swipe dots (touch) ----------
  // scroll doesn't bubble, so listen in the capture phase once for all cards.
  document.addEventListener('scroll', function (e) {
    var track = e.target;
    if (!track || !track.hasAttribute || !track.hasAttribute('data-btg-card-track')) return;
    var index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    var dots = track.parentNode.querySelectorAll('.btg-card__dots i');
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('is-active', i === index);
  }, { capture: true, passive: true });

  // ---------- Header over the hero (homepage only) ----------
  var overlay = document.querySelector('[data-btg-header-overlay]');
  if (overlay && document.querySelector('.btg-hero')) {
    root.classList.add('btg-overlay-header');
    var ticking = false;
    var update = function () {
      root.classList.toggle('btg-header-solid', window.scrollY > 40);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }
})();
