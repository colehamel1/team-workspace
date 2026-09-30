/* Behind The Greens — film archive.
   Selecting a course swaps the featured stage (thumbnail + title only).
   Pressing play swaps the thumbnail for a youtube-nocookie player, so no
   YouTube code loads until someone actually wants to watch. Films without
   a YouTube id fall through to their plain link (the channel). */
(function () {
  var sections = document.querySelectorAll('[data-btg-films]');
  if (!sections.length) return;

  function playerFor(id, title) {
    var wrap = document.createElement('div');
    wrap.className = 'btg-films__player';
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    iframe.title = title || 'Behind The Greens film';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    wrap.appendChild(iframe);
    return wrap;
  }

  Array.prototype.forEach.call(sections, function (section) {
    var stage = section.querySelector('[data-btg-films-stage]');
    var poster = stage && stage.querySelector('[data-btg-film-play]');
    if (!stage || !poster) return;
    var img = poster.querySelector('.btg-films__stage-img');
    var noEl = poster.querySelector('[data-btg-stage-no]');
    var courseEl = poster.querySelector('[data-btg-stage-course]');
    var placeEl = poster.querySelector('[data-btg-stage-place]');
    var fallbackSrc = img ? img.getAttribute('src') : '';

    var seen = section.querySelector('[data-btg-stage-seen]');
    function updateSeen(card) {
      if (!seen) return;
      var url = card.getAttribute('data-product-url');
      seen.hidden = !url;
      if (!url) return;
      seen.querySelector('[data-btg-seen-link]').setAttribute('href', url);
      seen.querySelector('[data-btg-seen-title]').textContent = card.getAttribute('data-product-title') || '';
      seen.querySelector('[data-btg-seen-price]').textContent = card.getAttribute('data-product-price') || '';
      var imgWrap = seen.querySelector('[data-btg-seen-img]');
      var src = card.getAttribute('data-product-img');
      imgWrap.innerHTML = '';
      if (src) {
        var im = document.createElement('img');
        im.src = src; im.alt = ''; im.width = 44; im.height = 44; im.loading = 'lazy';
        imgWrap.appendChild(im);
      }
    }

    function closePlayer() {
      var p = stage.querySelector('.btg-films__player');
      if (p) p.remove();
      poster.hidden = false;
      stage.classList.remove('is-playing');
    }

    // Preconnect to YouTube on first intent, so play starts fast.
    var warmed = false;
    function warm() {
      if (warmed) return;
      warmed = true;
      ['https://www.youtube-nocookie.com', 'https://i.ytimg.com'].forEach(function (href) {
        var l = document.createElement('link'); l.rel = 'preconnect'; l.href = href; document.head.appendChild(l);
      });
    }
    section.addEventListener('pointerover', warm, { once: true });
    section.addEventListener('focusin', warm, { once: true });

    function newTabClick(e) { return e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0; }

    poster.addEventListener('click', function (e) {
      var id = poster.getAttribute('data-video-id');
      if (!id || newTabClick(e)) return; // no film id, or opening in a new tab: follow the link
      e.preventDefault();
      poster.hidden = true;
      var player = playerFor(id, courseEl ? courseEl.textContent : '');
      stage.appendChild(player);
      stage.classList.add('is-playing');
      player.querySelector('iframe').focus();
    });

    // Warm the big thumbnail before the click so the swap never flashes.
    var preloaded = {};
    function preload(e) {
      var card = e.target.closest && e.target.closest('[data-btg-film-select]');
      var t = card && card.getAttribute('data-thumb');
      if (t && !preloaded[t]) { preloaded[t] = true; var im = new Image(); im.src = t; }
    }
    section.addEventListener('pointerover', preload, { passive: true });
    section.addEventListener('touchstart', preload, { passive: true });
    section.addEventListener('focusin', preload);

    section.addEventListener('click', function (e) {
      var card = e.target.closest('[data-btg-film-select]');
      if (!card || !section.contains(card) || newTabClick(e)) return;
      e.preventDefault();
      closePlayer();

      // The featured film leaves the row; the one it replaces returns to it.
      section.querySelectorAll('[data-btg-film-select]').forEach(function (c) {
        var item = c.closest('[data-btg-film-item]');
        var on = c === card;
        c.classList.toggle('is-active', on);
        if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
        if (item) item.hidden = on;
      });

      var id = card.getAttribute('data-video-id') || '';
      var thumb = card.getAttribute('data-thumb') || '';
      poster.setAttribute('data-video-id', id);
      poster.setAttribute('href', card.getAttribute('href'));
      poster.setAttribute('aria-label', 'Play ' + (card.getAttribute('data-course') || 'film'));
      if (noEl) noEl.textContent = card.getAttribute('data-no') || '';
      if (courseEl) courseEl.textContent = card.getAttribute('data-course') || '';
      if (placeEl) placeEl.textContent = card.getAttribute('data-place') || '';
      if (img) {
        img.removeAttribute('srcset');
        img.onerror = id ? function () { img.onerror = null; img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; } : null;
        img.src = thumb || fallbackSrc;
      }
      updateSeen(card);
      if (e.detail === 0) poster.focus({ preventScroll: true }); // keyboard: follow the film
      stage.classList.remove('is-swapping');
      void stage.offsetWidth; // restart the crossfade
      stage.classList.add('is-swapping');

      // On phones the strip sits below the stage: bring the stage into view.
      if (window.matchMedia('(max-width: 860px)').matches) {
        var top = stage.getBoundingClientRect().top;
        if (top < 60) window.scrollBy({ top: top - 80, behavior: 'smooth' });
      }
    });

    // Deep link: /?film=<youtube id>#watch-the-work opens on that film
    // (used by "Seen in the film" links on product pages).
    try {
      var want = new URLSearchParams(window.location.search).get('film');
      if (want) {
        var match = section.querySelector('[data-btg-film-select][data-video-id="' + want.replace(/[^A-Za-z0-9_-]/g, '') + '"]');
        if (match) match.click();
      }
    } catch (err) { /* ignore */ }
  });
})();
