/* Behind The Greens — email capture popup. Shows once per browser
   session, after a delay or on scroll past the hero, whichever comes
   first. Never reappears once shown (dismissed or submitted) in the
   same session. */
(function () {
  var root = document.querySelector('[data-btg-popup]');
  var wrap = root ? root.closest('.btg-scope') : null;
  if (!root || !wrap) return;

  var SEEN_KEY = 'btg_popup_seen';
  var seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) { /* ignore */ }
  if (seen) return;

  var scrim = document.querySelector('[data-btg-popup-scrim]');
  var delaySeconds = parseInt(wrap.getAttribute('data-btg-popup-delay'), 10) || 6;
  var shown = false;

  function markSeen() {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* ignore */ }
  }

  function open() {
    if (shown) return;
    shown = true;
    markSeen();
    root.hidden = false;
    if (scrim) scrim.hidden = false;
    requestAnimationFrame(function () {
      root.classList.add('is-open');
      root.setAttribute('aria-hidden', 'false');
      if (scrim) scrim.classList.add('is-visible');
    });
    window.removeEventListener('scroll', onScroll);
  }

  function close() {
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    if (scrim) scrim.classList.remove('is-visible');
    setTimeout(function () {
      root.hidden = true;
      if (scrim) scrim.hidden = true;
    }, 300);
  }

  function onScroll() {
    if (window.scrollY > window.innerHeight * 0.6) open();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  var timer = setTimeout(open, delaySeconds * 1000);

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-btg-popup-close]') || e.target.closest('[data-btg-popup-scrim]')) {
      clearTimeout(timer);
      close();
    }
  });
})();
