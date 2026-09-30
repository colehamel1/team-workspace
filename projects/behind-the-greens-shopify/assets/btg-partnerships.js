/* Behind The Greens — Partnerships "Add To Cart" buttons.
   Posts the package to Shopify's AJAX cart and opens the cart drawer, the
   same way the product page does (see btg-product-form.js). Without JS
   the form still posts to /cart/add normally. */
(function () {
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-btg-bp-form]');
    if (!form) return;
    e.preventDefault();

    var btn = form.querySelector('[data-btg-bp-btn]');
    var label = form.querySelector('[data-btg-bp-label]');
    var error = form.querySelector('[data-btg-bp-error]');
    var idInput = form.querySelector('input[name="id"]');
    if (!btn || btn.disabled || !idInput || !idInput.value) return;

    var original = label ? label.textContent : '';
    function reset() { btn.disabled = false; if (label) label.textContent = original; }

    btn.disabled = true;
    if (label) label.textContent = 'Adding…';
    if (error) error.textContent = '';

    fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: idInput.value, quantity: 1, sections: 'btg-cart-drawer,btg-header' })
    })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (res) {
        if (!res.ok) {
          reset();
          if (error) error.textContent = (res.data && (res.data.description || res.data.message)) || 'Something went wrong. Please try again.';
          return;
        }
        if (label) label.textContent = 'Added';
        document.dispatchEvent(new CustomEvent('btg:cart:refresh', { detail: { sections: res.data.sections || {} } }));
        window.setTimeout(reset, 1400);
      })
      .catch(function () {
        reset();
        if (error) error.textContent = 'Connection problem. Please try again.';
      });
  });
})();
