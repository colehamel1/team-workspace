/* Behind The Greens — hat discount (code BTG, 30% off).

   - Opening a hat's own product page shows the popup:
     "Cole has offered you a 30% discount" + a box for the code.
     It never blocks anything: "No code — keep shopping", the X, the dark
     background, or Escape all close it, and once closed it stays closed
     for the rest of that visit. Clicking a hat in the shop just opens it.
   - Right code (BTG, any capitalization): the discount is remembered,
     applied to the Shopify session via /discount/BTG, hat prices show the
     30%-off price underneath, and the cart drawer shows 30% off the total.
   - Wrong code: no discount. They can try again or close it.

   The price people actually PAY is set by Shopify checkout, using the real
   "BTG" discount code under Shopify admin → Discounts. */
(function () {
  var CODE = 'BTG';
  var PERCENT = 30;
  var STORE_KEY = 'btg_hat_discount';
  var DISMISSED_KEY = 'btg_hat_popup_dismissed';

  var popup = document.querySelector('[data-btg-hat-popup]');
  var scrim = document.querySelector('[data-btg-hat-scrim]');
  if (!popup) return;

  var root = popup.getAttribute('data-root') || '/';
  if (root.slice(-1) !== '/') root += '/';
  var moneyFormat = popup.getAttribute('data-money-format') || '${{amount}}';

  var form = popup.querySelector('[data-btg-hat-form]');
  var input = popup.querySelector('[data-btg-hat-input]');
  var errorEl = popup.querySelector('[data-btg-hat-error]');
  var successEl = popup.querySelector('[data-btg-hat-success]');

  function hasDiscount() {
    try { return localStorage.getItem(STORE_KEY) === CODE; } catch (e) { return false; }
  }
  function saveDiscount() {
    try { localStorage.setItem(STORE_KEY, CODE); } catch (e) { /* ignore */ }
  }
  function wasDismissed() {
    try { return sessionStorage.getItem(DISMISSED_KEY) === '1'; } catch (e) { return false; }
  }
  function markDismissed() {
    try { sessionStorage.setItem(DISMISSED_KEY, '1'); } catch (e) { /* ignore */ }
  }

  /* ---------- Money formatting (uses the shop's own currency format) ---------- */
  function addCommas(n, sep) { return n.replace(/\B(?=(\d{3})+(?!\d))/g, sep); }
  function formatMoney(cents) {
    var amount = (cents / 100).toFixed(2);
    var parts = amount.split('.');
    return moneyFormat.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, kind) {
      switch (kind) {
        case 'amount_no_decimals': return addCommas(String(Math.round(cents / 100)), ',');
        case 'amount_with_comma_separator': return addCommas(parts[0], '.') + ',' + parts[1];
        case 'amount_no_decimals_with_comma_separator': return addCommas(String(Math.round(cents / 100)), '.');
        case 'amount_with_apostrophe_separator': return addCommas(parts[0], "'") + '.' + parts[1];
        default: return addCommas(parts[0], ',') + '.' + parts[1];
      }
    });
  }
  function discounted(cents) { return cents - Math.round(cents * PERCENT / 100); }

  /* ---------- "With BTG" price line under hat prices ---------- */
  function priceLine(cents) {
    return '<s>' + formatMoney(cents) + '</s>' + formatMoney(discounted(cents)) + ' with code BTG';
  }

  function applyToHatCards() {
    document.querySelectorAll('a[data-btg-hat][data-btg-hat-cents]').forEach(function (card) {
      var priceEl = card.querySelector('.btg-card__price');
      var cents = parseInt(card.getAttribute('data-btg-hat-cents'), 10);
      if (!priceEl || !cents || priceEl.querySelector('.btg-hat-price-line')) return;
      var line = document.createElement('span');
      line.className = 'btg-hat-price-line';
      line.innerHTML = priceLine(cents);
      priceEl.appendChild(line);
    });
  }

  // Product page: sits right under the price and follows the chosen variant.
  function currentVariantCents() {
    var idInput = document.querySelector('[data-btg-variant-id]');
    var json = document.querySelector('[data-btg-product-json]');
    if (!idInput || !json) return null;
    try {
      var variants = JSON.parse(json.textContent);
      var id = String(idInput.value);
      for (var i = 0; i < variants.length; i++) {
        if (String(variants[i].id) === id) return variants[i].price;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function applyToProductPage() {
    if (popup.getAttribute('data-hat-page') !== 'product') return;
    var priceWrap = document.querySelector('[data-btg-price]');
    if (!priceWrap) return;
    var line = document.querySelector('[data-btg-hat-pdp-line]');
    if (!line) {
      line = document.createElement('div');
      line.className = 'btg-hat-price-line';
      line.setAttribute('data-btg-hat-pdp-line', '');
      priceWrap.parentNode.insertBefore(line, priceWrap.nextSibling);
      // The product page rewrites its price when a color/size changes — keep up.
      new MutationObserver(applyToProductPage).observe(priceWrap, { childList: true, subtree: true });
    }
    var cents = currentVariantCents();
    line.hidden = !cents;
    if (cents) line.innerHTML = priceLine(cents);
  }

  /* ---------- Cart drawer: show 30% off the total ---------- */
  function applyToCart() {
    var lines = document.querySelector('[data-btg-hat-lines]');
    if (!lines) return;
    var original = parseInt(lines.getAttribute('data-original-cents'), 10) || 0;
    var amountEl = lines.querySelector('[data-btg-hat-discount-amount]');
    var totalEl = lines.querySelector('[data-btg-hat-total]');
    var subtotalEl = document.querySelector('[data-btg-cart-subtotal]');
    if (amountEl) amountEl.textContent = '−' + formatMoney(original - discounted(original));
    if (totalEl) totalEl.textContent = formatMoney(discounted(original));
    if (subtotalEl) subtotalEl.textContent = formatMoney(original);
    lines.hidden = false;
  }

  function applyEverywhere() {
    if (!hasDiscount()) return;
    applyToCart();
    applyToHatCards();
    applyToProductPage();
  }

  /* ---------- Popup open / close ---------- */
  function open() {
    form.hidden = false;
    successEl.hidden = true;
    errorEl.hidden = true;
    input.value = '';
    popup.hidden = false;
    if (scrim) scrim.hidden = false;
    requestAnimationFrame(function () {
      popup.classList.add('is-open');
      popup.setAttribute('aria-hidden', 'false');
      if (scrim) scrim.classList.add('is-visible');
    });
  }

  function close() {
    markDismissed();
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    if (scrim) scrim.classList.remove('is-visible');
    setTimeout(function () {
      popup.hidden = true;
      if (scrim) scrim.hidden = true;
    }, 300);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-btg-hat-close]') || e.target.closest('[data-btg-hat-scrim]') ||
        e.target.closest('[data-btg-hat-skip]')) {
      close();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && popup.classList.contains('is-open')) close();
  });

  /* ---------- Code check ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var entered = (input.value || '').trim().toUpperCase();
    if (entered !== CODE) {
      errorEl.hidden = false;
      input.select();
      return;
    }
    saveDiscount();
    applyEverywhere();
    form.hidden = true;
    successEl.hidden = false;
    // /discount/BTG tells Shopify to apply the code to this shopper's
    // session (so checkout takes the 30% off), then brings them right back.
    var here = window.location.pathname + window.location.search;
    setTimeout(function () {
      window.location.href = root + 'discount/' + CODE + '?redirect=' + encodeURIComponent(here);
    }, 1200);
  });

  /* ---------- Checkout: make sure the code rides along ---------- */
  document.addEventListener('submit', function (e) {
    var checkoutForm = e.target.closest && e.target.closest('[data-btg-checkout-form]');
    if (!checkoutForm || !hasDiscount()) return;
    e.preventDefault();
    window.location.href = root + 'checkout?discount=' + CODE;
  });

  applyEverywhere();
  document.addEventListener('btg:cart:rendered', applyEverywhere);

  /* ---------- Hat page: pop up on arrival ---------- */
  if (popup.getAttribute('data-hat-page') === 'product' && !hasDiscount() && !wasDismissed()) {
    open();
  }
})();
