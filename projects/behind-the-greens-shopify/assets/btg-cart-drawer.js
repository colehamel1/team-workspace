/* Behind The Greens — cart drawer.
   Uses Shopify's real AJAX Cart API (/cart/add.js, /cart/change.js) with
   the Section Rendering API (`sections` param) to re-render this drawer
   and the header cart count from live cart data — no cart state is ever
   held or guessed on the client. */
(function () {
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  function drawerEl() { return document.querySelector('[data-btg-cart-drawer]'); }
  function scrimEl() { return document.querySelector('[data-btg-cart-scrim]'); }

  function openDrawer() {
    var d = drawerEl(), s = scrimEl();
    if (!d) return;
    d.hidden = false;
    if (s) s.hidden = false;
    requestAnimationFrame(function () {
      d.classList.add('is-open');
      d.setAttribute('aria-hidden', 'false');
      if (s) s.classList.add('is-visible');
    });
  }

  function closeDrawer() {
    var d = drawerEl(), s = scrimEl();
    if (!d) return;
    d.classList.remove('is-open');
    d.setAttribute('aria-hidden', 'true');
    if (s) s.classList.remove('is-visible');
    setTimeout(function () {
      d.hidden = true;
      if (s) s.hidden = true;
    }, 300);
  }

  function updateHeaderCount(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var newCount = tmp.querySelector('[data-btg-cart-count]');
    var wrap = document.querySelector('.btg-header__cart-wrap');
    var existing = document.querySelector('[data-btg-cart-count]');
    if (!wrap) return;
    if (newCount) {
      if (existing) existing.outerHTML = newCount.outerHTML;
      else wrap.insertAdjacentHTML('beforeend', newCount.outerHTML);
    } else if (existing) {
      existing.remove();
    }
  }

  function updateDrawer(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var newDrawer = tmp.querySelector('[data-btg-cart-drawer]');
    var current = drawerEl();
    if (!newDrawer || !current) return;
    var wasOpen = current.classList.contains('is-open');
    current.outerHTML = newDrawer.outerHTML;
    if (wasOpen) openDrawer();
  }

  function refreshFromSections(sections) {
    if (sections['btg-cart-drawer']) updateDrawer(sections['btg-cart-drawer']);
    if (sections['btg-header']) updateHeaderCount(sections['btg-header']);
  }

  function changeLine(line, quantity) {
    fetch(root + 'cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity, sections: 'btg-cart-drawer,btg-header' })
    })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (res) {
        if (res.ok && res.data.sections) { refreshFromSections(res.data.sections); return; }
        // e.g. a stock cap on "+": re-render the drawer from the real cart.
        return refetchDrawer();
      })
      .catch(refetchDrawer);
  }

  function refetchDrawer() {
    return fetch(root + '?sections=btg-cart-drawer,btg-header')
      .then(function (r) { return r.json(); })
      .then(refreshFromSections)
      .catch(function () {});
  }

  document.addEventListener('btg:cart:open', openDrawer);

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-btg-cart-close]') || e.target.closest('[data-btg-cart-scrim]')) {
      closeDrawer();
    }

    var incBtn = e.target.closest('[data-btg-qty-increase]');
    var decBtn = e.target.closest('[data-btg-qty-decrease]');
    var removeBtn = e.target.closest('[data-btg-remove-line]');

    if (incBtn || decBtn || removeBtn) {
      var line = (incBtn || decBtn || removeBtn).getAttribute('data-line');
      var row = document.querySelector('[data-btg-cart-line="' + line + '"]');
      var qtyEl = row && row.querySelector('[data-btg-qty-value]');
      var current = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;

      if (removeBtn) { changeLine(line, 0); return; }
      if (incBtn) { changeLine(line, current + 1); return; }
      if (decBtn) { changeLine(line, Math.max(current - 1, 0)); return; }
    }
  });

  // Product-page "Add to cart" listens for this and dispatches it after a
  // successful /cart/add.js call — see btg-product-form.js.
  document.addEventListener('btg:cart:refresh', function (e) {
    if (e.detail && e.detail.sections) refreshFromSections(e.detail.sections);
    openDrawer();
  });
})();
