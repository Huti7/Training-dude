/* Smart generator — rule-based, offline. Picks exercises for each day from the library
   using the person's goal, level, age, BMI, session time, equipment and injuries. */
(function () {
  const LIB = window.LIB;
  const BIG = ["Legs", "Back", "Chest", "Shoulders"];
  const CAP = { Legs: 4, Back: 4, Chest: 4, Shoulders: 3, Biceps: 3, Triceps: 3, Abs: 2, Traps: 2, Forearms: 2 };
  const WEIGHT = { Legs: 3, Back: 2.5, Chest: 2.5, Shoulders: 2, Biceps: 1.5, Triceps: 1.5, Abs: 1.2, Traps: .8, Forearms: .8 };
  const SLOTS = { 30: 4, 45: 5, 60: 7, 75: 8, 90: 10 };
  const LEVEL = { beginner: 1, intermediate: 2, advanced: 3 };
  const EQUIP_OK = { gym: ["gym", "db", "bw"], db: ["db", "bw"], bw: ["bw"] };
  const HARD_BW = ["wide-pullup", "dips", "hanging-leg-raise", "bench-dip"];
  const POST_IDS = ["leg-curl", "seated-leg-curl", "rdl", "db-deadlift", "glute-bridge", "single-glute-bridge", "hip-thrust", "db-sumo"];
  const CALF_IDS = ["smith-calf", "standing-calf", "db-calf"];
  // works for curated ids and for the auto-imported library (primary muscle "pm")
  const POSTERIOR = { includes: id => { const e = LIB.find(x => x.id === id); return POST_IDS.includes(id) || (!!e && (e.pm === "hamstrings" || e.pm === "glutes")); } };
  const CALF = { includes: id => { const e = LIB.find(x => x.id === id); return CALF_IDS.includes(id) || (!!e && e.pm === "calves"); } };
  const PART_ORDER = ["Legs", "Chest", "Back", "Shoulders", "Traps", "Biceps", "Triceps", "Forearms", "Abs", "Cardio"];
  const FULL_BODY = ["Legs", "Chest", "Back", "Shoulders", "Biceps", "Triceps", "Abs"];

  const bmi = p => p.weight && p.height ? p.weight / Math.pow(p.height / 100, 2) : 0;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const wantsCardio = p => ["lose", "recomp", "fit"].includes(p.goal);

  function allowed(e, p, strictLevel = true) {
    const lv = LEVEL[p.exp] || 2, inj = p.injuries || [], heavy = bmi(p) >= 30;
    if (!EQUIP_OK[p.equip || "gym"].includes(e.eq)) return false;
    if (e.j.some(j => inj.includes(j))) return false;
    if (strictLevel && e.lv > lv) return false;
    if ((p.exp === "beginner" || heavy) && HARD_BW.includes(e.id)) return false;
    if ((heavy || p.age >= 60) && e.id === "jog") return false;
    return true;
  }
  function pool(part, p) {
    let list = LIB.filter(e => e.muscle === part && allowed(e, p));
    if (!list.length) list = LIB.filter(e => e.muscle === part && allowed(e, p, false));
    return list;
  }
  function rx(e, p, idx = 0) {
    const unit = /\/ (leg|arm)/.exec(e.reps), per = unit ? " " + unit[0] : "";
    if (e.muscle === "Cardio") {
      const min = { lose: 25, recomp: 20, fit: 20, muscle: 10, strength: 10 }[p.goal] || 15;
      return { sets: 1, reps: min + " min" };
    }
    let reps;
    if (e.id === "plank") reps = p.exp === "beginner" ? "30–45 s" : "45–60 s";
    else if (e.muscle === "Abs") reps = "12–20";
    else {
      const t = {
        strength: ["4–6", "8–10"], muscle: ["6–10", "10–15"], lose: ["8–12", "12–15"], recomp: ["8–12", "12–15"], fit: ["10–12", "12–15"]
      }[p.goal] || ["8–12", "12–15"];
      reps = (e.eq === "bw" && p.goal === "strength" ? "6–10" : (e.c ? t[0] : t[1])) + per;
    }
    let sets = e.c ? (p.exp === "advanced" ? 4 : 3) : (p.exp === "beginner" ? 2 : 3);
    if (e.c && p.goal === "strength" && idx < 2) sets = Math.min(5, sets + 1);
    if (p.age >= 50) sets = Math.max(2, sets - 1);
    return { sets, reps };
  }
  // how many exercises each part gets on a day
  function allocate(parts, n) {
    const ps = parts.filter(x => x !== "Cardio");
    if (!ps.length) return {};
    let keep = [...ps].sort((a, b) => (WEIGHT[b] || 1) - (WEIGHT[a] || 1));
    if (keep.length > n) keep = keep.slice(0, n);
    const out = Object.fromEntries(keep.map(k => [k, 1]));
    let left = n - keep.length;
    const tot = keep.reduce((a, k) => a + (WEIGHT[k] || 1), 0);
    const want = keep.map(k => ({ k, r: (WEIGHT[k] || 1) / tot * left }));
    want.forEach(w => { out[w.k] += Math.floor(w.r); w.r -= Math.floor(w.r); });
    left = n - Object.values(out).reduce((a, b) => a + b, 0);
    want.sort((a, b) => b.r - a.r).slice(0, left).forEach(w => out[w.k]++);
    let spill = 0; keep.forEach(k => { const c = CAP[k] || 2; if (out[k] > c) { spill += out[k] - c; out[k] = c; } });
    for (const k of keep) { while (spill > 0 && out[k] < (CAP[k] || 2)) { out[k]++; spill--; } }
    return out;
  }
  function pickFor(part, k, p, avoid, used) {
    const list = pool(part, p).filter(e => !used.has(e.id));
    const lv = LEVEL[p.exp] || 2;
    const score = e => Math.random() + (avoid.has(e.id) ? 1.5 : 0)
      + (p.equip !== "bw" && e.eq === "bw" && lv > 1 ? .7 : 0)       // in a gym, bodyweight moves are a last resort
      + (lv === 3 && e.lv === 1 && e.c ? .4 : 0)                        // advanced: prefer harder compounds
      + (String(e.id).startsWith("x-") ? .3 : 0);                        // slight preference for the core list
    const ranked = shuffle(list).map(e => ({ e, s: score(e) })).sort((a, b) => a.s - b.s).map(x => x.e);
    const out = [];
    const take = pred => { const i = ranked.findIndex(e => pred(e) && !out.includes(e)); if (i > -1) out.push(ranked[i]); };
    if (BIG.includes(part)) take(e => e.c && !(part === "Legs" && (POSTERIOR.includes(e.id) || CALF.includes(e.id))));
    if (part === "Legs" && k >= 2) take(e => POSTERIOR.includes(e.id));
    if (part === "Legs" && k >= 4) take(e => CALF.includes(e.id));
    if (BIG.includes(part) && part !== "Legs" && k >= 3) take(e => !e.c);
    while (out.length < k) { const before = out.length; take(() => true); if (out.length === before) break; }
    return out.slice(0, k);
  }
  function order(list) {
    const rank = e => (e.muscle === "Cardio" ? 900 : e.muscle === "Abs" ? 800 : 0) + (e.c ? 0 : 100) + PART_ORDER.indexOf(e.muscle) * 2 + (BIG.includes(e.muscle) ? 0 : 50);
    return [...list].sort((a, b) => rank(a) - rank(b));
  }
  function buildDay(parts, p, avoid, used) {
    const n = SLOTS[p.minutes] || 7, alloc = allocate(parts, n), picked = [], warn = [];
    Object.keys(alloc).sort((a, b) => PART_ORDER.indexOf(a) - PART_ORDER.indexOf(b)).forEach(part => {
      const got = pickFor(part, alloc[part], p, avoid, used);
      if (!got.length) warn.push(part);
      got.forEach(e => { used.add(e.id); picked.push(e); });
    });
    if (parts.includes("Cardio")) {
      const c = pool("Cardio", p); if (c.length) picked.push(shuffle(c)[0]); else warn.push("Cardio");
    }
    return { ex: order(picked).map((e, i) => ({ id: e.id, ...rx(e, p, i), ss: false })), warn };
  }
  function beginnerDay(p) {
    const used = new Set(), out = [], n = SLOTS[p.minutes] || 7;
    const plan = [["Legs", e => e.c && !POSTERIOR.includes(e.id)], ["Chest", e => e.c], ["Back", e => e.c], ["Shoulders", () => true], ["Abs", () => true], ["Legs", e => POSTERIOR.includes(e.id)], ["Biceps", () => true], ["Triceps", () => true], ["Back", () => true], ["Legs", e => CALF.includes(e.id)]];
    for (const [part, pred] of plan) {
      if (out.length >= n) break;
      const c = shuffle(pool(part, p).filter(e => !used.has(e.id)));
      const e = c.find(pred) || c[0]; if (e) { used.add(e.id); out.push(e); }
    }
    if (wantsCardio(p)) { const c = pool("Cardio", p); if (c.length) out.push(shuffle(c)[0]); }
    return order(out).map((e, i) => ({ id: e.id, ...rx(e, p, i), ss: false }));
  }

  window.Gen = {
    FULL_BODY, allowed, bmi, wantsCardio,
    /** days: {mon:[parts]}; returns {ex:{mon:[...]}, warn:[...]} */
    generate(p, days, avoidIds) {
      const avoid = new Set(avoidIds || []), ex = {}, warn = [];
      if (p.exp === "beginner") {
        const day = beginnerDay(p);
        Object.keys(days).forEach(k => ex[k] = JSON.parse(JSON.stringify(day)));
        return { ex, warn };
      }
      const used = new Set(); // no exercise repeated in the same week
      Object.keys(days).forEach(k => {
        const r = buildDay(days[k], p, avoid, used); ex[k] = r.ex;
        r.warn.forEach(w => warn.push(w));
      });
      return { ex, warn: [...new Set(warn)] };
    },
    generateDay(p, parts, avoidIds, usedIds) {
      if (p.exp === "beginner") return beginnerDay(p);
      return buildDay(parts, p, new Set(avoidIds || []), new Set(usedIds || [])).ex;
    },
    beginnerParts: p => FULL_BODY.concat(wantsCardio(p) ? ["Cardio"] : [])
  };
})();
