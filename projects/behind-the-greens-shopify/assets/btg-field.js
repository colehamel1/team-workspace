/* Behind The Greens — From The Field.
   Arrow buttons page the track on desktop. Cards with a Shopify-hosted
   preview clip play it muted on hover (desktop only), loading it on first
   hover and resetting on leave. Touch devices never autoplay. */
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
