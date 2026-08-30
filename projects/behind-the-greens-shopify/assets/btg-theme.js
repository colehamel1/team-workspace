/* Behind The Greens — global theme behavior: mobile nav + cart icon wiring.
   Accordions on the product page use native <details>/<summary>, no JS needed. */
(function () {
  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest('[data-btg-mobile-nav-toggle]');
    var closeBtn = e.target.closest('[data-btg-mobile-nav-close]');
    var cartToggle = e.target.closest('[data-btg-cart-toggle]');

    if (openBtn) {
      var nav = document.querySelector('[data-btg-mobile-nav]');
      if (nav) nav.classList.add('is-open');
    }
    if (closeBtn) {
      var navEl = document.querySelector('[data-btg-mobile-nav]');
      if (navEl) navEl.classList.remove('is-open');
    }
    if (cartToggle) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('btg:cart:open'));
    }
  });
})();
