/* Behind The Greens — Clock In.
   A small crew time clock. Shows the visitor's local time (or a pinned time
   from data-fixed). Tap: short punch animation (~700ms), then
   "CLOCKED IN — time" and an "On The Job" status in the header for the
   session. Tap again to clock out. A very quiet synthesized "clunk" plays
   only after the tap (no audio files, never autoplay). Reduced motion: no
   animation, no sound. */
(function () {
  var root = document.querySelector('[data-btg-clock]');
  if (!root) return;
  var btn = root.querySelector('[data-btg-clock-btn]');
  var timeEl = root.querySelector('[data-btg-clock-time]');
  var labelEl = root.querySelector('[data-btg-clock-label]');
  var statusEl = root.querySelector('[data-btg-clock-status]');
  var fixed = root.getAttribute('data-fixed');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'btg_clocked_in';

  function fmt(d) {
    var h = d.getHours(), m = d.getMinutes(), ap = h < 12 ? 'AM' : 'PM';
    h = h % 12 || 12;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }
  function now() { return fixed || fmt(new Date()); }

  function stored() { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { if (v) sessionStorage.setItem(KEY, v); else sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ } }

  function setHeader(on) {
    document.documentElement.classList.toggle('btg-on-the-job', !!on);
  }

  function render(clockedAt) {
    if (clockedAt) {
      root.classList.add('is-in');
      timeEl.textContent = clockedAt;
      labelEl.textContent = 'Clocked In';
      btn.setAttribute('aria-label', 'Clocked in at ' + clockedAt + '. Tap to clock out.');
    } else {
      root.classList.remove('is-in');
      timeEl.textContent = now();
      labelEl.textContent = 'Clock In';
      btn.setAttribute('aria-label', 'Clock in, ' + now());
    }
    setHeader(clockedAt);
  }

  // Live clock while not clocked in.
  function tick() { if (!root.classList.contains('is-in')) { timeEl.textContent = now(); } }
  if (!fixed) {
    var d = new Date();
    setTimeout(function () { tick(); setInterval(tick, 60000); }, (60 - d.getSeconds()) * 1000);
  }

  // One quiet mechanical clunk, synthesized. Created only inside the tap.
  var ctx = null;
  function clunk() {
    if (reduce) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = ctx || new AC();
      var t = ctx.currentTime;
      // low thump
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.09);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.13);
      // metallic click
      var len = Math.floor(ctx.sampleRate * 0.03), buf = ctx.createBuffer(1, len, ctx.sampleRate), ch = buf.getChannelData(0);
      for (var i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      var n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), ng = ctx.createGain();
      n.buffer = buf; f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 1.2; ng.gain.value = 0.05;
      n.connect(f); f.connect(ng); ng.connect(ctx.destination); n.start(t + 0.01);
    } catch (e) { /* sound is optional */ }
  }

  var busy = false;
  btn.addEventListener('click', function () {
    if (busy) return;
    var clockingIn = !root.classList.contains('is-in');
    var at = now();
    function finish() {
      store(clockingIn ? at : null);
      render(clockingIn ? at : null);
      statusEl.textContent = clockingIn ? 'Clocked in, ' + at + '. On the job.' : 'Clocked out, ' + at + '.';
      if (!clockingIn) { labelEl.textContent = 'Clocked Out'; setTimeout(function () { if (!root.classList.contains('is-in')) labelEl.textContent = 'Clock In'; }, 2400); }
      root.classList.remove('is-punching');
      busy = false;
    }
    clunk();
    if (reduce) { finish(); return; }
    busy = true;
    root.classList.add('is-punching');
    setTimeout(finish, 650);
  });

  render(stored());
})();
