/* Behind The Greens — email capture popup. Shows once per browser
   session, a short fixed delay after landing. Never reappears once
   shown (dismissed) in the same session — EXCEPT immediately after a
   real, successful email submission, when it force-reopens so the
   visitor actually sees the code they just unlocked. */
(function () {
  var root = document.querySelector('[data-btg-popup]');
  var wrap = root ? root.closest('.btg-scope') : null;
  if (!root || !wrap) return;

  var SEEN_KEY = 'btg_popup_seen';
  var justSucceeded = !!document.querySelector('[data-btg-popup-success]');

  var seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) { /* ignore */ }

  var scrim = document.querySelector('[data-btg-popup-scrim]');
  var delaySeconds = parseInt(wrap.getAttribute('data-btg-popup-delay'), 10) || 4;

  function markSeen() {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* ignore */ }
  }

  function open() {
    markSeen();
    root.hidden = false;
    if (scrim) scrim.hidden = false;
    requestAnimationFrame(function () {
      root.classList.add('is-open');
      root.setAttribute('aria-hidden', 'false');
      if (scrim) scrim.classList.add('is-visible');
    });
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

  if (justSucceeded) {
    open();
  } else if (!seen) {
    setTimeout(open, delaySeconds * 1000);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-btg-popup-close]') || e.target.closest('[data-btg-popup-scrim]')) {
      close();
    }
  });
})();
