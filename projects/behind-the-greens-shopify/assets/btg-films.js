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
    var img = poster.querySelector('[data-btg-stage-img]');
    var noEl = poster.querySelector('[data-btg-stage-no]');
    var courseEl = poster.querySelector('[data-btg-stage-course]');
    var placeEl = poster.querySelector('[data-btg-stage-place]');
    var fallbackSrc = img ? img.getAttribute('src') : '';

    function closePlayer() {
      var p = stage.querySelector('.btg-films__player');
      if (p) p.remove();
      poster.hidden = false;
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

    poster.addEventListener('click', function (e) {
      var id = poster.getAttribute('data-video-id');
      if (!id) return; // no film id yet: follow the link to the channel
      e.preventDefault();
      poster.hidden = true;
      stage.appendChild(playerFor(id, courseEl ? courseEl.textContent : ''));
    });

    section.addEventListener('click', function (e) {
      var card = e.target.closest('[data-btg-film-select]');
      if (!card || !section.contains(card)) return;
      e.preventDefault();
      closePlayer();

      section.querySelectorAll('[data-btg-film-select]').forEach(function (c) {
        c.classList.toggle('is-active', c === card);
        if (c === card) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
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
      stage.classList.remove('is-swapping');
      void stage.offsetWidth; // restart the crossfade
      stage.classList.add('is-swapping');

      // On phones the strip sits below the stage: bring the stage into view.
      if (window.matchMedia('(max-width: 860px)').matches) {
        var top = stage.getBoundingClientRect().top;
        if (top < 60) window.scrollBy({ top: top - 80, behavior: 'smooth' });
      }
    });
  });
})();
