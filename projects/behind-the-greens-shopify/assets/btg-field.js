/* Behind The Greens — From The Field.
   Arrow buttons page the track on desktop. Cards with a Shopify-hosted
   preview clip play it muted on hover (desktop only), loading it on first
   hover and resetting on leave. Touch devices never autoplay.
   YouTube Shorts cards open an on-site vertical viewer. The player iframe
   is created only inside the tap and removed on close (which stops sound).
   Cmd/Ctrl/Shift/middle-click still opens YouTube in a new tab. */
(function () {
  var sections = document.querySelectorAll('[data-btg-field]');
  var canHover = window.matchMedia('(hover: hover)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.prototype.forEach.call(sections, function (section) {
    var track = section.querySelector('[data-btg-field-track]');
    var prev = section.querySelector('[data-btg-field-prev]');
    var next = section.querySelector('[data-btg-field-next]');
    if (!track) return;

    function page(dir) {
      var item = track.querySelector('.btg-field__item');
      var step = item ? item.getBoundingClientRect().width + 16 : 300;
      var perView = Math.max(1, Math.floor(track.clientWidth / step) - 1);
      track.scrollBy({ left: dir * step * perView, behavior: reduce ? 'auto' : 'smooth' });
    }
    function sync() {
      if (!prev || !next) return;
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    if (prev) prev.addEventListener('click', function () { page(-1); });
    if (next) next.addEventListener('click', function () { page(1); });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();

    var viewer = section.querySelector('[data-btg-field-viewer]');
    if (viewer) {
      // Lift the overlay to <body> so no transformed/clipped theme wrapper
      // can trap its fixed positioning.
      document.body.appendChild(viewer);
      var frame = viewer.querySelector('[data-btg-field-frame]');
      var closeBtn = viewer.querySelector('.btg-field-viewer__close');
      var out = viewer.querySelector('[data-btg-field-out]');
      var opener = null;
      var lastOverflow = '';

      function open(card) {
        var id = card.getAttribute('data-btg-short');
        if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return false;
        opener = card;
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&playsinline=1&rel=0&modestbranding=1';
        iframe.title = 'YouTube Shorts player';
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        frame.innerHTML = '';
        frame.appendChild(iframe);
        out.href = 'https://www.youtube.com/shorts/' + id;
        viewer.hidden = false;
        lastOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        requestAnimationFrame(function () { viewer.classList.add('is-open'); });
        closeBtn.focus();
        document.addEventListener('keydown', onKey);
        return true;
      }
      function close() {
        if (viewer.hidden) return;
        viewer.classList.remove('is-open');
        frame.innerHTML = '';
        viewer.hidden = true;
        document.documentElement.style.overflow = lastOverflow;
        document.removeEventListener('keydown', onKey);
        if (opener) opener.focus();
        opener = null;
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key === 'Tab') {
          // Keep focus inside the viewer: close button <-> "Watch on YouTube".
          if (e.shiftKey && document.activeElement === closeBtn) { e.preventDefault(); out.focus(); }
          else if (!e.shiftKey && document.activeElement === out) { e.preventDefault(); closeBtn.focus(); }
        }
      }
      track.addEventListener('click', function (e) {
        var card = e.target.closest('[data-btg-short]');
        if (!card || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (open(card)) e.preventDefault();
      });
      Array.prototype.forEach.call(viewer.querySelectorAll('[data-btg-field-close]'), function (el) {
        el.addEventListener('click', close);
      });
    }

    if (!canHover || reduce) return;
    Array.prototype.forEach.call(track.querySelectorAll('[data-preview]'), function (card) {
      var video = null;
      card.addEventListener('mouseenter', function () {
        if (!video) {
          video = document.createElement('video');
          video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
          video.setAttribute('aria-hidden', 'true');
          video.src = card.getAttribute('data-preview');
          card.insertBefore(video, card.querySelector('.btg-field__shade'));
        }
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
        card.classList.add('is-previewing');
      });
      card.addEventListener('mouseleave', function () {
        if (!video) return;
        video.pause();
        try { video.currentTime = 0; } catch (e) { /* ignore */ }
        card.classList.remove('is-previewing');
      });
    });
  });
})();
