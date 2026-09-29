/* Behind The Greens — product page gallery, variant selection, and add to cart.
   Variant matching runs entirely against the real product.variants JSON
   Shopify renders into the page; nothing about price, availability, or
   images is assumed or hardcoded. Works for any number of options/values/
   images — nothing here is specific to one product. */
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
  var optionGroups = Array.prototype.slice.call(form.querySelectorAll('[data-btg-option-index]'));
  var colorOptionGroup = form.querySelector('[data-btg-color-option]');
  var colorOptionIndex = colorOptionGroup ? parseInt(colorOptionGroup.getAttribute('data-btg-option-index'), 10) : null;

  var gallery = document.querySelector('[data-btg-gallery]');
  var slides = gallery ? Array.prototype.slice.call(gallery.querySelectorAll('[data-btg-slide]')) : [];
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('[data-btg-thumb]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-btg-dot]'));

  var currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD';
  var moneyFormat;
  try { moneyFormat = new Intl.NumberFormat(document.documentElement.lang || undefined, { style: 'currency', currency: currency }); } catch (e) { moneyFormat = null; }
  function money(cents) {
    return moneyFormat ? moneyFormat.format(cents / 100) : (cents / 100).toFixed(2) + ' ' + currency;
  }

  // Indexed by option position (not DOM order) so this stays correct
  // regardless of how many options a product has.
  function selectedOptions() {
    var opts = [];
    form.querySelectorAll('[data-btg-option-input]:checked').forEach(function (input) {
      var group = input.closest('[data-btg-option-index]');
      var index = group ? parseInt(group.getAttribute('data-btg-option-index'), 10) : opts.length;
      opts[index] = input.value;
    });
    return opts;
  }

  function findVariant(options) {
    // Products with no options (e.g. the hat) have a single default variant.
    if (!options.length && variants.length === 1) return variants[0];
    return variants.find(function (v) {
      return v.options.every(function (val, i) { return val === options[i]; });
    });
  }

  // ---------- Gallery: swipeable strip, kept in sync with thumbs/dots/variant ----------
  var isProgrammaticScroll = false;

  // offsetLeft is relative to the nearest *positioned* ancestor, which may
  // not be the scroll container itself — measure against the gallery's own
  // box instead so this keeps working regardless of surrounding layout.
  function slideOffset(slide) {
    if (!gallery) return 0;
    return slide.getBoundingClientRect().left - gallery.getBoundingClientRect().left + gallery.scrollLeft;
  }

  function setActiveSlide(index, opts) {
    opts = opts || {};
    if (index == null || index < 0 || index >= slides.length) return;

    thumbs.forEach(function (t) { t.classList.remove('active'); });
    if (thumbs[index]) thumbs[index].classList.add('active');

    dots.forEach(function (d) { d.classList.remove('active'); });
    if (dots[index]) dots[index].classList.add('active');

    if (!opts.skipScroll && gallery && slides[index]) {
      isProgrammaticScroll = true;
      gallery.scrollTo({ left: slideOffset(slides[index]), behavior: opts.instant ? 'auto' : 'smooth' });
      window.setTimeout(function () { isProgrammaticScroll = false; }, 400);
    }
  }

  function slideIndexForMediaId(mediaId) {
    if (mediaId == null) return -1;
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].getAttribute('data-media-id') === String(mediaId)) return i;
    }
    return -1;
  }

  // A specific size+color variant may not have its own featured image set
  // in Shopify even when the color as a whole does (common with bulk/POD
  // imports, which often only tag the image on one size per color). Fall
  // back to any variant sharing the same color value that does have one,
  // so picking a color always jumps to that color's photo.
  function imageIdForColor(colorValue) {
    if (colorOptionIndex == null || colorValue == null) return null;
    // Slides are keyed by media id, so use featured_media (not the legacy image id).
    var match = variants.find(function (v) {
      return v.options[colorOptionIndex] === colorValue && v.featured_media && v.featured_media.id;
    });
    return match ? match.featured_media.id : null;
  }

  thumbs.forEach(function (thumb, i) {
    thumb.addEventListener('click', function () { setActiveSlide(i); });
  });

  // Keep the active thumbnail/dot in sync while the visitor swipes by hand.
  if (gallery && slides.length > 1) {
    var scrollTimer;
    gallery.addEventListener('scroll', function () {
      if (isProgrammaticScroll) return;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(function () {
        var center = gallery.scrollLeft + gallery.clientWidth / 2;
        var closest = 0;
        var closestDist = Infinity;
        slides.forEach(function (slide, i) {
          var dist = Math.abs((slideOffset(slide) + slide.clientWidth / 2) - center);
          if (dist < closestDist) { closestDist = dist; closest = i; }
        });
        setActiveSlide(closest, { skipScroll: true });
      }, 80);
    }, { passive: true });
  }

  // ---------- Option availability: disable combinations that don't exist as variants ----------
  // Distinct from "sold out" (a real variant with inventory 0, which still
  // gets selected normally and shows Sold Out on the button below).
  function refreshOptionAvailability() {
    var current = selectedOptions();
    optionGroups.forEach(function (group) {
      var groupIndex = parseInt(group.getAttribute('data-btg-option-index'), 10);
      group.querySelectorAll('[data-btg-option-input]').forEach(function (input) {
        var possible = variants.some(function (v) {
          return v.options.every(function (val, i) {
            if (i === groupIndex) return val === input.value;
            return current[i] == null || val === current[i];
          });
        });
        var control = input.closest('.btg-swatch, .btg-size-pill');
        if (!control) return;
        control.classList.toggle('is-unavailable', !possible);
        if (!possible) {
          control.setAttribute('aria-disabled', 'true');
        } else {
          control.removeAttribute('aria-disabled');
        }
      });
    });
  }

  // ---------- Variant + UI sync ----------
  function updateUI(variant, selectedOpts) {
    if (!variant) {
      // No real variant matches the current selection (an option
      // combination that was never created in Shopify). Never leave a
      // stale variant id sitting in the form — that would let someone
      // add the wrong product/size/color with no warning.
      if (idInput) idInput.value = '';
      if (addBtn) addBtn.disabled = true;
      if (addLabel) addLabel.textContent = 'Unavailable';
      if (availabilityEl) {
        availabilityEl.textContent = 'This combination isn’t available';
        availabilityEl.style.color = '#A5402C';
      }
      syncSticky(null);
      return;
    }

    idInput.value = variant.id;

    if (priceWrap) {
      var html = '<span class="btg-pdp__price-now">' + money(variant.price) + '</span>';
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
      availabilityEl.textContent = variant.available ? '' : 'Sold Out';
      availabilityEl.style.color = '#A5402C';
    }
    syncSticky(variant);

    var colorValue = colorOptionIndex != null && selectedOpts ? selectedOpts[colorOptionIndex] : null;
    var targetMediaId = (variant.featured_media && variant.featured_media.id) || imageIdForColor(colorValue);
    if (targetMediaId) {
      var slideIndex = slideIndexForMediaId(targetMediaId);
      if (slideIndex > -1) setActiveSlide(slideIndex);
    }
  }

  form.addEventListener('change', function (e) {
    if (!e.target.matches('[data-btg-option-input]')) return;

    var optionGroup = e.target.closest('.btg-pdp__option');
    if (optionGroup) {
      optionGroup.querySelectorAll('.btg-swatch, .btg-size-pill').forEach(function (el) {
        el.classList.remove('active');
      });
      var control = e.target.closest('.btg-swatch, .btg-size-pill');
      if (control) control.classList.add('active');
      var label = optionGroup.querySelector('[data-btg-option-value-label]');
      if (label) label.textContent = e.target.value;
    }

    var opts = selectedOptions();
    var variant = findVariant(opts);
    if (!variant) {
      // The picked value doesn't exist with the other current choices:
      // switch the other options to the first real variant that has it.
      var group = e.target.closest('[data-btg-option-index]');
      var idx = group ? parseInt(group.getAttribute('data-btg-option-index'), 10) : -1;
      var fallback = variants.find(function (v) { return v.options[idx] === e.target.value && v.available; }) ||
                     variants.find(function (v) { return v.options[idx] === e.target.value; });
      if (fallback) {
        optionGroups.forEach(function (g) {
          var gi = parseInt(g.getAttribute('data-btg-option-index'), 10);
          g.querySelectorAll('[data-btg-option-input]').forEach(function (input) {
            var on = input.value === fallback.options[gi];
            input.checked = on;
            var control = input.closest('.btg-swatch, .btg-size-pill');
            if (control) control.classList.toggle('active', on);
          });
          var lbl = g.querySelector('[data-btg-option-value-label]');
          if (lbl) lbl.textContent = fallback.options[gi];
        });
        opts = selectedOptions();
        variant = fallback;
      }
    }
    refreshOptionAvailability();
    updateUI(variant, opts);
  });

  refreshOptionAvailability();

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

  // ---------- Mobile sticky add-to-cart ----------
  var sticky = document.querySelector('[data-btg-sticky]');
  var stickyBtn = sticky ? sticky.querySelector('[data-btg-sticky-btn]') : null;
  var stickyLabel = sticky ? sticky.querySelector('[data-btg-sticky-label]') : null;
  var stickyPrice = sticky ? sticky.querySelector('[data-btg-sticky-price]') : null;

  function syncSticky(variant) {
    if (!sticky) return;
    var available = !!(variant && variant.available);
    if (stickyBtn) stickyBtn.disabled = !available;
    if (stickyLabel) stickyLabel.textContent = !variant ? 'Unavailable' : (available ? 'Add To Cart' : 'Sold Out');
    if (stickyPrice && variant) stickyPrice.textContent = money(variant.price);
  }

  if (sticky && addBtn && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      // Show the bar only once the main button has scrolled up out of view.
      var e = entries[0];
      var show = !e.isIntersecting && e.boundingClientRect.top < 0;
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
      if (stickyBtn) stickyBtn.tabIndex = show ? 0 : -1;
    }).observe(addBtn);
  }

  // ---------- Add to cart — Shopify AJAX Cart API ----------
  // /cart/add.js with `sections` returns the freshly rendered drawer + header
  // in the same response, so the drawer always opens showing the real cart.
  function setLabels(text) {
    if (addLabel) addLabel.textContent = text;
    if (stickyLabel) stickyLabel.textContent = text;
  }

  function resetButtons() {
    var opts = selectedOptions();
    updateUI(findVariant(opts), opts);
  }

  function showError(msg) {
    resetButtons();
    if (availabilityEl) { availabilityEl.textContent = msg; availabilityEl.style.color = '#A5402C'; }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (addBtn.disabled || !idInput.value) return;

    setLabels('Adding…');
    addBtn.disabled = true;
    if (stickyBtn) stickyBtn.disabled = true;
    if (availabilityEl) availabilityEl.textContent = '';

    fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        id: idInput.value,
        quantity: parseInt(qtyInput.value, 10) || 1,
        sections: 'btg-cart-drawer,btg-header'
      })
    })
      .then(function (r) {
        return r.json().then(function (data) { return { ok: r.ok, data: data }; });
      })
      .then(function (res) {
        if (!res.ok) {
          // e.g. not enough stock — show Shopify's own message.
          showError((res.data && (res.data.description || res.data.message)) || 'Something went wrong. Please try again.');
          return;
        }
        setLabels('Added');
        document.dispatchEvent(new CustomEvent('btg:cart:refresh', { detail: { sections: res.data.sections || {} } }));
        window.setTimeout(resetButtons, 1200);
      })
      .catch(function () {
        showError('Connection problem. Please try again.');
      });
  });
})();
