/* Behind The Greens — branded entrance. Shows once per browser session,
   never blocks the real page, and disappears itself on click, key press,
   or a short timeout. */
(function () {
  var el = document.querySelector('[data-btg-entrance]');
  if (!el) return;

  var SEEN_KEY = 'btg_entrance_seen';
  var seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) { /* storage unavailable — always show once */ }

  if (seen) {
    el.hidden = true;
    return;
  }

  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* ignore */ }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function dismiss() {
    if (el.hidden) return;
    el.classList.add('btg-entrance--out');
    setTimeout(function () { el.hidden = true; }, reduceMotion ? 0 : 650);
  }

  el.addEventListener('click', dismiss);
  document.addEventListener('keydown', dismiss, { once: true });

  setTimeout(dismiss, reduceMotion ? 400 : 2000);
})();
