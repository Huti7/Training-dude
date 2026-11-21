/* Streak — counts workouts done in a row and plays the weekly streak celebration.
   A training day you miss breaks the streak; planned rest days never do. */
(function () {
  const WK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const shift = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const wk = s => WK[parse(s).getDay()];
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** days: {"YYYY-MM-DD": dayKey}; isTraining(weekdayKey) → bool. Returns {count, start}. */
  function compute(days, isTraining, today) {
    const keys = Object.keys(days || {}).sort();
    if (!keys.length) return { count: 0, start: null };
    const min = keys[0];
    let d = today, count = 0, start = null;
    for (let i = 0; i < 1500 && d >= min; i++, d = shift(d, -1)) {
      if (days[d]) { count++; start = d; }
      else if (d === today || !isTraining(wk(d))) continue;   // today is still open; rest days are free
      else break;                                               // a missed training day ends it
    }
    return { count, start };
  }
  /** Monday-to-Sunday of the current week with a state per day. */
  function week(days, isTraining, today) {
    const t = parse(today), mon = shift(today, -((t.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = shift(mon, i), train = isTraining(wk(d));
      const state = days[d] ? "done" : d > today ? (train ? "future" : "future rest") : d === today ? "open" : train ? "miss" : "rest";
      return { iso: d, label: "MTWTFSS"[i], state, today: d === today };
    });
  }

  const FLAME = (id, cls = "") => `<svg class="${cls}" viewBox="0 0 120 150" aria-hidden="true"><defs>
    <linearGradient id="${id}a" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4d1a"/><stop offset=".55" stop-color="#ff8a1a"/><stop offset="1" stop-color="#ffc21a"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9d1a"/><stop offset="1" stop-color="#ffe066"/></linearGradient>
    <linearGradient id="${id}c" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6cc"/><stop offset="1" stop-color="#ffe680"/></linearGradient></defs>
    <path class="f1" fill="url(#${id}a)" d="M60 4C70 28 104 48 104 92c0 32-20 52-44 52S16 124 16 92c0-22 12-36 22-52 4 16 10 22 16 22-4-20-2-40 6-58z"/>
    <path class="f2" fill="url(#${id}b)" d="M62 46c6 18 28 32 28 58 0 22-14 34-30 34s-30-12-30-32c0-14 8-22 14-32 2 10 6 14 10 14-2-14 2-30 8-42z"/>
    <path class="f3" fill="url(#${id}c)" d="M60 86c4 10 16 18 16 32 0 12-8 18-16 18s-16-6-16-18c0-8 4-12 8-18 1 5 3 7 5 7-1-8 1-15 3-21z"/></svg>`;
  const SMALL = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.5c1.6 4 6.8 6.6 6.8 13.1 0 4.6-3 7.9-6.8 7.9s-6.8-3.3-6.8-7.6c0-3.4 1.9-5.6 3.4-8 .6 2.5 1.6 3.4 2.5 3.4-.6-3.1-.3-6.2.9-8.8z"/></svg>`;
  const CHECK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  let uid = 0;
  /** opts: {from, to, best, week:[...], next:"Thu"}; from<to plays the increment. */
  function show(opts) {
    document.querySelectorAll(".stk").forEach(x => x.remove());
    const { from = 0, to = 0, best = 0, next } = opts, wkd = opts.week || [], gain = to > from, id = "stk" + (++uid);
    const ti = wkd.findIndex(d => d.today), startIdx = (() => {
      if (!to || !opts.start) return ti;
      const i = wkd.findIndex(d => d.iso >= opts.start); return i < 0 ? ti : Math.min(i, ti);
    })();
    const pct = i => (i / 6) * 100;
    const el = document.createElement("div");
    el.className = "stk" + (gain ? " gain" : "") + (reduce() ? " still" : "");
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", `${to} day streak`);
    el.innerHTML = `
      <div class="stk-glow"></div><div class="stk-embers">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 5) * .45}s;--s:${.6 + (i % 4) * .25}"></i>`).join("")}</div>
      <div class="stk-card">
        <div class="stk-fire">${FLAME(id, "stk-flame")}<div class="stk-burst"></div></div>
        <div class="stk-num"><b data-n>${gain ? from : to}</b><span>day streak</span></div>
        <p class="stk-msg" ${gain ? 'data-msg' : ""}>${to === 0 ? "Finish a workout to light your streak." : gain ? "Workout complete. Lighting up today…" : `${to} workout${to === 1 ? "" : "s"} in a row. Keep it going!`}</p>
        <div class="stk-week">
          <div class="stk-track"><i class="stk-fill" style="left:${pct(startIdx)}%;width:${gain ? Math.max(0, pct(Math.max(startIdx, ti - 1)) - pct(startIdx)) : pct(ti) - pct(startIdx)}%"></i></div>
          ${wkd.map((d, i) => { const st = gain && d.today ? "open pending" : d.state.replace(" ", " is-"); return `<div class="stk-day ${st} ${d.today ? "today" : ""}" style="--i:${i}">
              <span class="stk-l">${d.label}</span>
              <span class="stk-c">${st === "done" ? SMALL : st === "miss" ? "×" : /rest/.test(st) ? "<em>Rest</em>" : ""}</span></div>`; }).join("")}
        </div>
        <div class="stk-foot"><span>Best <b>${Math.max(best, to)}</b></span>${next ? `<span>Next workout <b>${next}</b></span>` : ""}</div>
        <button class="btn primary stk-go" type="button">Continue</button>
      </div>`;
    document.body.appendChild(el);
    const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 260); document.removeEventListener("keydown", key); };
    const key = e => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    el.querySelector(".stk-go").addEventListener("click", close);
    el.addEventListener("click", e => { if (e.target === el) close(); });
    requestAnimationFrame(() => el.classList.add("in"));
    setTimeout(() => el.querySelector(".stk-go").focus({ preventScroll: true }), 50);
    if (!gain) return el;

    // the chain reaction: line reaches today → today lights → a flame flies to the counter → burst → number ticks up
    const still = reduce(), T = still ? [0, 0, 0] : [900, 1500, 2150];
    const fill = el.querySelector(".stk-fill"), today = el.querySelector(".stk-day.today"), num = el.querySelector("[data-n]");
    setTimeout(() => { fill.style.width = (pct(ti) - pct(startIdx)) + "%"; }, T[0]);
    setTimeout(() => {
      today.classList.remove("pending", "open"); today.classList.add("lit");
      today.querySelector(".stk-c").innerHTML = SMALL;
      if (still) return;
      const a = today.querySelector(".stk-c").getBoundingClientRect(), b = num.getBoundingClientRect();
      const fly = document.createElement("div"); fly.className = "stk-fly"; fly.innerHTML = SMALL; document.body.appendChild(fly);
      const sx = a.left + a.width / 2, sy = a.top + a.height / 2, ex = b.left + b.width / 2, ey = b.top + b.height / 2;
      fly.animate([
        { transform: `translate(${sx}px,${sy}px) translate(-50%,-50%) scale(.6)`, opacity: 0 },
        { transform: `translate(${(sx + ex) / 2 + 60}px,${Math.min(sy, ey) - 70}px) translate(-50%,-50%) scale(1.5)`, opacity: 1, offset: .5 },
        { transform: `translate(${ex}px,${ey}px) translate(-50%,-50%) scale(.9)`, opacity: 1 }
      ], { duration: T[2] - T[1], easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => fly.remove();
    }, T[1]);
    setTimeout(() => {
      el.classList.add("hit");
      const msg = el.querySelector("[data-msg]"); if (msg) msg.textContent = to === 1 ? "Streak started. Come back next training day!" : `You're on fire — ${to} workouts in a row!`;
      let n = from; const step = () => { n++; num.textContent = n; num.classList.remove("pop"); void num.offsetWidth; num.classList.add("pop"); if (n < to) setTimeout(step, 90); };
      step();
    }, T[2]);
    return el;
  }

  window.Streak = { compute, week, show, flame: SMALL, CHECK, iso };
})();
