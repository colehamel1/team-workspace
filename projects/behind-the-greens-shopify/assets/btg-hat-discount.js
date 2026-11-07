/* Behind The Greens — hat discount popup.

   Opening the hat section (a hats collection / Headwear filter / a hat's
   own page) opens the popup immediately, and clicking any hat (a product
   card marked data-btg-hat) opens it too:
   "Cole has offered you a 30% discount" and asks for a code.
     - Right code (BTG, any capitalization): the discount is remembered,
       applied to the Shopify session via /discount/BTG, and the cart
       drawer shows 30% off the total.
     - Wrong or no code: no discount. They can try again or keep shopping.

   IMPORTANT: the price people actually PAY is set by Shopify checkout.
   For checkout to take the 30% off, a real discount code "BTG" (30% off
   the order) must exist in Shopify admin → Discounts. */
(function () {
  var CODE = 'BTG';
  var PERCENT = 30;
  var STORE_KEY = 'btg_hat_discount';
  var JUST_ASKED_KEY = 'btg_hat_just_asked';

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
  var pendingUrl = null;

  function hasDiscount() {
    try { return localStorage.getItem(STORE_KEY) === CODE; } catch (e) { return false; }
  }
  function saveDiscount() {
    try { localStorage.setItem(STORE_KEY, CODE); } catch (e) { /* ignore */ }
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

  /* ---------- Cart drawer: show 30% off the total ---------- */
  function applyToCart() {
    if (!hasDiscount()) return;
    var lines = document.querySelector('[data-btg-hat-lines]');
    if (!lines) return;
    var original = parseInt(lines.getAttribute('data-original-cents'), 10) || 0;
    var off = Math.round(original * PERCENT / 100);
    var amountEl = lines.querySelector('[data-btg-hat-discount-amount]');
    var totalEl = lines.querySelector('[data-btg-hat-total]');
    var subtotalEl = document.querySelector('[data-btg-cart-subtotal]');
    if (amountEl) amountEl.textContent = '−' + formatMoney(off);
    if (totalEl) totalEl.textContent = formatMoney(original - off);
    if (subtotalEl) subtotalEl.textContent = formatMoney(original);
    lines.hidden = false;
  }

  /* ---------- Popup open / close ---------- */
  function open(url) {
    pendingUrl = url;
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
      input.focus();
    });
  }

  function close() {
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    if (scrim) scrim.classList.remove('is-visible');
    setTimeout(function () {
      popup.hidden = true;
      if (scrim) scrim.hidden = true;
    }, 300);
  }

  function goToHat() {
    if (pendingUrl) {
      // They already said "no code" on the way here — don't ask again on the hat's page.
      try { sessionStorage.setItem(JUST_ASKED_KEY, '1'); } catch (e) { /* ignore */ }
      window.location.href = pendingUrl;
    } else {
      close();
    }
  }

  /* ---------- Clicks ---------- */
  document.addEventListener('click', function (e) {
    var hat = e.target.closest('a[data-btg-hat]');
    // Let ctrl/cmd-click open in a new tab as normal. Once the code is
    // unlocked, hats just open normally — no need to ask twice.
    if (hat && !hasDiscount() && !(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) {
      e.preventDefault();
      open(hat.getAttribute('href'));
      return;
    }
    if (e.target.closest('[data-btg-hat-close]') || e.target.closest('[data-btg-hat-scrim]')) {
      close();
      return;
    }
    if (e.target.closest('[data-btg-hat-skip]')) {
      goToHat();
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
    applyToCart();
    form.hidden = true;
    successEl.hidden = false;
    // /discount/BTG tells Shopify to apply the code to this shopper's
    // session (so checkout takes the 30% off), then sends them on to the hat.
    var next = pendingUrl || (window.location.pathname + window.location.search);
    setTimeout(function () {
      window.location.href = root + 'discount/' + CODE + '?redirect=' + encodeURIComponent(next);
    }, 1200);
  });

  /* ---------- Checkout: make sure the code rides along ---------- */
  document.addEventListener('submit', function (e) {
    var checkoutForm = e.target.closest && e.target.closest('[data-btg-checkout-form]');
    if (!checkoutForm || !hasDiscount()) return;
    e.preventDefault();
    window.location.href = root + 'checkout?discount=' + CODE;
  });

  applyToCart();
  document.addEventListener('btg:cart:rendered', applyToCart);

  /* ---------- Hat section: pop up immediately ---------- */
  var hatPage = popup.getAttribute('data-hat-page');
  var justAsked = false;
  try {
    justAsked = sessionStorage.getItem(JUST_ASKED_KEY) === '1';
    sessionStorage.removeItem(JUST_ASKED_KEY);
  } catch (e) { /* ignore */ }
  if (hatPage && !hasDiscount() && !(hatPage === 'product' && justAsked)) {
    open(null);
  }
})();
