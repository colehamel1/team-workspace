/* Behind The Greens — global theme behavior: mobile nav + cart icon wiring.
   Accordions on the product page use native <details>/<summary>, no JS needed. */
(function () {
  function navEl() { return document.querySelector('[data-btg-mobile-nav]'); }

  function setNav(open) {
    var nav = navEl();
    if (!nav) return;
    nav.classList.toggle('is-open', open);
    nav.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.documentElement.style.overflow = open ? 'hidden' : '';
    var toggle = document.querySelector('[data-btg-mobile-nav-toggle]');
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-btg-mobile-nav-toggle]')) setNav(true);
    if (e.target.closest('[data-btg-mobile-nav-close]')) setNav(false);
    // Tapping a link inside the open menu closes it (matters for same-page anchors).
    if (e.target.closest('[data-btg-mobile-nav] a')) setNav(false);

    if (e.target.closest('[data-btg-cart-toggle]')) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('btg:cart:open'));
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setNav(false);
  });
})();
