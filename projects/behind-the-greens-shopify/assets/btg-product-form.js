/* Behind The Greens — product page variant selection + add to cart.
   Variant matching runs entirely against the real product.variants JSON
   Shopify renders into the page; nothing about price, availability, or
   images is assumed or hardcoded. */
(function () {
  var form = document.getElementById('btg-product-form');
  if (!form) return;

  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  var variantsJsonEl = form.querySelector('[data-btg-product-json]');
  var variants = variantsJsonEl ? JSON.parse(variantsJsonEl.textContent) : [];
  var idInput = form.querySelector('[data-btg-variant-id]');
  var priceWrap = document.querySelector('[data-btg-price]');
  var availabilityEl = document.querySelector('[data-btg-availability]');
  var addBtn = form.querySelector('[data-btg-add-to-cart]');
  var addLabel = form.querySelector('[data-btg-add-label]');
  var mainImage = document.getElementById('btg-main-image');

  function money(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function selectedOptions() {
    var opts = [];
    form.querySelectorAll('[data-btg-option-input]:checked').forEach(function (input) {
      opts.push(input.value);
    });
    return opts;
  }

  function findVariant(options) {
    return variants.find(function (v) {
      return v.options.every(function (val, i) { return val === options[i]; });
    });
  }

  function updateUI(variant) {
    if (!variant) return;
    idInput.value = variant.id;

    if (priceWrap) {
      var html = '<span class="btg-display" style="font-size:24px;">' + money(variant.price) + '</span>';
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        html += '<span class="btg-pdp__compare-price">' + money(variant.compare_at_price) + '</span>';
      }
      priceWrap.innerHTML = html;
    }

    if (addBtn) {
      addBtn.disabled = !variant.available;
      if (addLabel) addLabel.textContent = variant.available ? 'Add To Cart' : 'Sold Out';
    }
    if (availabilityEl) {
      availabilityEl.textContent = variant.available ? 'In Stock — Ships In 2–3 Business Days' : 'Sold Out';
      availabilityEl.style.color = variant.available ? '#4C7A4A' : '#A5402C';
    }
    if (mainImage && variant.featured_image) {
      mainImage.src = variant.featured_image.src.replace(/(\.[a-zA-Z0-9]+)(\?.*)?$/, '$1');
    }
  }

  form.addEventListener('change', function (e) {
    if (!e.target.matches('[data-btg-option-input]')) return;

    // toggle active class within this option's value group
    var optionGroup = e.target.closest('.btg-pdp__option');
    if (optionGroup) {
      optionGroup.querySelectorAll('.btg-swatch, .btg-size-pill').forEach(function (el) {
        el.classList.remove('active');
      });
      e.target.closest('.btg-swatch, .btg-size-pill').classList.add('active');
      var label = optionGroup.querySelector('[data-btg-option-value-label]');
      if (label) label.textContent = e.target.value;
    }

    var variant = findVariant(selectedOptions());
    updateUI(variant);
  });

  // Thumbnail gallery
  document.querySelectorAll('[data-btg-thumb]').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      document.querySelectorAll('[data-btg-thumb]').forEach(function (t) { t.classList.remove('active'); });
      thumb.classList.add('active');
      if (mainImage) mainImage.src = thumb.getAttribute('data-full');
    });
  });

  // Quantity stepper
  var qtyValue = form.querySelector('[data-btg-pdp-qty-value]');
  var qtyInput = form.querySelector('[data-btg-pdp-qty-input]');
  form.querySelectorAll('[data-btg-pdp-qty-increase], [data-btg-pdp-qty-decrease]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var current = parseInt(qtyValue.textContent, 10) || 1;
      var next = btn.hasAttribute('data-btg-pdp-qty-increase') ? current + 1 : Math.max(current - 1, 1);
      qtyValue.textContent = next;
      qtyInput.value = next;
    });
  });

  // Add to cart — real Shopify AJAX Cart API
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (addBtn.disabled) return;

    var originalLabel = addLabel ? addLabel.textContent : '';
    if (addLabel) addLabel.textContent = 'Adding…';

    fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: idInput.value,
        quantity: parseInt(qtyInput.value, 10) || 1
      })
    })
      .then(function (r) { return r.json(); })
      .then(function () {
        return fetch(root + 'cart.js?sections=btg-cart-drawer,btg-header')
          .then(function (r) { return r.json(); })
          .catch(function () {
            // Fallback: some storefronts don't support sections on cart.js —
            // re-fetch the drawer/header sections via the cart page instead.
            return fetch(root + '?section_id=btg-cart-drawer')
              .then(function (r) { return r.text(); })
              .then(function (html) { return { sections: { 'btg-cart-drawer': html } }; });
          });
      })
      .then(function (data) {
        document.dispatchEvent(new CustomEvent('btg:cart:refresh', { detail: { sections: data.sections } }));
      })
      .finally(function () {
        if (addLabel) addLabel.textContent = originalLabel;
      });
  });
})();
