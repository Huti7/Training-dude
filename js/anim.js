/* Drawn exercise animations for moves with no photo.
   Each animation = scene + 2-3 key poses (joint coords in a 300x200 box).
   Timing matches the photo "smooth loop": start · move · hold · return (2.6 s). */
(function () {
  const POSES = {
    "smith-curl": {
      scene: { rail: 168 },
      equip: "barEnd",
      keys: [
        { h: [150, 38], s: [150, 62], e: [150, 96], w: [166, 126], hp: [150, 122], k: [151, 158], a: [150, 192], t: [164, 194] },
        { h: [150, 38], s: [150, 62], e: [146, 94], w: [166, 64], hp: [150, 122], k: [151, 158], a: [150, 192], t: [164, 194] }
      ]
    },
    "hyper-side-bend": {
      scene: { pad: [[118, 152], [150, 120], [160, 130], [128, 162]], frame: [[139, 146], [139, 196]], roller: [94, 188] },
      equip: null, view: "front",
      keys: [
        { h: [192, 82], s: [176, 100], e: [171, 117], w: [168, 103], hp: [140, 140], k: [118, 164], a: [98, 186], t: [92, 194] },
        { h: [216, 124], s: [193, 129], e: [179, 140], w: [184, 126], hp: [140, 140], k: [118, 164], a: [98, 186], t: [92, 194] },
        { h: [211, 173], s: [189, 163], e: [171, 163], w: [183, 156], hp: [140, 140], k: [118, 164], a: [98, 186], t: [92, 194] }
      ]
    },
    "incline-cable-pullover": {
      scene: { bench: [[70, 108], [162, 152], [200, 152]], benchLegs: [[90, 120, 196], [190, 152, 196]], stack: [10, 24], cable: [22, 176] },
      equip: "barEnd",
      keys: [
        { h: [87, 105], s: [108, 116], e: [80, 98], w: [56, 84], hp: [160, 142], k: [188, 134], a: [198, 180], t: [210, 184] },
        { h: [87, 105], s: [108, 116], e: [110, 86], w: [112, 58], hp: [160, 142], k: [188, 134], a: [198, 180], t: [210, 184] },
        { h: [87, 105], s: [108, 116], e: [134, 104], w: [160, 118], hp: [160, 142], k: [188, 134], a: [198, 180], t: [210, 184] }
      ]
    },
    "bayesian": {
      scene: { stack: [20, 36], cable: [36, 140] },
      equip: "handle",
      keys: [
        { h: [160, 40], s: [156, 64], e: [146, 96], w: [126, 122], hp: [150, 122], k: [166, 156], a: [170, 192], t: [184, 194], k2: [138, 160], a2: [124, 190], t2: [136, 194] },
        { h: [160, 40], s: [156, 64], e: [147, 96], w: [150, 128], hp: [150, 122], k: [166, 156], a: [170, 192], t: [184, 194], k2: [138, 160], a2: [124, 190], t2: [136, 194] },
        { h: [160, 40], s: [156, 64], e: [148, 96], w: [176, 80], hp: [150, 122], k: [166, 156], a: [170, 192], t: [184, 194], k2: [138, 160], a2: [124, 190], t2: [136, 194] }
      ]
    }
  };

  const ease = x => (x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  function phase(now) {
    const p = (now % 2600) / 2600;
    if (p < .15) return 0;
    if (p < .45) return ease((p - .15) / .3);
    if (p < .65) return 1;
    if (p < .95) return ease(1 - (p - .65) / .3);
    return 0;
  }
  function poseAt(keys, u) {
    const n = keys.length - 1, x = Math.min(u * n, n - 1e-6), i = Math.floor(x), f = x - i;
    const a = keys[i], b = keys[i + 1], o = {};
    for (const k in a) o[k] = [a[k][0] + (b[k][0] - a[k][0]) * f, a[k][1] + (b[k][1] - a[k][1]) * f];
    return o;
  }
  function draw(cv, id, u) {
    const def = POSES[id]; if (!def) return;
    const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    const W = Math.round(r.width * d), H = Math.round(r.height * d);
    if (!W || !H) return;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const c = cv.getContext("2d");
    // fit 300x200 into canvas (contain)
    const s = Math.min(W / 300, H / 200), ox = (W - 300 * s) / 2, oy = (H - 200 * s) / 2;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    c.setTransform(s, 0, 0, s, ox, oy);
    const p = poseAt(def.keys, u), sc = def.scene || {};
    const fig = "#ffffff", dim = "rgba(255,255,255,.4)", eq = "#d4ff00", gear = "rgba(255,255,255,.16)";
    c.lineCap = "round"; c.lineJoin = "round";
    // floor
    c.strokeStyle = "rgba(255,255,255,.12)"; c.lineWidth = 2; c.beginPath(); c.moveTo(14, 196); c.lineTo(286, 196); c.stroke();
    // scene
    if (sc.rail) { c.strokeStyle = gear; c.lineWidth = 4; c.beginPath(); c.moveTo(sc.rail, 10); c.lineTo(sc.rail, 196); c.stroke(); }
    if (sc.stack) { c.fillStyle = gear; c.fillRect(sc.stack[0], 14, sc.stack[1] - sc.stack[0], 182); }
    if (sc.bench) {
      c.strokeStyle = "rgba(255,255,255,.22)"; c.lineWidth = 8; c.beginPath(); c.moveTo(...sc.bench[0]); sc.bench.slice(1).forEach(q => c.lineTo(...q)); c.stroke();
      c.lineWidth = 4; (sc.benchLegs || []).forEach(l => { c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[0], l[2]); c.stroke(); });
    }
    if (sc.pad) { c.fillStyle = "rgba(255,255,255,.2)"; c.beginPath(); c.moveTo(...sc.pad[0]); sc.pad.slice(1).forEach(q => c.lineTo(...q)); c.closePath(); c.fill(); }
    if (sc.frame) { c.strokeStyle = gear; c.lineWidth = 4; c.beginPath(); c.moveTo(...sc.frame[0]); c.lineTo(...sc.frame[1]); c.stroke(); }
    if (sc.roller) { c.fillStyle = "rgba(255,255,255,.25)"; c.beginPath(); c.arc(sc.roller[0], sc.roller[1], 6, 0, 7); c.fill(); }
    if (sc.cable) { c.strokeStyle = "rgba(255,255,255,.4)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(...p.w); c.lineTo(...sc.cable); c.stroke(); c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.arc(sc.cable[0], sc.cable[1], 4, 0, 7); c.fill(); }
    const seg = (pts, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(...pts[0]); pts.slice(1).forEach(q => c.lineTo(...q)); c.stroke(); };
    if (p.k2) seg([p.hp, p.k2, p.a2, p.t2], 9, dim);
    seg([p.hp, p.k, p.a, p.t], 10, fig);
    seg([p.s, p.hp], 13, fig);
    seg([p.s, p.e, p.w], 8, fig);
    c.fillStyle = fig; c.beginPath(); c.arc(p.h[0], p.h[1], 12, 0, 7); c.fill();
    // equipment
    c.fillStyle = eq;
    if (def.equip === "barEnd") { c.beginPath(); c.arc(p.w[0], p.w[1], 7, 0, 7); c.fill(); c.fillStyle = "#000000"; c.beginPath(); c.arc(p.w[0], p.w[1], 2.5, 0, 7); c.fill(); }
    else if (def.equip === "handle") { c.save(); c.translate(...p.w); c.fillRect(-3, -9, 6, 18); c.restore(); }
  }

  const live = new Set();
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => e.target._vis = e.isIntersecting), { rootMargin: "100px" }) : null;
  let paused = false;
  function loop(now) {
    if (!paused) {
      const u = phase(now);
      live.forEach(cv => { if (!cv.isConnected) { live.delete(cv); io && io.unobserve(cv); return; } if (!io || cv._vis) draw(cv, cv.dataset.anim, u); });
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.Anim = {
    has: id => !!POSES[id],
    mountAll(root) {
      (root || document).querySelectorAll("canvas[data-anim]:not([data-live])").forEach(cv => {
        cv.dataset.live = "1"; live.add(cv); if (io) io.observe(cv); else cv._vis = true;
        draw(cv, cv.dataset.anim, 0);
      });
    },
    setPaused(v) { paused = v; }
  };
})();
