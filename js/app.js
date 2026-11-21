/* Hutan Training — offline-first personal workout planner (local accounts). */
(function () {
  "use strict";

  /* ---------------- constants ---------------- */
  const DAYS = [
    { k: "mon", s: "Mon", l: "Monday" }, { k: "tue", s: "Tue", l: "Tuesday" }, { k: "wed", s: "Wed", l: "Wednesday" },
    { k: "thu", s: "Thu", l: "Thursday" }, { k: "fri", s: "Fri", l: "Friday" }, { k: "sat", s: "Sat", l: "Saturday" }, { k: "sun", s: "Sun", l: "Sunday" }
  ];
  const DAY = Object.fromEntries(DAYS.map(d => [d.k, d]));
  const PARTS = [
    { k: "Chest", c: "#fb7185" }, { k: "Back", c: "#38bdf8" }, { k: "Shoulders", c: "#fbbf24" }, { k: "Biceps", c: "#a3e635" },
    { k: "Triceps", c: "#a78bfa" }, { k: "Legs", c: "#34d399" }, { k: "Abs", c: "#f472b6" }, { k: "Forearms", c: "#fdba74" },
    { k: "Traps", c: "#60a5fa" }, { k: "Cardio", c: "#22d3ee" }
  ];
  const PC = Object.fromEntries(PARTS.map(p => [p.k, p.c]));
  const GOALS = [
    { k: "lose", t: "Lose fat", d: "Get leaner and keep your muscle" },
    { k: "muscle", t: "Build muscle", d: "Add size and shape" },
    { k: "recomp", t: "Lose fat & build muscle", d: "Recomposition — both at once" },
    { k: "strength", t: "Get stronger", d: "Lift heavier over time" },
    { k: "fit", t: "Stay fit & healthy", d: "Feel good, move well" }
  ];
  const GOAL = Object.fromEntries(GOALS.map(g => [g.k, g]));
  const EXPS = [
    { k: "beginner", t: "Beginner", d: "Under 6 months of training" },
    { k: "intermediate", t: "Intermediate", d: "6 months – 2 years" },
    { k: "advanced", t: "Advanced", d: "2+ years, confident with free weights" }
  ];
  const EXP = Object.fromEntries(EXPS.map(x => [x.k, x]));
  const EQUIPS = [{ k: "gym", t: "Full gym" }, { k: "db", t: "Dumbbells + bench" }, { k: "bw", t: "Bodyweight / home" }];
  const EQUIP = Object.fromEntries(EQUIPS.map(x => [x.k, x]));
  const INJ = [{ k: "sh", t: "Shoulder" }, { k: "kn", t: "Knee" }, { k: "bk", t: "Lower back" }, { k: "wr", t: "Wrist / elbow" }];
  const MINUTES = [30, 45, 60, 75, 90];
  const BLOCK_DAYS = 14, BEGINNER_DAYS = 28;
  const localISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const daysSince = iso => { if (!iso) return 0; const [y, m, d] = iso.split("-").map(Number); return Math.floor((new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) - new Date(y, m - 1, d)) / 864e5); };
  const addDays = (iso, n) => { const [y, m, d] = iso.split("-").map(Number); return localISO(new Date(y, m - 1, d + n)); };
  const withDefaults = p => ({ exp: "intermediate", minutes: 60, equip: "gym", injuries: [], ...p });
  const LIB = window.LIB, EX = Object.fromEntries(LIB.map(e => [e.id, e]));
  const TEMPLATE_DAYS = ["tue", "thu", "fri", "sat", "sun"];
  const LS = { users: "htg:users", session: "htg:session", user: id => "htg:u:" + id };

  /* ---------------- test mode: no sign-up, one local profile ---------------- */
  const TEST_MODE = true;

  /* ---------------- icons (inline SVG, stroke) ---------------- */
  const IC = {
    scale: '<path d="M12 3v3M5 7h14M7 7l-3 7a3 3 0 0 0 6 0L7 7zm10 0-3 7a3 3 0 0 0 6 0l-3-7zM12 6v14M8 21h8"/>',
    ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    download: '<path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/>',
    upload: '<path d="M12 21V9m0 0-5 5m5-5 5 5M4 3h16"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
    moon: '<path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10z"/>',
    flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
    sprout: '<path d="M12 21v-8M12 13c0-4 3-7 8-7 0 5-3 7-8 7zM12 15c0-3-2-5-6-5 0 4 2 5 6 5z"/>',
    up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'
  };
  const I = (n, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ""}</svg>`;

  /* ---------------- tiny helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const todayKey = () => ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
  const initials = n => (n || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { toast("Couldn't save — storage is full or blocked"); return false; } },
    del(k) { try { localStorage.removeItem(k); } catch {} }
  };
  function isoWeek(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + "-W" + String(Math.ceil(((t - y) / 864e5 + 1) / 7)).padStart(2, "0");
  }
  function parseSets(n) { n = parseInt(n, 10); return isNaN(n) ? 0 : Math.max(0, Math.min(n, 20)); }

  /* ---------------- hashing (WebCrypto with JS fallback) ---------------- */
  function sha256js(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    const mp = Math.pow, mw = mp(2, 32); let res = "", words = [], bl = ascii.length * 8, hash = [], k = [], pc = 0, ic = {};
    for (let c = 2; pc < 64; c++) { if (!ic[c]) { for (let i = 0; i < 313; i += c) ic[i] = c; hash[pc] = (mp(c, .5) * mw) | 0; k[pc++] = (mp(c, 1 / 3) * mw) | 0; } }
    hash = hash.slice(0, 8); ascii += "\x80"; while (ascii.length % 64 - 56) ascii += "\x00";
    for (let i = 0; i < ascii.length; i++) { const j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = ((bl / mw) | 0); words[words.length] = bl;
    for (let j = 0; j < words.length;) {
      const w = words.slice(j, j += 16), oh = hash; hash = hash.slice(0, 8);
      for (let i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        const t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0;
      }
      for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oh[i]) | 0;
    }
    for (let i = 0; i < 8; i++) for (let j = 3; j + 1; j--) { const b = (hash[i] >> (j * 8)) & 255; res += ((b < 16) ? 0 : "") + b.toString(16); }
    return res;
  }
  async function hash(pw, salt) {
    const input = salt + ":" + pw;
    try {
      if (window.crypto && crypto.subtle) {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
      }
    } catch {}
    return sha256js(unescape(encodeURIComponent(input)));
  }
  const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  /* ---------------- state ---------------- */
  let U = null;            // current user record
  const S = { screen: "auth", authTab: "signup", step: 1, wizDay: null, homeDay: null, menu: false };
  const app = $("#app");

  function users() { return store.get(LS.users, []); }
  function saveUser() { return U ? store.set(LS.user(U.id), U) : false; }
  function loadSession() {
    const id = store.get(LS.session, null); if (!id) return null;
    return store.get(LS.user(id), null);
  }

  /* ---------------- toast / modal ---------------- */
  let toastT;
  function toast(msg) {
    document.querySelectorAll(".toast").forEach(t => t.remove());
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
    clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2600);
  }
  function modal(html, onMount) {
    const o = document.createElement("div"); o.className = "overlay"; o.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    o.addEventListener("click", e => { if (e.target === o || e.target.closest("[data-close]")) o.remove(); });
    document.body.appendChild(o); onMount && onMount(o); const f = o.querySelector("input,select,button"); f && f.focus();
    return o;
  }
  function confirmBox(title, text, okLabel, danger) {
    return new Promise(res => {
      const o = modal(`<h3>${esc(title)}</h3><p class="muted">${esc(text)}</p><div class="foot"><button class="btn ghost" data-close>Cancel</button><button class="btn ${danger ? "danger" : "primary"}" data-ok>${esc(okLabel)}</button></div>`);
      o.querySelector("[data-ok]").onclick = () => { o.remove(); res(true); };
      o.addEventListener("click", e => { if (e.target === o || e.target.closest("[data-close]")) res(false); });
    });
  }

  /* ---------------- shared pieces ---------------- */
  const ambient = `<div class="ambient"><div class="blob a"></div><div class="blob b"></div><div class="blob c"></div></div>`;
  const brand = `<div class="brand"><div class="mark"><img src="icons/logo.svg" alt=""></div><div>Training Dude<small>PLAN · TRAIN · REPEAT</small></div></div>`;
  function media(ex) {
    if (ex.custom) {
      const ph = ex.photos || [];
      if (ph.length >= 2) return `<div class="media loop"><img src="${ph[0]}" alt=""><img src="${ph[1]}" alt="${esc(ex.name)}"></div>`;
      if (ph.length === 1) return `<div class="media"><img src="${ph[0]}" alt="${esc(ex.name)}"></div>`;
      return `<div class="media no-photo"><div>${I("dumbbell")}<span>${esc(ex.name)}</span></div></div>`;
    }
    if (ex.photo) return `<div class="media loop sp"><img src="img/x/${ex.photo}.jpg" alt="" loading="lazy" decoding="async"><img src="img/x/${ex.photo}.jpg" alt="${esc(ex.name)}" loading="lazy" decoding="async"></div>`;
    return `<div class="media"><canvas data-anim="${ex.anim}" aria-label="${esc(ex.name)} animation"></canvas><span class="drawn-badge">Animation</span></div>`;
  }
  const tag = p => `<span class="tag" style="--c:${PC[p]}">${esc(p)}</span>`;
  const setsReps = x => `${x.sets} × ${esc(x.reps)}`;
  function daySets(day) { return (day.ex || []).reduce((a, x) => a + parseSets(x.sets), 0); }

  const isFull = parts => Gen.FULL_BODY.every(x => parts.includes(x));
  const focusTags = parts => isFull(parts) ? `<span class="tag" style="--c:var(--lime)">Full body</span>${parts.includes("Cardio") ? " " + tag("Cardio") : ""}` : parts.map(tag).join(" ");
  const focusText = parts => isFull(parts) ? "Full body" + (parts.includes("Cardio") ? " + Cardio" : "") : parts.join(" + ");
  function weekTable(days, opts = {}) {
    const tk = todayKey(), goal = opts.goal || (U && U.profile || {}).goal;
    const groups = DAYS.map(d => {
      const day = days[d.k], isT = tk === d.k;
      if (!day) return `<tbody class="rest ${isT ? "today" : ""}"><tr class="dh"><th colspan="6"><div class="dh-in"><span class="dn">${d.l}</span>${isT ? `<span class="now">Today</span>` : ""}<span class="df">Rest day</span></div></th></tr></tbody>`;
      const rows = day.ex.map((x, i) => { const e = EX[x.id]; return `<tr>
          <td class="c-n">${String(i + 1).padStart(2, "0")}</td>
          <td class="c-e">${esc(e.name)}${x.ss ? `<span class="ssb">SS</span>` : ""}<small>${esc(e.muscle)}</small></td>
          <td class="c-m">${tag(e.muscle)}</td>
          <td class="c-s">${esc(x.sets)}</td><td class="c-r">${esc(x.reps)}</td><td class="c-t">${restFor(e, goal)}</td></tr>`; }).join("");
      return `<tbody class="${isT ? "today" : ""}"><tr class="dh"><th colspan="6"><div class="dh-in" ${opts.clickable ? `data-act="goto-day" data-day="${d.k}" role="button" tabindex="0"` : ""}>
          <span class="dn">${d.l}</span>${isT ? `<span class="now">Today</span>` : ""}<span class="df">${esc(focusText(day.parts))}</span>
          <span class="dt"><b>${day.ex.length}</b> ex · <b>${daySets(day)}</b> sets</span></div></th></tr>${rows}</tbody>`;
    }).join("");
    return `<div class="card wk"><div class="scroll"><table class="plan"><thead><tr><th class="c-n">#</th><th>Exercise</th><th class="c-m">Muscle</th><th class="c-s">Sets</th><th class="c-r">Reps</th><th class="c-t">Rest</th></tr></thead>${groups}</table></div></div>`;
  }


  /* ============================================================
     AUTH
     ============================================================ */
  function renderAuth() {
    const list = users();
    const isSign = S.authTab === "signup";
    app.innerHTML = ambient + `
    <div class="auth">
      <div class="auth-hero fade-in">
        ${brand}
        <h1 class="title-xl">Your training.<br><span class="grad">Your plan.</span></h1>
        <p class="muted" style="font-size:17px;max-width:460px;margin:0">Tell us about you, pick your days and body parts — and get a smart weekly plan with fresh exercises every 2 weeks and moving photos for every move.</p>
        <div class="feat">
          <div><b>${I("target")}</b>Weight, height and goal in one place</div>
          <div><b>${I("shuffle")}</b>New random exercises every 2 weeks</div>
          <div><b>${I("dumbbell")}</b>${LIB.length} exercises with looping photos</div>
          <div><b>${I("phone")}</b>Works offline — open it at the gym</div>
        </div>
      </div>
      <div class="auth-panel">
        <div class="card auth-card fade-in">
          <div class="tabs" role="tablist">
            <button class="${isSign ? "on" : ""}" data-act="auth-tab" data-tab="signup">Sign up</button>
            <button class="${!isSign ? "on" : ""}" data-act="auth-tab" data-tab="login">Log in</button>
          </div>
          ${isSign ? `
          <form id="signup" novalidate>
            <div class="field"><label for="su-name">Full name</label><input class="input" id="su-name" autocomplete="name" required></div>
            <div class="field"><label for="su-email">Email</label><input class="input" id="su-email" type="email" autocomplete="email" required></div>
            <div class="row2">
              <div class="field"><label for="su-pw">Password</label><input class="input" id="su-pw" type="password" autocomplete="new-password" minlength="6" required></div>
              <div class="field"><label for="su-pw2">Confirm</label><input class="input" id="su-pw2" type="password" autocomplete="new-password" required></div>
            </div>
            <div class="err" id="su-err"></div>
            <button class="btn primary block" type="submit">Create account →</button>
          </form>` : `
          ${list.length ? `<div class="muted" style="font-size:13px;font-weight:700;margin-bottom:8px">Accounts on this device</div><div class="acct-list">${list.map(u => `<button class="acct" type="button" data-act="pick-acct" data-email="${esc(u.email)}"><span class="avatar">${esc(initials(u.name))}</span><span><b>${esc(u.name)}</b><br><small class="muted">${esc(u.email)}</small></span></button>`).join("")}</div>` : ""}
          <form id="login" novalidate>
            <div class="field"><label for="li-email">Email</label><input class="input" id="li-email" type="email" autocomplete="username" required></div>
            <div class="field"><label for="li-pw">Password</label><input class="input" id="li-pw" type="password" autocomplete="current-password" required></div>
            <div class="err" id="li-err"></div>
            <button class="btn primary block" type="submit">Log in →</button>
          </form>`}
          <p class="note">Accounts are saved on this device only.</p>
        </div>
      </div>
    </div>`;
    const su = $("#signup"), li = $("#login");
    if (su) su.onsubmit = async e => {
      e.preventDefault();
      const name = $("#su-name").value.trim(), email = $("#su-email").value.trim().toLowerCase(), pw = $("#su-pw").value, pw2 = $("#su-pw2").value, err = $("#su-err");
      if (name.length < 2) return err.textContent = "Please enter your name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err.textContent = "Please enter a valid email.";
      if (pw.length < 6) return err.textContent = "Password must be at least 6 characters.";
      if (pw !== pw2) return err.textContent = "Passwords don't match.";
      if (users().some(u => u.email === email)) return err.textContent = "An account with this email already exists on this device. Log in instead.";
      const salt = rid(), id = rid();
      U = { id, name, email, salt, pass: await hash(pw, salt), created: Date.now(), profile: {}, plan: null, done: {}, draft: null };
      store.set(LS.users, users().concat([{ id, name, email }])); saveUser(); store.set(LS.session, id);
      toast("Welcome, " + name.split(" ")[0] + "!"); startWizard(1);
    };
    if (li) li.onsubmit = async e => {
      e.preventDefault();
      const email = $("#li-email").value.trim().toLowerCase(), pw = $("#li-pw").value, err = $("#li-err");
      const meta = users().find(u => u.email === email);
      const rec = meta && store.get(LS.user(meta.id), null);
      if (!rec || (await hash(pw, rec.salt)) !== rec.pass) return err.textContent = "Wrong email or password.";
      U = rec; store.set(LS.session, U.id); toast("Welcome back, " + U.name.split(" ")[0] + "!");
      U.plan ? go("home") : startWizard(U.draft?.step || 1);
    };
  }

  /* ============================================================
     WIZARD
     ============================================================ */
  function startWizard(step, fromPlan) {
    if (fromPlan && U.plan) {
      const days = Object.keys(U.plan.days);
      U.draft = { profile: clone(U.profile), count: days.length, days: DAYS.map(d => d.k).filter(k => days.includes(k)),
        parts: Object.fromEntries(days.map(k => [k, [...U.plan.days[k].parts]])), ex: Object.fromEntries(days.map(k => [k, clone(U.plan.days[k].ex)])), editing: true, prev: U.plan.prev || [], ptype: U.plan.mode === "manual" ? "manual" : "random" };
      U.draft.profile = withDefaults(U.draft.profile);
      U.draft.sig = Object.fromEntries(days.map(k => [k, U.draft.profile.exp === "beginner" ? "beg|" + profSig(U.draft.profile) : U.draft.parts[k].join(",") + "|" + profSig(U.draft.profile)]));
    }
    if (!U.draft) U.draft = { profile: clone(U.profile || {}), count: 0, days: [], parts: {}, ex: {} };
    S.step = step; U.draft.step = step; S.wizDay = null; saveUser(); go("wizard");
  }
  const STEP_TITLES = [
    ["About you", "Tell us about you", "We use this to build a plan that fits your body, level, time and equipment."],
    ["Schedule", "How many days a week?", "Pick the number of training days, then which days."],
    ["Focus", "What do you train each day?", "Choose one or more body parts for every training day."],
    ["Exercises", "Your exercises", "Picked for you at random. Shuffle, or tap to add and remove — everything you don't use becomes an alternative you can swap in later."],
    ["Review", "Your weekly plan", "Check everything. You can edit it any time."]
  ];
  function stepValid(n) {
    const d = U.draft, p = d.profile || {};
    if (n === 1) {
      if (!(p.weight >= 25 && p.weight <= 350)) return "Enter your weight (25–350 kg).";
      if (!(p.height >= 100 && p.height <= 250)) return "Enter your height (100–250 cm).";
      if (!(p.age >= 14 && p.age <= 90)) return "Enter your age (14–90).";
      if (!p.sex) return "Choose your sex.";
      if (!p.goal) return "Choose your goal.";
      if (!p.exp) return "Choose your experience.";
      if (!p.minutes) return "Choose time per session.";
      if (!p.equip) return "Choose your equipment.";
    }
    if (n === 2) {
      if (!d.count) return "Choose how many days.";
      if (d.days.length !== d.count) return d.days.length < d.count ? `Pick ${d.count - d.days.length} more day${d.count - d.days.length > 1 ? "s" : ""}.` : `Remove ${d.days.length - d.count} day(s).`;
    }
    if (n === 3) { const miss = d.days.find(k => !(d.parts[k] || []).length); if (miss) return `Choose a body part for ${DAY[miss].l}.`; }
    if (n === 4) { const miss = d.days.find(k => !(d.ex[k] || []).length); if (miss) return `Pick at least one exercise for ${DAY[miss].l}.`; }
    return "";
  }
  function renderWizard() {
    const d = U.draft, n = S.step, [eb, title, sub0] = STEP_TITLES[n - 1];
    const sub = n === 4 && d.ptype === "manual" ? "Tap exercises to add them to each day. Your plan stays the same until you change it." : sub0;
    let body = "";
    if (n === 1) body = wizProfile();
    if (n === 2) body = wizDays();
    if (n === 3) body = wizParts();
    if (n === 4) body = wizExercises();
    if (n === 5) body = wizReview();
    const v = stepValid(n);
    app.innerHTML = ambient + `
      <header class="topbar"><div class="wrap">${brand}<div class="spacer"></div>
        ${d.editing ? `<button class="btn sm ghost" data-act="wiz-cancel">Cancel</button>` : TEST_MODE ? `<span class="test-badge">Test mode</span>` : `<button class="btn sm ghost" data-act="logout">Log out</button>`}</div></header>
      <main class="wizard">
        <div class="steps">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</div>
        <div class="wiz-head fade-in"><div class="eyebrow">Step ${n} of 5 · ${eb}</div><h1>${title}</h1><p class="muted" style="margin:0">${sub}</p></div>
        <div class="fade-in">${body}</div>
      </main>
      <div class="wizbar"><div class="in">
        ${n > 1 ? `<button class="btn" data-act="wiz-back">Back</button>` : ""}
        <div class="hint" id="wiz-hint">${v ? esc(v) : "Ready"}</div>
        ${n === 4 && S.wizDay && d.days.indexOf(S.wizDay) < d.days.length - 1 ? `<button class="btn" data-act="wiz-nextday">Next day</button>` : ""}
        <button class="btn primary" data-act="wiz-next" ${v ? "disabled" : ""}>${n === 5 ? "Save plan" : "Continue"}</button>
      </div></div>`;
    Anim.mountAll(app);
  }
  function refreshHint() {
    const v = stepValid(S.step), h = $("#wiz-hint"), b = $('[data-act="wiz-next"]');
    if (h) h.textContent = v || "Ready"; if (b) b.disabled = !!v;
  }
  function wizProfile() {
    const p = U.draft.profile; p.injuries = p.injuries || [];
    const seg = (key, opts) => `<div class="chips">${opts.map(o => `<button class="chip ${p[key] === o.k ? "on" : ""}" data-act="pf" data-key="${key}" data-val="${o.k}">${o.t}</button>`).join("")}</div>`;
    return `<div class="card pad" style="margin-bottom:16px">
      <div class="row2">
        <div class="field"><label for="w">Weight</label><div class="input-unit"><input class="input" id="w" inputmode="decimal" data-bind="weight" value="${p.weight ?? ""}" placeholder="e.g. 77"><span>kg</span></div></div>
        <div class="field"><label for="h">Height</label><div class="input-unit"><input class="input" id="h" inputmode="numeric" data-bind="height" value="${p.height ?? ""}" placeholder="e.g. 178"><span>cm</span></div></div>
      </div>
      <div class="row2">
        <div class="field"><label for="age">Age</label><div class="input-unit"><input class="input" id="age" inputmode="numeric" data-bind="age" value="${p.age ?? ""}" placeholder="e.g. 26"><span>yrs</span></div></div>
        <div class="field"><label>Sex</label>${seg("sex", [{ k: "m", t: "Male" }, { k: "f", t: "Female" }])}</div>
      </div></div>
      <div class="eyebrow" style="margin:6px 0 10px">Goal</div>
      <div class="goal-grid" style="margin-bottom:22px">${GOALS.map((g, gi) => `<button class="goal ${p.goal === g.k ? "on" : ""}" data-act="pf" data-key="goal" data-val="${g.k}"><div class="gn">0${gi + 1}</div><h4>${g.t}</h4><p>${g.d}</p></button>`).join("")}</div>
      <div class="eyebrow" style="margin:6px 0 10px">Experience</div>
      <div class="goal-grid" style="margin-bottom:22px">${EXPS.map((g, gi) => `<button class="goal ${p.exp === g.k ? "on" : ""}" data-act="pf" data-key="exp" data-val="${g.k}"><div class="gn">LEVEL ${gi + 1}</div><h4>${g.t}</h4><p>${g.d}</p></button>`).join("")}</div>
      <div class="card pad">
        <div class="field"><label>Time per session</label>${seg("minutes", MINUTES.map(m => ({ k: m, t: m + " min" })))}</div>
        <div class="field"><label>Equipment</label>${seg("equip", EQUIPS)}</div>
        <div class="field" style="margin-bottom:0"><label>Pain or injuries <span class="faint">(we avoid exercises that stress these)</span></label>
          <div class="chips"><button class="chip ${p.injuries.length ? "" : "on"}" data-act="inj" data-val="">None</button>${INJ.map(o => `<button class="chip ${p.injuries.includes(o.k) ? "on" : ""}" style="--c:var(--rose)" data-act="inj" data-val="${o.k}">${o.t}</button>`).join("")}</div></div>
      </div>
      ${p.age && p.age < 18 ? `<p class="muted" style="font-size:13px;margin-top:12px">Under 18: please train with a coach or adult supervising.</p>` : ""}`;
  }
  function wizDays() {
    const d = U.draft;
    const isBeg = d.profile.exp === "beginner";
    const t = window.TEMPLATES.w1;
    const tpls = `<button class="tpl" data-act="tpl" data-tpl="w1"><h4>Classic 5-day split</h4><p>${t.days.map((x, i) => `<b>${DAY[TEMPLATE_DAYS[i]].s}</b> ${x.parts.filter(q => q !== "Cardio").join(", ")}`).join(" · ")}</p></button>`;
    return `<div class="card pad" style="margin-bottom:16px">
      <div class="eyebrow" style="margin-bottom:12px">Days per week</div>
      <div class="count-row">${[1, 2, 3, 4, 5, 6, 7].map(i => `<button class="count ${d.count === i ? "on" : ""}" data-act="count" data-n="${i}">${i}</button>`).join("")}</div>
      <div class="eyebrow" style="margin:22px 0 12px">Which days? <span class="muted" style="letter-spacing:0;text-transform:none;font-weight:600">${d.days.length}/${d.count || 0} picked</span></div>
      <div class="days">${DAYS.map(x => `<button class="day ${d.days.includes(x.k) ? "on" : ""}" data-act="day" data-day="${x.k}"><b>${x.s}</b><span>${d.days.includes(x.k) ? "Training" : "Rest"}</span></button>`).join("")}</div>
    </div>
    ${isBeg ? `<div class="card pad"><div class="eyebrow" style="margin-bottom:6px">Beginner plan</div><p class="muted" style="margin:0;font-size:14px">You'll train <b style="color:var(--text)">full body</b> on each of these days with the same simple exercises for 4 weeks. After that, the app moves you to random plans.</p></div>`
    : `<div class="card pad"><div class="eyebrow" style="margin-bottom:6px">Quick fill</div>
      <p class="muted" style="margin:0 0 12px;font-size:13px">Sets 5 days (Tue · Thu · Fri · Sat · Sun) and their body parts. Exercises are still picked at random.</p>
      <div class="tpl-grid">${tpls}</div></div>`}`;
  }
  function wizParts() {
    const d = U.draft;
    if (d.profile.exp === "beginner") return `<div class="card pad"><div class="eyebrow">Beginner · Full body</div>
      <h3 style="font-size:22px;margin:8px 0">Every training day works your whole body</h3>
      <div class="chips" style="margin:12px 0">${Gen.beginnerParts(d.profile).map(tag).join(" ")}</div>
      <p class="muted" style="margin:0">Same simple exercises on ${d.days.map(k => DAY[k].l).join(", ")} for 4 weeks — so you learn them and get stronger. Then you'll choose body parts and get random plans.</p></div>`;
    return `<div class="dayparts">${d.days.map(k => `<div class="card daypart">
      <div class="top"><h3>${DAY[k].l}</h3><span class="muted" style="font-size:13px">${(d.parts[k] || []).length ? (d.parts[k] || []).join(" + ") : "Pick body parts"}</span></div>
      <div class="chips">${PARTS.map(p => `<button class="chip ${(d.parts[k] || []).includes(p.k) ? "on" : ""}" style="--c:${p.c}" data-act="part" data-day="${k}" data-part="${p.k}">${p.k}<span class="faint" style="font-weight:600">${LIB.filter(e => e.muscle === p.k).length}</span></button>`).join("")}</div>
    </div>`).join("")}</div>`;
  }
  function wizExercises() {
    const d = U.draft;
    if (!S.wizDay || !d.days.includes(S.wizDay)) S.wizDay = d.days[0];
    const k = S.wizDay, sel = d.ex[k] || (d.ex[k] = []), parts = d.parts[k] || [];
    const tabs = `<div class="daytabs">${d.days.map(x => `<button class="daytab ${x === k ? "on" : ""} ${(d.ex[x] || []).length ? "" : "bad"}" data-act="wizday" data-day="${x}">${DAY[x].s} <span class="n">${(d.ex[x] || []).length}</span></button>`).join("")}</div>`;
    const selPanel = `<div class="card selected-panel">
      <div class="head"><h3>${DAY[k].l} · ${d.profile.exp === "beginner" ? "Full body" : parts.join(" + ")}</h3><span class="muted" style="font-size:13px">${sel.length} picked · ${daySets({ ex: sel })} sets</span></div>
      <div class="ptype" role="radiogroup" aria-label="Plan type">
        <button class="${d.ptype !== "manual" ? "on" : ""}" data-act="ptype" data-val="random">${I("shuffle")}<span><b>Pick for me</b><small>${d.profile.exp === "beginner" ? "Simple full-body set for 4 weeks" : "Random, changes every 2 weeks"}</small></span></button>
        <button class="${d.ptype === "manual" ? "on" : ""}" data-act="ptype" data-val="manual">${I("edit")}<span><b>I'll choose</b><small>Manual, stays until you change it</small></span></button>
      </div>
      <div class="row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center">
        ${d.ptype === "manual" ? `<button class="btn sm ghost" data-act="clear-day">${I("x")} Clear ${DAY[k].s}</button><span class="muted" style="font-size:12px">Tap exercises below to add them. Change sets and reps here.</span>`
        : d.profile.exp === "beginner" ? `<button class="btn sm" data-act="shuffle-all">${I("shuffle")} New beginner set</button><span class="muted" style="font-size:12px">Fixed for 4 weeks. You can still add, remove or reorder.</span>`
        : `<button class="btn sm" data-act="shuffle-day">${I("shuffle")} Shuffle ${DAY[k].s}</button><button class="btn sm ghost" data-act="shuffle-all">${I("shuffle")} Shuffle all days</button><span class="muted" style="font-size:12px">Picked for your goal, level, time and equipment. You can still add, remove or reorder.</span>`}
      </div>
      ${sel.length ? `<div class="sel-list">${sel.map((x, i) => `<div class="sel-item">
        <div class="num">${i + 1}</div>
        <div class="nm">${esc(EX[x.id].name)}<small>${esc(EX[x.id].muscle)} · ${esc(EX[x.id].equip)}</small></div>
        <div class="ctrl">
          ${i ? `<button class="ss-toggle ${x.ss ? "on" : ""}" data-act="ss" data-i="${i}" title="Do as a superset with the exercise above">${x.ss ? "Superset" : "+ Superset"}</button>` : ""}
          <input class="mini" inputmode="numeric" aria-label="Sets" data-act="sets" data-i="${i}" value="${esc(x.sets)}"><span class="x">×</span>
          <input class="mini reps" aria-label="Reps" data-act="reps" data-i="${i}" value="${esc(x.reps)}">
          <button class="btn icon sm" data-act="mv" data-i="${i}" data-d="-1" ${i ? "" : "disabled"} aria-label="Move up">${I("up")}</button>
          <button class="btn icon sm" data-act="mv" data-i="${i}" data-d="1" ${i < sel.length - 1 ? "" : "disabled"} aria-label="Move down">${I("down")}</button>
          <button class="btn icon sm" data-act="unpick" data-id="${x.id}" aria-label="Remove">${I("x")}</button>
        </div></div>`).join("")}</div>` : `<div class="empty">Tap exercises below to add them to ${DAY[k].l}.</div>`}
    </div>`;
    const groups = parts.map(p => {
      const list = LIB.filter(e => e.muscle === p), n = list.filter(e => sel.some(x => x.id === e.id)).length;
      return `<div class="picker-group"><h3>${tag(p)} <small>${n} picked · ${list.length - n} alternatives</small></h3>
        <div class="tiles">${list.map(e => {
          const idx = sel.findIndex(x => x.id === e.id);
          return `<button class="tile ${idx > -1 ? "on" : ""}" data-act="pick" data-id="${e.id}" aria-pressed="${idx > -1}">
            ${idx < 0 ? `<span class="alt">Alternative</span>` : ""}<span class="sel">${idx > -1 ? idx + 1 : ""}</span>
            ${media(e)}<div class="body"><h4>${esc(e.name)}</h4><p>${esc(e.equip)} · ${e.sets} × ${esc(e.reps)}</p></div></button>`;
        }).join("")}</div></div>`;
    }).join("");
    return tabs + selPanel + groups;
  }
  function wizReview() {
    const d = U.draft, p = d.profile, days = {};
    d.days.forEach(k => days[k] = { parts: d.parts[k], ex: d.ex[k] });
    const totEx = d.days.reduce((a, k) => a + d.ex[k].length, 0), totSets = d.days.reduce((a, k) => a + daySets({ ex: d.ex[k] }), 0);
    return `<div class="stats" style="margin-bottom:14px">
      <div class="card stat" style="--c:var(--sky)"><div class="lbl">Weight</div><div class="val">${p.weight}<small>kg</small></div></div>
      <div class="card stat" style="--c:var(--violet)"><div class="lbl">Height</div><div class="val">${p.height}<small>cm</small></div></div>
      <div class="card stat goal-stat" style="--c:var(--lime)"><div class="lbl">Goal</div><div class="val">${GOAL[p.goal].t}</div></div>
    </div>
    <p class="muted" style="margin:0 0 12px;font-size:14px">${p.age} yrs · ${p.sex === "f" ? "Female" : "Male"} · ${EXP[p.exp].t} · ${p.minutes} min · ${EQUIP[p.equip].t}${(p.injuries || []).length ? " · Avoiding: " + p.injuries.map(i => INJ.find(x => x.k === i).t).join(", ") : ""}</p>
    <div class="card pad" style="margin-bottom:12px;display:flex;gap:12px;align-items:center"><span class="bi" style="color:var(--accent)">${I(d.ptype === "manual" ? "edit" : p.exp === "beginner" ? "sprout" : "shuffle")}</span><div>${d.ptype === "manual" ? `<b>Manual plan</b><div class="muted" style="font-size:13px">Your exercises stay the same until you edit them.</div>` : p.exp === "beginner" ? `<b>Beginner phase · 4 weeks</b><div class="muted" style="font-size:13px">Full body with the same exercises. Random plans unlock after 4 weeks.</div>` : `<b>Random plan · new exercises every 2 weeks</b><div class="muted" style="font-size:13px">Same days and body parts, fresh exercises each block.</div>`}</div></div>
    <p class="muted" style="margin:0 0 12px"><b style="color:var(--text)">${d.days.length}</b> training days · <b style="color:var(--text)">${totEx}</b> exercises · <b style="color:var(--text)">${totSets}</b> sets per week</p>
    ${weekTable(days, { goal: p.goal })}`;
  }
  function applyTemplate(key) {
    const t = window.TEMPLATES[key], d = U.draft;
    d.count = t.days.length; d.days = TEMPLATE_DAYS.slice(0, t.days.length); d.parts = {}; d.ex = {}; d.sig = {};
    t.days.forEach((x, i) => { d.parts[d.days[i]] = [...x.parts]; });
    S.step = 3; d.step = 3; saveUser(); toast("Days and body parts filled — adjust if you like"); render(); scrollTo(0, 0);
  }
  const profSig = p => [p.exp, p.equip, (p.injuries || []).join(""), p.minutes, p.goal, p.age >= 50, p.age >= 60, Gen.bmi(p) >= 30].join("|");
  function ensureGenerated(force) {
    const d = U.draft, p = d.profile; d.sig = d.sig || {};
    if (p.exp === "beginner") {
      const sig = "beg|" + profSig(p);
      if (force || d.days.some(k => d.sig[k] !== sig || !(d.ex[k] || []).length)) {
        const r = Gen.generate(p, Object.fromEntries(d.days.map(k => [k, d.parts[k]])), d.prev);
        d.days.forEach(k => { d.ex[k] = r.ex[k]; d.sig[k] = sig; });
      }
      return;
    }
    const used = new Set(), stale = [];
    d.days.forEach(k => {
      const sig = d.parts[k].join(",") + "|" + profSig(p);
      if (force || d.sig[k] !== sig || !(d.ex[k] || []).length) stale.push(k); else d.ex[k].forEach(x => used.add(x.id));
    });
    let warn = [];
    stale.forEach(k => {
      d.ex[k] = Gen.generateDay(p, d.parts[k], d.prev, [...used]); d.ex[k].forEach(x => used.add(x.id));
      d.sig[k] = d.parts[k].join(",") + "|" + profSig(p);
      d.parts[k].forEach(part => { if (!d.ex[k].some(x => EX[x.id].muscle === part)) warn.push(part); });
    });
    if (warn.length) toast("No suitable exercises for: " + [...new Set(warn)].join(", ") + " with your equipment/injuries");
  }
  function finishWizard() {
    const d = U.draft, plan = { days: {} };
    d.days.forEach(k => plan.days[k] = { parts: d.parts[k], ex: d.ex[k].map(x => ({ id: x.id, sets: parseSets(x.sets) || 1, reps: String(x.reps || "10"), ss: !!x.ss })) });
    const old = U.plan, mode = d.ptype === "manual" ? "manual" : d.profile.exp === "beginner" ? "beginner" : "random";
    plan.mode = mode;
    plan.start = old && old.mode === mode && old.start ? old.start : localISO();
    plan.blockStart = localISO(); plan.block = (old && old.mode === mode && old.block) ? old.block : 1; plan.prev = (old && old.prev) || [];
    U.profile = clone(d.profile); U.plan = plan; U.draft = null; U.graduate = false; saveUser();
    S.homeDay = null; toast("Plan saved"); if (location.hash.slice(1) !== "workout") history.replaceState(null, "", "#workout"); go("home");
  }

  /* ============================================================
     HOME
     ============================================================ */
  function trainingDays() { return DAYS.map(d => d.k).filter(k => U.plan.days[k]); }
  function pickHomeDay() {
    if (S.homeDay) return S.homeDay;
    const t = todayKey(); if (U.plan.days[t]) return t;
    const order = DAYS.map(d => d.k), i = order.indexOf(t);
    for (let j = 1; j <= 7; j++) { const k = order[(i + j) % 7]; if (U.plan.days[k]) return k; }
    return t;
  }
  const doneKey = k => isoWeek() + ":" + k;
  /* ---------------- streak ---------------- */
  const stkData = () => U.streak || (U.streak = { days: {}, best: 0 });
  const isTrain = k => !!(U.plan && U.plan.days[k]);
  function streakNow() { return Streak.compute(stkData().days, isTrain, localISO()); }
  function nextWorkoutLabel() {
    const order = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"], t = new Date().getDay();
    for (let j = 1; j <= 7; j++) { const k = order[(t + j) % 7]; if (isTrain(k)) return j === 1 ? "Tomorrow" : DAY[k].s; }
    return "";
  }
  function showStreak(from) {
    const st = streakNow(), sd = stkData();
    if (st.count > (sd.best || 0)) { sd.best = st.count; saveUser(); }
    Streak.show({ from: from == null ? st.count : from, to: st.count, start: st.start, best: sd.best, week: Streak.week(sd.days, isTrain, localISO()), next: nextWorkoutLabel() });
  }
  function streakChip() {
    const n = streakNow().count;
    return `<button class="streak-chip ${n ? "" : "zero"}" data-act="streak" aria-label="${n} day streak">${Streak.flame}<b>${n}</b><span>${n ? "day streak" : "Start a streak"}</span></button>`;
  }
  function checkRotation() {
    const pl = U.plan; if (!pl) return;
    U.profile = withDefaults(U.profile);
    if (!pl.mode) { pl.mode = U.profile.exp === "beginner" ? "beginner" : "random"; pl.start = pl.start || localISO(); pl.blockStart = pl.blockStart || localISO(); pl.block = pl.block || 1; pl.prev = pl.prev || []; saveUser(); }
    if (pl.mode === "manual") return;
    if (pl.mode === "beginner") { if (daysSince(pl.start) >= BEGINNER_DAYS && !U.graduate) { U.graduate = true; saveUser(); } return; }
    const gone = daysSince(pl.blockStart);
    if (gone >= BLOCK_DAYS) {
      reshuffle(); pl.blockStart = addDays(pl.blockStart, Math.floor(gone / BLOCK_DAYS) * BLOCK_DAYS);
      saveUser(); setTimeout(() => toast(`Block ${pl.block} started — new exercises`), 400);
    }
  }
  function reshuffle() {
    const pl = U.plan, keys = trainingDays();
    pl.prev = [...new Set(keys.flatMap(k => pl.days[k].ex.map(x => x.id)))];
    const r = Gen.generate(U.profile, Object.fromEntries(keys.map(k => [k, pl.days[k].parts])), pl.prev);
    keys.forEach(k => { pl.days[k].ex = r.ex[k]; delete U.done[doneKey(k)]; });
    pl.block = (pl.block || 1) + 1;
  }
  function blockBanner() {
    const pl = U.plan;
    if (pl.mode === "manual") return `<div class="card pad banner fade-in"><span class="bi">${I("edit")}</span><div class="bt"><b>Manual plan</b><div class="muted">Your exercises stay the same until you change them. Add, remove or swap exercises on the Workout page.</div></div><button class="btn sm" data-act="to-random">${I("shuffle")} Switch to random</button></div>`;
    if (pl.mode === "beginner") {
      if (U.graduate) return `<div class="card pad banner fade-in" style="--c:var(--lime)"><span class="bi">${I("flag")}</span><div class="bt"><b>Beginner phase complete!</b><div class="muted">Choose body parts for each day to unlock random plans with new exercises every 2 weeks.</div></div><button class="btn primary sm" data-act="graduate">Choose body parts</button></div>`;
      const d = daysSince(pl.start), wk = Math.min(4, Math.floor(d / 7) + 1), left = Math.max(0, BEGINNER_DAYS - d);
      return `<div class="card pad banner fade-in" style="--c:var(--lime)"><span class="bi">${I("sprout")}</span><div class="bt"><b>Beginner phase · week ${wk} of 4</b><div class="muted">Random plans unlock in ${left} day${left === 1 ? "" : "s"}.</div><div class="bar"><i style="width:${Math.min(100, d / BEGINNER_DAYS * 100)}%"></i></div></div></div>`;
    }
    const d = daysSince(pl.blockStart), left = Math.max(1, BLOCK_DAYS - d);
    return `<div class="card pad banner fade-in" style="--c:var(--sky)"><span class="bi">${I("shuffle")}</span><div class="bt"><b>Block ${pl.block || 1} · new exercises in ${left} day${left === 1 ? "" : "s"}</b><div class="muted">Same days and body parts — fresh exercises every 2 weeks.</div><div class="bar"><i style="width:${Math.min(100, d / BLOCK_DAYS * 100)}%"></i></div></div><button class="btn sm" data-act="shuffle-now">${I("shuffle")} Shuffle now</button></div>`;
  }
  const PAGES = ["workout", "week", "library", "profile"];
  const pageFromHash = () => { const h = (location.hash || "").slice(1); return PAGES.includes(h) ? h : "workout"; };
  function go2(page) { if (location.hash.slice(1) !== page) location.hash = page; else { S.page = page; render(); } scrollTo(0, 0); }
  function renderHome() {
    checkRotation();
    const p = U.profile, tk = todayKey(), td = U.plan.days[tk], pg = S.page = pageFromHash();
    S.homeDay = pickHomeDay();
    const nav = [["workout", "dumbbell", "Workout"], ["week", "calendar", "Week"], ["library", "book", "Exercises"], ["profile", "user", "Profile"]];
    let body = "";
    if (pg === "workout") body = `
      <section class="hero fade-in">
        <div class="t">
          <div class="eyebrow">${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1>${td ? `Today<br><em>${esc(focusText(td.parts))}</em>` : `Rest<br><em>day</em>`}</h1>
          <div class="today-pill"><i></i>${td ? `${td.ex.length} exercises · ${daySets(td)} sets · ${U.plan.mode === "manual" ? "Manual plan" : "Block " + (U.plan.block || 1)}` : "Recover and come back stronger"}</div>${streakChip()}
        </div>
        ${td ? `<button class="btn primary" data-act="start-today">${I("play")} Start workout</button>` : ""}
      </section>
      <section class="section" id="workout" style="padding-top:20px"><div id="wo">${workoutHTML()}</div></section>`;
    if (pg === "week") body = `
      <section class="page-head fade-in"><div class="t"><div class="eyebrow">Plan</div><h1>This week</h1>
        <p>${trainingDays().length} training days · ${trainingDays().reduce((a, k) => a + U.plan.days[k].ex.length, 0)} exercises · ${trainingDays().reduce((a, k) => a + daySets(U.plan.days[k]), 0)} sets. Tap a day to train it.</p></div>
        <div class="page-actions"><button class="btn sm" data-act="edit-plan">${I("edit")} Edit plan</button></div></section>
      <div id="banner">${blockBanner()}</div>
      <section id="week">${weekTable(U.plan.days, { clickable: true })}</section>`;
    if (pg === "library") body = `
      <section class="page-head fade-in"><div class="t"><div class="eyebrow">Library</div><h1>Exercises</h1>
        <p>${LIB.length} exercises · ${(U.custom || []).length} of them yours. Tap one for how-to, or create your own.</p></div>
        <div class="page-actions"><button class="btn primary" data-act="new-ex">${I("plus")} New exercise</button></div></section>
      <div class="lib-bar">
        <div class="lib-search">${I("search")}<input class="input" id="lib-q" data-act="lib-q" placeholder="Search exercises" value="${esc(S.libQ || "")}" aria-label="Search exercises"></div>
        <div class="chips">${["All", "Custom"].concat(PARTS.map(p => p.k)).map(k => `<button class="chip ${(S.libPart || "All") === k ? "on" : ""}" data-act="lib-part" data-p="${k}">${k}</button>`).join("")}</div>
      </div>
      <section id="libgrid">${libGridHTML()}</section>`;
    if (pg === "profile") body = `
      <section class="page-head fade-in"><div class="t"><div class="eyebrow">Profile</div><h1>Body & goal</h1><p>Your details shape every plan the app builds.</p></div>
        <div class="page-actions"><button class="btn sm" data-act="edit-profile">${I("edit")} Edit</button></div></section>
      <section id="me">
        <div class="stats">
          <div class="card stat fade-in"><div class="lbl">${I("scale")}Weight</div><div class="val">${esc(p.weight)}<small>kg</small></div></div>
          <div class="card stat fade-in"><div class="lbl">${I("ruler")}Height</div><div class="val">${esc(p.height)}<small>cm</small></div></div>
          <div class="card stat goal-stat fade-in"><div class="lbl">${I("target")}Goal</div><div class="val">${esc(GOAL[p.goal]?.t || "—")}</div><div class="muted" style="font-size:13px;margin-top:6px">${esc(GOAL[p.goal]?.d || "")}</div></div>
        </div>
        <div class="chips facts">${[p.age ? p.age + " yrs" : "", p.sex ? (p.sex === "f" ? "Female" : "Male") : "", EXP[p.exp]?.t, p.minutes + " min / session", EQUIP[p.equip]?.t, (p.injuries || []).length ? "Avoiding " + p.injuries.map(i => INJ.find(x => x.k === i).t).join(", ") : ""].filter(Boolean).map(t => `<span class="pill">${esc(t)}</span>`).join("")}</div>
        <div class="prof-actions"><button class="btn" data-act="edit-plan">${I("calendar")} Edit plan</button>${TEST_MODE ? `<button class="btn danger" data-act="reset-app">${I("reset")} Reset & start over</button>` : ""}</div>
      </section>`;
    app.innerHTML = ambient + `
    <header class="topbar"><div class="wrap">${brand}<div class="spacer"></div>
      <nav class="navlinks">${nav.map(([k, , t]) => `<a href="#${k}" class="${pg === k ? "on" : ""}">${t}</a>`).join("")}</nav>
      ${navigator.onLine ? "" : `<span class="offline-badge">Offline</span>`}
      ${TEST_MODE ? `<span class="test-badge">Test mode</span>` : ""}<button class="avatar" data-act="menu" aria-label="Menu">${TEST_MODE ? I("menu") : esc(initials(U.name))}</button></div></header>
    <main class="wrap">${body}
      <footer>Training Dude · Photos: Free Exercise DB (public domain) · Your data stays on this device</footer>
    </main>
    <nav class="bottomnav">${nav.map(([k, ic, t]) => `<a href="#${k}" class="${pg === k ? "on" : ""}">${I(ic)}${t}</a>`).join("")}<a href="#" data-act="menu">${I("menu")}Menu</a></nav>`;
    document.body.classList.add("has-bottomnav");
    Anim.mountAll(app);
  }
  function workoutHTML() {
    const k = S.homeDay, day = U.plan.days[k], tk = todayKey();
    const chips = `<div class="wo-days">${DAYS.map(d => `<button class="wo-day ${U.plan.days[d.k] ? "" : "rest"} ${d.k === k ? "on" : ""}" data-act="wo-day" data-day="${d.k}"><span>${d.k === tk ? "Today" : d.s}</span><b>${U.plan.days[d.k] ? U.plan.days[d.k].ex.length : "–"}</b>${d.k === tk ? '<i class="dot"></i>' : ""}</button>`).join("")}</div>`;
    if (!day) return chips + `<div class="card rest-card fade-in"><div class="big">${I("moon")}</div><h3>${DAY[k].l} is a rest day</h3><p class="muted">Recover, sleep well and come back stronger.</p></div>`;
    if (!day.ex.length) return chips + `<div class="card rest-card fade-in"><div class="big">${I("dumbbell")}</div><h3>No exercises on ${DAY[k].l}</h3><p class="muted">Add some with Edit plan on the Week page.</p></div>`;
    const done = U.done[doneKey(k)] || {}, nDone = day.ex.filter((x, i) => done[i]).length, pct = Math.round(nDone / day.ex.length * 100);
    const used = new Set(day.ex.map(x => x.id));
    const cards = day.ex.map((x, i) => {
      const e = EX[x.id], alts = LIB.filter(a => a.muscle === e.muscle && !used.has(a.id) && Gen.allowed(a, U.profile, false));
      const rest = restFor(e);
      return `<article class="card exc ${done[i] ? "done" : ""}" style="animation-delay:${Math.min(i, 8) * 40}ms">
        ${media(e)}
        <div class="info">
          <div class="meta"><span class="idx">${String(i + 1).padStart(2, "0")}</span>${tag(e.muscle)}${x.ss ? `<span class="ss-badge">Superset with ${String(i).padStart(2, "0")}</span>` : ""}</div>
          <h4>${esc(e.name)}</h4>
          <div class="xstats"><div><b>${esc(x.sets)}</b><span>Sets</span></div><div><b>${esc(x.reps)}</b><span>${/min|s$/.test(String(x.reps)) ? "Time" : "Reps"}</span></div><div><b>${rest}</b><span>Rest</span></div></div>
          <div class="pills"><span class="pill">${esc(e.equip)}</span></div>
          ${logHTML(e, i)}
          <details class="how"><summary>How to do it</summary><ol>${e.cues.map(c => `<li>${esc(c)}</li>`).join("")}</ol><div class="avoid">Avoid: ${esc(e.avoid)}</div></details>
          <div class="actions">
            <select class="input swap" data-act="swap" data-i="${i}" aria-label="Swap exercise">
              <option value="">${alts.length ? `Swap (${alts.length} alternatives)` : "No alternatives"}</option>
              ${alts.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}
            </select>
            <button class="btn icon sm ghost" data-act="rm-ex" data-i="${i}" aria-label="Remove ${esc(e.name)} from this day" title="Remove from this day">${I("x")}</button>
            <button class="donebtn ${done[i] ? "on" : ""}" data-act="done" data-i="${i}" aria-pressed="${!!done[i]}"><span class="bx">${done[i] ? I("check") : ""}</span>${done[i] ? "Done" : "Mark done"}</button>
          </div>
        </div></article>`;
    }).join("");
    return chips + `<div class="card wo-head fade-in">
        <div class="t"><div class="eyebrow">${DAY[k].l}${k === tk ? " · Today" : ""}</div><h3>${focusText(day.parts)}</h3>
          <div class="muted" style="font-size:14px">${day.ex.length} exercises · ${daySets(day)} sets · ${nDone}/${day.ex.length} done</div></div>
        ${nDone ? `<button class="btn sm ghost" data-act="reset-day">Reset</button>` : ""}
        <div class="ring" style="--p:${pct}"><b>${pct}%</b></div>
      </div><div class="exs">${cards}</div>`;
  }
  function logHTML(e, i) {
    if (e.muscle === "Cardio") return "";
    const hist = (U.log && U.log[e.id]) || [], today = localISO();
    const cur = hist.find(h => h.d === today) || {}, last = [...hist].reverse().find(h => h.d !== today);
    const up = last && cur.w && parseFloat(cur.w) > parseFloat(last.w);
    const fmt = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };
    return `<div class="wlog">
      <div class="wl-f"><label for="lw-${i}">Weight today</label><div class="input-unit"><input class="input" id="lw-${i}" inputmode="decimal" data-act="logw" data-id="${e.id}" value="${esc(cur.w || "")}" placeholder="${last ? esc(last.w) : "0"}"><span>kg</span></div></div>
      <div class="wl-f"><label for="lr-${i}">Reps done</label><input class="input" id="lr-${i}" inputmode="numeric" data-act="logr" data-id="${e.id}" value="${esc(cur.r || "")}" placeholder="${last && last.r ? esc(last.r) : "—"}"></div>
      <div class="wl-last">${last ? `<span>Last time · ${fmt(last.d)}</span><b>${esc(last.w)} kg${last.r ? " × " + esc(last.r) : ""}</b>${up ? `<em>${I("up")} Heavier</em>` : ""}` : `<span>Last time</span><b class="faint">No log yet</b>`}</div>
    </div>`;
  }
  function saveLog(id, field, val) {
    U.log = U.log || {}; const hist = U.log[id] || (U.log[id] = []), today = localISO();
    let cur = hist.find(h => h.d === today);
    val = String(val).replace(",", ".").trim().slice(0, 8);
    if (!cur) { if (!val) return; cur = { d: today }; hist.push(cur); }
    cur[field] = val;
    if (!cur.w && !cur.r) hist.splice(hist.indexOf(cur), 1);
    if (hist.length > 30) hist.splice(0, hist.length - 30);
    saveUser();
  }
  function addExerciseModal() {
    const k = S.homeDay, day = U.plan.days[k]; let part = day.parts.find(x => x !== "Cardio") || "Chest";
    const o = modal(`<h3>Add exercise · ${DAY[k].l}</h3><div class="chips" id="ae-parts" style="margin-bottom:12px"></div><div class="ae-list" id="ae-list"></div><div class="foot"><button class="btn ghost" data-close>Done</button></div>`);
    const draw = () => {
      o.querySelector("#ae-parts").innerHTML = PARTS.map(x => `<button class="chip ${x.k === part ? "on" : ""}" data-p="${x.k}">${x.k}</button>`).join("");
      const used = new Set(day.ex.map(x => x.id));
      o.querySelector("#ae-list").innerHTML = LIB.filter(e => e.muscle === part && Gen.allowed(e, U.profile, false)).map(e => `<button class="ae-item ${used.has(e.id) ? "in" : ""}" data-id="${e.id}" ${used.has(e.id) ? "disabled" : ""}><span>${esc(e.name)}<small>${esc(e.equip)} · ${e.sets} × ${esc(e.reps)}</small></span><b>${used.has(e.id) ? "Added" : "+ Add"}</b></button>`).join("") || `<div class="empty">No exercises for this body part with your equipment.</div>`;
    };
    o.addEventListener("click", ev => {
      const pb = ev.target.closest("[data-p]"); if (pb) { part = pb.dataset.p; draw(); return; }
      const ib = ev.target.closest(".ae-item[data-id]"); if (!ib || ib.disabled) return;
      const e = EX[ib.dataset.id]; day.ex.push({ id: e.id, sets: e.sets, reps: e.reps, ss: false });
      if (!day.parts.includes(e.muscle)) day.parts.push(e.muscle);
      saveUser(); draw(); rerenderWorkout(); toast(`Added ${e.name}`);
    });
    draw();
  }
  function restFor(e, goalOverride) {
    if (e.muscle === "Cardio") return "—";
    if (e.muscle === "Abs") return "45s";
    const g = goalOverride || (U && U.profile || {}).goal;
    if (g === "strength") return e.c ? "2–3m" : "90s";
    if (g === "muscle") return e.c ? "2m" : "75s";
    return e.c ? "90s" : "60s";
  }
  function rerenderWorkout() { const w = $("#wo"); if (w) { w.innerHTML = workoutHTML(); Anim.mountAll(w); } }
  let secObs;
  function watchSections() {
    if (secObs) secObs.disconnect();
    if (!("IntersectionObserver" in window)) return;
    secObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) document.querySelectorAll(".bottomnav a[data-nav]").forEach(a => a.classList.toggle("on", a.dataset.nav === e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
    ["me", "week", "workout"].forEach(id => { const el = document.getElementById(id); el && secObs.observe(el); });
  }

  function editProfile() {
    const p = withDefaults(U.profile), opt = (arr, cur) => arr.map(o => `<option value="${o.k}" ${String(o.k) === String(cur) ? "selected" : ""}>${o.ic ? o.ic + " " : ""}${o.t}</option>`).join("");
    const o = modal(`<h3>Edit body & goal</h3>
      <div class="row2"><div class="field"><label>Weight (kg)</label><input class="input" id="ep-w" inputmode="decimal" value="${esc(p.weight)}"></div>
      <div class="field"><label>Height (cm)</label><input class="input" id="ep-h" inputmode="numeric" value="${esc(p.height)}"></div></div>
      <div class="row2"><div class="field"><label>Age</label><input class="input" id="ep-a" inputmode="numeric" value="${esc(p.age ?? "")}"></div>
      <div class="field"><label>Sex</label><select class="input" id="ep-s">${opt([{ k: "m", t: "Male" }, { k: "f", t: "Female" }], p.sex)}</select></div></div>
      <div class="field"><label>Goal</label><select class="input" id="ep-g">${opt(GOALS, p.goal)}</select></div>
      <div class="row2"><div class="field"><label>Experience</label><select class="input" id="ep-x">${opt(EXPS, p.exp)}</select></div>
      <div class="field"><label>Time per session</label><select class="input" id="ep-m">${opt(MINUTES.map(m => ({ k: m, t: m + " min" })), p.minutes)}</select></div></div>
      <div class="field"><label>Equipment</label><select class="input" id="ep-e">${opt(EQUIPS, p.equip)}</select></div>
      <div class="field"><label>Pain or injuries</label><div class="chips">${INJ.map(i => `<label class="chip ${p.injuries.includes(i.k) ? "on" : ""}" style="--c:var(--rose)"><input type="checkbox" class="sr" value="${i.k}" ${p.injuries.includes(i.k) ? "checked" : ""}>${i.t}</label>`).join("")}</div></div>
      <div class="field"><label>Name</label><input class="input" id="ep-n" value="${esc(U.name)}"></div>
      <div class="err" id="ep-err"></div>
      <div class="foot"><button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="ep-save">Save</button></div>`);
    o.querySelectorAll(".chips input").forEach(i => i.onchange = () => i.parentNode.classList.toggle("on", i.checked));
    o.querySelector("#ep-save").onclick = async () => {
      const num = id => parseFloat($(id).value.replace(",", "."));
      const w = num("#ep-w"), h = num("#ep-h"), a = num("#ep-a"), n = $("#ep-n").value.trim(), err = $("#ep-err");
      if (!(w >= 25 && w <= 350)) return err.textContent = "Weight must be 25–350 kg.";
      if (!(h >= 100 && h <= 250)) return err.textContent = "Height must be 100–250 cm.";
      if (!(a >= 14 && a <= 90)) return err.textContent = "Age must be 14–90.";
      if (n.length < 2) return err.textContent = "Enter your name.";
      const np = { weight: Math.round(w * 10) / 10, height: Math.round(h), age: Math.round(a), sex: $("#ep-s").value, goal: $("#ep-g").value, exp: $("#ep-x").value, minutes: +$("#ep-m").value, equip: $("#ep-e").value, injuries: [...o.querySelectorAll(".chips input:checked")].map(i => i.value) };
      const levelChanged = (np.exp === "beginner") !== (U.profile.exp === "beginner");
      const trainingChanged = profSig(np) !== profSig(withDefaults(U.profile));
      U.profile = np; U.name = n; store.set(LS.users, users().map(u => u.id === U.id ? { ...u, name: n } : u)); saveUser(); o.remove();
      if (levelChanged) { toast("Level changed — let's rebuild your plan"); if (np.exp !== "beginner") U.graduate = false; startWizard(np.exp === "beginner" ? 4 : 3, true); if (np.exp === "beginner") { const d = U.draft; d.days.forEach(k => d.parts[k] = Gen.beginnerParts(np)); ensureGenerated(true); saveUser(); render(); } else { const d = U.draft; d.days.forEach(k => d.parts[k] = []); saveUser(); render(); } return; }
      if (trainingChanged && U.plan.mode !== "manual" && await confirmBox("Update your exercises?", "Your level, time, equipment or injuries changed. Pick new exercises that fit now?", "Shuffle exercises")) { reshuffle(); U.plan.blockStart = localISO(); saveUser(); toast("New exercises picked"); }
      else toast("Saved");
      render();
    };
  }
  function openMenu(anchor) {
    document.querySelectorAll(".menu").forEach(m => m.remove());
    const m = document.createElement("div"); m.className = "menu";
    m.innerHTML = `<div class="who"><b>${TEST_MODE ? "Test mode" : esc(U.name)}</b><small>${TEST_MODE ? "No account needed while testing" : esc(U.email)}</small></div>
      <button data-m="profile">${I("user")} Edit body & goal</button><button data-m="plan">${I("calendar")} Edit plan</button>
      ${TEST_MODE ? `<button data-m="reset" class="danger">${I("reset")} Reset & start over</button>` : `<button data-m="logout">${I("reset")} Log out</button><button data-m="delete" class="danger">${I("trash")} Delete account</button>`}`;
    if (window.innerWidth <= 720 && anchor && anchor.closest(".bottomnav")) { m.style.position = "fixed"; m.style.top = "auto"; m.style.bottom = "90px"; m.style.right = "16px"; }
    document.body.appendChild(m);
    if (m.style.position !== "fixed") { m.style.position = "fixed"; m.style.top = "64px"; }
    setTimeout(() => document.addEventListener("click", function close(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener("click", close); } }), 0);
    m.onclick = async e => {
      const b = e.target.closest("[data-m]"); if (!b) return; m.remove();
      const a = b.dataset.m;
      if (a === "profile") editProfile();
      if (a === "plan") startWizard(2, true);
      if (a === "export") exportData();
      if (a === "import") importData();
      if (a === "install") installHelp();
      if (a === "logout") logout();
      if (a === "reset") resetApp();
      if (a === "delete" && await confirmBox("Delete account?", "This removes your account, plan and progress from this device. It can't be undone — export a backup first if you want to keep it.", "Delete forever", true)) {
        store.del(LS.user(U.id)); store.set(LS.users, users().filter(u => u.id !== U.id)); store.del(LS.session); U = null; toast("Account deleted"); go("auth");
      }
    };
  }
  async function resetApp() {
    if (!(await confirmBox("Reset everything?", "This deletes your profile, plan and progress on this device and starts the setup again.", "Reset", true))) return;
    store.del(LS.user(U.id)); store.set(LS.users, users().filter(u => u.id !== U.id)); store.del(LS.session); U = null; S.step = 1;
    history.replaceState(null, "", location.pathname + location.search); boot(); toast("Starting fresh");
  }
  function exportData() {
    const data = { app: "hutan-training", version: 1, exported: new Date().toISOString(), name: U.name, profile: U.profile, plan: U.plan, done: U.done, streak: U.streak };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `training-backup-${U.name.split(" ")[0].toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast("Backup downloaded");
  }
  function importData() {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json,.json";
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const r = new FileReader(); r.onload = async () => {
        try {
          const d = JSON.parse(r.result);
          if (d.app !== "hutan-training" || !d.plan || !d.plan.days) throw 0;
          for (const k in d.plan.days) { if (!DAY[k]) throw 0; d.plan.days[k].ex = (d.plan.days[k].ex || []).filter(x => EX[x.id]); }
          if (!(await confirmBox("Import backup?", "This replaces your current body data, plan and progress with the backup.", "Import"))) return;
          U.profile = d.profile || U.profile; U.plan = d.plan; U.done = d.done || {}; if (d.streak) U.streak = d.streak; saveUser(); S.homeDay = null; toast("Backup imported"); render();
        } catch { toast("That file isn't a valid backup"); }
      }; r.readAsText(f);
    };
    inp.click();
  }
  function installHelp() {
    const ok = "serviceWorker" in navigator && navigator.serviceWorker.controller;
    modal(`<h3>Install & use offline</h3>
      <p class="muted">${ok ? "Offline mode is ready on this device — the app and all exercise photos are saved." : location.protocol === "file:" ? "Offline caching needs the site to be opened from its web address (e.g. GitHub Pages), not as a local file." : "⏳ Offline mode is getting ready. Keep this page open a moment while it saves the photos."}</p>
      <p><b>iPhone (Safari):</b> Share → <i>Add to Home Screen</i>.</p>
      <p><b>Android / Chrome:</b> menu ⋮ → <i>Install app</i>.</p>
      <p><b>Laptop (Chrome/Edge):</b> install icon in the address bar.</p>
      <div class="foot"><button class="btn primary" data-close>Got it</button></div>`);
  }
  function logout() { store.del(LS.session); U = null; document.body.classList.remove("has-bottomnav"); S.authTab = "login"; go("auth"); }

  /* ============================================================
     EVENTS (delegated)
     ============================================================ */
  app.addEventListener("click", async e => {
    const t = e.target.closest("[data-act]"); if (!t) return;
    const a = t.dataset.act, d = U && U.draft;
    switch (a) {
      case "auth-tab": S.authTab = t.dataset.tab; render(); break;
      case "pick-acct": { const i = $("#li-email"); i.value = t.dataset.email; document.querySelectorAll(".acct").forEach(x => x.classList.toggle("on", x === t)); $("#li-pw").focus(); break; }
      case "logout": logout(); break;
      case "pf": {
        const key = t.dataset.key; d.profile[key] = key === "minutes" ? +t.dataset.val : t.dataset.val; saveUser();
        t.parentNode.querySelectorAll("[data-act=pf]").forEach(g => g.classList.toggle("on", g === t)); refreshHint(); break;
      }
      case "inj": {
        const v = t.dataset.val, arr = d.profile.injuries || (d.profile.injuries = []);
        d.profile.injuries = !v ? [] : arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v);
        saveUser(); const y = scrollY; render(); scrollTo(0, y); break;
      }
      case "shuffle-day": {
        const k = S.wizDay, used = d.days.filter(x => x !== k).flatMap(x => (d.ex[x] || []).map(e => e.id));
        d.ex[k] = Gen.generateDay(d.profile, d.parts[k], (d.prev || []).concat((d.ex[k] || []).map(e => e.id)), used);
        saveUser(); const y = scrollY; render(); scrollTo(0, y); toast("New exercises for " + DAY[k].l); break;
      }
      case "shuffle-all": {
        const before = d.days.flatMap(x => (d.ex[x] || []).map(e => e.id)), keepPrev = d.prev;
        d.prev = (keepPrev || []).concat(before); ensureGenerated(true); d.prev = keepPrev;
        saveUser(); const y = scrollY; render(); scrollTo(0, y); toast("New exercises for every day"); break;
      }
      case "shuffle-now": if (await confirmBox("Shuffle now?", "All training days get new exercises and today's ticks reset. This starts a new 2-week block.", "Shuffle")) { reshuffle(); U.plan.blockStart = localISO(); saveUser(); render(); toast(`Block ${U.plan.block} — new exercises`); } break;
      case "graduate": {
        U.profile.exp = "intermediate"; U.graduate = false; saveUser(); startWizard(3, true);
        const dd = U.draft; dd.days.forEach(k => dd.parts[k] = []); dd.ex = {}; dd.sig = {}; saveUser(); render(); toast("Choose body parts for each day"); break;
      }
      case "count": {
        d.count = +t.dataset.n;
        if (d.days.length > d.count) { d.days = d.days.slice(0, d.count); toast("Kept your first " + d.count + " day(s)"); }
        saveUser(); render(); break;
      }
      case "day": {
        const k = t.dataset.day;
        if (d.days.includes(k)) d.days = d.days.filter(x => x !== k);
        else {
          if (!d.count) { toast("First choose how many days"); break; }
          if (d.days.length >= d.count) { toast(`You chose ${d.count} day${d.count > 1 ? "s" : ""} — remove one first or raise the number`); break; }
          d.days.push(k); d.days.sort((x, y) => DAYS.findIndex(q => q.k === x) - DAYS.findIndex(q => q.k === y));
        }
        saveUser(); render(); break;
      }
      case "tpl": applyTemplate(t.dataset.tpl); break;
      case "part": {
        const k = t.dataset.day, p = t.dataset.part, arr = d.parts[k] || (d.parts[k] = []);
        if (arr.includes(p)) { d.parts[k] = arr.filter(x => x !== p); if (d.ex[k]) d.ex[k] = d.ex[k].filter(x => EX[x.id].muscle !== p); }
        else arr.push(p);
        saveUser(); render(); break;
      }
      case "wizday": S.wizDay = t.dataset.day; render(); scrollTo({ top: 0, behavior: "smooth" }); break;
      case "wiz-nextday": { const i = d.days.indexOf(S.wizDay); S.wizDay = d.days[i + 1]; render(); scrollTo({ top: 0, behavior: "smooth" }); break; }
      case "pick": {
        const k = S.wizDay, id = t.dataset.id, list = d.ex[k] || (d.ex[k] = []), i = list.findIndex(x => x.id === id);
        if (i > -1) list.splice(i, 1); else list.push({ id, sets: EX[id].sets, reps: EX[id].reps, ss: false });
        if (list[0]) list[0].ss = false;
        saveUser(); const y = scrollY; render(); scrollTo(0, y); break;
      }
      case "unpick": { const k = S.wizDay; d.ex[k] = d.ex[k].filter(x => x.id !== t.dataset.id); if (d.ex[k][0]) d.ex[k][0].ss = false; saveUser(); const y = scrollY; render(); scrollTo(0, y); break; }
      case "mv": {
        const k = S.wizDay, i = +t.dataset.i, j = i + +t.dataset.d, l = d.ex[k];
        [l[i], l[j]] = [l[j], l[i]]; if (l[0]) l[0].ss = false; saveUser(); const y = scrollY; render(); scrollTo(0, y); break;
      }
      case "ss": { const x = d.ex[S.wizDay][+t.dataset.i]; x.ss = !x.ss; saveUser(); const y = scrollY; render(); scrollTo(0, y); break; }
      case "wiz-back": S.step--; d.step = S.step; saveUser(); render(); scrollTo(0, 0); break;
      case "wiz-next": {
        if (stepValid(S.step)) break;
        if (S.step === 5) { finishWizard(); break; }
        if (S.step === 2 && d.profile.exp === "beginner") d.days.forEach(k => { d.parts[k] = Gen.beginnerParts(d.profile); });
        if (S.step === 3) { if (d.ptype === "manual") d.days.forEach(k => { d.ex[k] = (d.ex[k] || []).filter(x => d.parts[k].includes(EX[x.id].muscle)); }); else ensureGenerated(false); }
        S.step++; d.step = S.step; if (S.step === 4) S.wizDay = d.days[0]; saveUser(); render(); scrollTo(0, 0); break;
      }
      case "wiz-cancel": if (await confirmBox("Discard changes?", "Your current plan stays as it was.", "Discard")) { U.draft = null; saveUser(); go("home"); } break;
      case "menu": e.preventDefault(); e.stopPropagation(); openMenu(t); break;
      case "edit-profile": editProfile(); break;
      case "ptype": {
        d.ptype = t.dataset.val;
        if (d.ptype === "random") ensureGenerated(false);
        saveUser(); const y = scrollY; render(); scrollTo(0, y); break;
      }
      case "clear-day": d.ex[S.wizDay] = []; saveUser(); { const y = scrollY; render(); scrollTo(0, y); } break;
      case "to-random": if (await confirmBox("Switch to random?", "Your exercises will be replaced with random ones now, and change every 2 weeks after that.", "Switch")) { U.plan.mode = U.profile.exp === "beginner" ? "beginner" : "random"; reshuffle(); U.plan.block = 1; U.plan.blockStart = localISO(); U.plan.start = U.plan.start || localISO(); saveUser(); render(); toast("Random plan on"); } break;
      case "new-ex": exerciseForm(); break;
      case "lib-open": libDetail(t.dataset.id); break;
      case "lib-part": S.libPart = t.dataset.p; document.querySelectorAll("[data-act=lib-part]").forEach(c => c.classList.toggle("on", c === t)); { const g = $("#libgrid"); g.innerHTML = libGridHTML(); Anim.mountAll(g); } break;
      case "rm-ex": {
        const day = U.plan.days[S.homeDay], i = +t.dataset.i;
        if (day.ex.length <= 1) { toast("A training day needs at least one exercise"); break; }
        const gone = day.ex.splice(i, 1)[0]; if (day.ex[0]) day.ex[0].ss = false;
        const m = U.done[doneKey(S.homeDay)]; if (m) { const nm = {}; Object.keys(m).forEach(j => { j = +j; if (j < i) nm[j] = true; else if (j > i) nm[j - 1] = true; }); U.done[doneKey(S.homeDay)] = nm; }
        saveUser(); rerenderWorkout(); toast(`Removed ${EX[gone.id].name}`); break;
      }
      case "start-today": S.homeDay = todayKey(); rerenderWorkout(); $("#wo .exs") && $("#wo .exs").scrollIntoView({ behavior: "smooth" }); break;
      case "edit-plan": startWizard(2, true); break;
      case "goto-day": { const dk = t.dataset.day; go2("workout"); S.homeDay = dk; rerenderWorkout(); break; }
      case "reset-app": resetApp(); break;
      case "wo-day": S.homeDay = t.dataset.day; rerenderWorkout(); break;
      case "done": {
        const key = doneKey(S.homeDay), m = U.done[key] || (U.done[key] = {}), i = +t.dataset.i;
        if (m[i]) delete m[i]; else m[i] = true;
        pruneDone(); saveUser(); rerenderWorkout();
        const day = U.plan.days[S.homeDay], nDone = day.ex.filter((x, j) => m[j]).length, today = localISO(), sd = stkData();
        if (m[i] && nDone === day.ex.length) {
          const before = streakNow().count, first = !sd.days[today];
          sd.days[today] = S.homeDay; pruneStreak(); saveUser(); refreshStreakChip();
          if (first) showStreak(before); else cheer(nDone, day.ex.length);
        } else {
          if (!m[i] && sd.days[today] === S.homeDay) { delete sd.days[today]; saveUser(); refreshStreakChip(); }
          if (m[i]) cheer(nDone, day.ex.length);
        }
        break;
      }
      case "reset-day": { delete U.done[doneKey(S.homeDay)]; const sd = stkData(), td = localISO(); if (sd.days[td] === S.homeDay) delete sd.days[td]; saveUser(); rerenderWorkout(); refreshStreakChip(); break; }
      case "streak": showStreak(); break;
    }
  });
  app.addEventListener("input", e => {
    const t = e.target, d = U && U.draft;
    if (t.dataset.act === "lib-q") { S.libQ = t.value; const g = $("#libgrid"); g.innerHTML = libGridHTML(); Anim.mountAll(g); return; }
    if (t.dataset.act === "logw" || t.dataset.act === "logr") { saveLog(t.dataset.id, t.dataset.act === "logw" ? "w" : "r", t.value); return; }
    if (t.dataset.bind && d) {
      const v = parseFloat(t.value.replace(",", ".")); d.profile[t.dataset.bind] = isNaN(v) ? null : v; saveUser(); refreshHint();
    }
    if ((t.dataset.act === "sets" || t.dataset.act === "reps") && d) {
      const x = d.ex[S.wizDay][+t.dataset.i];
      if (t.dataset.act === "sets") x.sets = parseSets(t.value) || ""; else x.reps = t.value.slice(0, 20);
      saveUser();
    }
  });
  app.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.act === "sets" && U.draft) { const y = scrollY; render(); scrollTo(0, y); }
    if (t.dataset.act === "swap" && t.value) {
      const day = U.plan.days[S.homeDay], i = +t.dataset.i, old = EX[day.ex[i].id].name;
      day.ex[i].id = t.value; const m = U.done[doneKey(S.homeDay)]; if (m) delete m[i];
      saveUser(); rerenderWorkout(); toast(`Swapped ${old} → ${EX[t.value].name}`);
      // refresh the week table too
      const wk = $("#week .wk"); if (wk) wk.outerHTML = weekTable(U.plan.days, { clickable: true });
    }
  });
  function cheer(n, total) {
    document.querySelectorAll(".cheer").forEach(c => c.remove());
    const c = document.createElement("div"); c.className = "cheer"; c.setAttribute("role", "status");
    c.innerHTML = n === total ? `<b>Workout done</b><span>${n}/${total}</span><small>Great session</small>` : `<b>Good job</b><span>${n}/${total}</span><small>${total - n} to go</small>`;
    document.body.appendChild(c); setTimeout(() => c.remove(), 1700);
  }
  function pruneStreak() { const d = stkData().days, cut = addDays(localISO(), -400); for (const k in d) if (k < cut) delete d[k]; }
  function refreshStreakChip() { const c = $(".streak-chip"); if (c) c.outerHTML = streakChip(); }
  function pruneDone() { const keep = new Set(Object.keys(U.done).sort().slice(-60)); for (const k in U.done) if (!keep.has(k)) delete U.done[k]; }

  /* ---------------- custom exercises (per user) ---------------- */
  const EQ_CLASS = { "Machine": "gym", "Cable": "gym", "Barbell": "gym", "Smith machine": "gym", "EZ bar": "gym", "Dumbbell": "db", "Kettlebell": "db", "Plate": "db", "Bodyweight": "bw", "Band": "bw", "Other": "gym" };
  function syncCustom() {
    for (let i = LIB.length - 1; i >= 0; i--) if (LIB[i].custom) { delete EX[LIB[i].id]; LIB.splice(i, 1); }
    ((U && U.custom) || []).forEach(c => { LIB.push(c); EX[c.id] = c; });
  }
  function exerciseForm(existing) {
    const c = existing || {}, photos = [...(c.photos || [])];
    const sel = (arr, cur) => arr.map(v => `<option ${v === cur ? "selected" : ""}>${v}</option>`).join("");
    const o = modal(`<h3>${existing ? "Edit exercise" : "New exercise"}</h3>
      <div class="field"><label for="cx-n">Name</label><input class="input" id="cx-n" maxlength="60" value="${esc(c.name || "")}" placeholder="e.g. Landmine Press"></div>
      <div class="row2"><div class="field"><label for="cx-m">Body part</label><select class="input" id="cx-m">${sel(PARTS.map(p => p.k), c.muscle || "Chest")}</select></div>
        <div class="field"><label for="cx-e">Equipment</label><select class="input" id="cx-e">${sel(Object.keys(EQ_CLASS), c.equip || "Machine")}</select></div></div>
      <div class="row2"><div class="field"><label for="cx-t">Type</label><select class="input" id="cx-t"><option value="1" ${c.c ? "selected" : ""}>Compound</option><option value="0" ${c.c === 0 ? "selected" : ""}>Isolation</option></select></div>
        <div class="field"><label>Default sets × reps</label><div style="display:flex;gap:6px;align-items:center"><input class="input" id="cx-s" inputmode="numeric" value="${esc(c.sets || 3)}" style="width:64px"><span class="x">×</span><input class="input" id="cx-r" value="${esc(c.reps || "10")}"></div></div></div>
      <div class="field"><label for="cx-h">How to do it <span class="faint">(one step per line, optional)</span></label><textarea class="input" id="cx-h" rows="3" maxlength="400">${esc((c.cues || []).join("\n"))}</textarea></div>
      <div class="field"><label for="cx-a">Avoid <span class="faint">(optional)</span></label><input class="input" id="cx-a" maxlength="120" value="${esc(c.avoid || "")}"></div>
      <div class="field"><label>Photos <span class="faint">(1 or 2 — two photos play as a loop: start and end position)</span></label>
        <div class="cx-ph" id="cx-ph"></div>
        <label class="btn sm" style="align-self:flex-start;cursor:pointer">${I("camera")} Add photo<input type="file" id="cx-f" accept="image/*" multiple class="sr"></label></div>
      <div class="err" id="cx-err"></div>
      <div class="foot">${existing ? `<button class="btn danger" id="cx-del">${I("trash")} Delete</button><span class="spacer"></span>` : ""}<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="cx-save">${existing ? "Save" : "Create exercise"}</button></div>`);
    const drawPh = () => { o.querySelector("#cx-ph").innerHTML = photos.map((src, i) => `<div><img src="${src}" alt="Photo ${i + 1}"><button type="button" data-rmph="${i}" aria-label="Remove photo">${I("x")}</button><small>${i ? "End" : "Start"}</small></div>`).join(""); };
    drawPh();
    o.addEventListener("click", ev => { const b = ev.target.closest("[data-rmph]"); if (b) { photos.splice(+b.dataset.rmph, 1); drawPh(); } });
    o.querySelector("#cx-f").onchange = async ev => {
      for (const f of [...ev.target.files]) { if (photos.length >= 2) break; try { photos.push(await shrink(f)); } catch { toast("That photo couldn't be read"); } }
      ev.target.value = ""; drawPh();
    };
    if (existing) o.querySelector("#cx-del").onclick = async () => { o.remove(); if (await confirmBox("Delete exercise?", `"${c.name}" will be removed from the app and from your plan.`, "Delete", true)) deleteCustom(c.id); };
    o.querySelector("#cx-save").onclick = () => {
      const name = $("#cx-n").value.trim(), err = $("#cx-err");
      if (name.length < 2) return err.textContent = "Give the exercise a name.";
      if (LIB.some(e => e.name.toLowerCase() === name.toLowerCase() && e.id !== c.id)) return err.textContent = "An exercise with this name already exists.";
      const equip = $("#cx-e").value, rec = {
        id: c.id || "c-" + rid(), custom: true, name, muscle: $("#cx-m").value, equip, eq: EQ_CLASS[equip] || "gym", c: +$("#cx-t").value, lv: 1, j: [],
        sets: parseSets($("#cx-s").value) || 3, reps: ($("#cx-r").value.trim() || "10").slice(0, 20),
        cues: $("#cx-h").value.split("\n").map(x => x.trim()).filter(Boolean).slice(0, 6), avoid: $("#cx-a").value.trim(), photo: null, anim: null, photos: photos.slice(0, 2)
      };
      if (!rec.cues.length) rec.cues = ["Set up with control.", "Move through a comfortable range.", "Return slowly."];
      if (!rec.avoid) rec.avoid = "Rushing the movement.";
      U.custom = (U.custom || []).filter(x => x.id !== rec.id).concat(rec);
      if (U.plan) Object.values(U.plan.days).forEach(day => { if (day.ex.some(x => x.id === rec.id) && !day.parts.includes(rec.muscle)) day.parts.push(rec.muscle); });
      if (!saveUser()) { U.custom = U.custom.filter(x => x.id !== rec.id).concat(existing ? [existing] : []); return err.textContent = "Not enough space on this device. Try smaller or fewer photos."; }
      syncCustom(); o.remove(); toast(existing ? "Exercise updated" : `${name} added to the app`); render();
    };
  }
  function shrink(file) {
    return new Promise((res, rej) => {
      const r = new FileReader(); r.onerror = rej;
      r.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => {
        const W = 600, H = 400, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
        const s2 = Math.max(W / im.width, H / im.height), w = im.width * s2, h = im.height * s2;
        cv.getContext("2d").drawImage(im, (W - w) / 2, (H - h) / 2, w, h); res(cv.toDataURL("image/jpeg", .72));
      }; im.src = r.result; };
      r.readAsDataURL(file);
    });
  }
  function deleteCustom(id) {
    U.custom = (U.custom || []).filter(x => x.id !== id);
    if (U.plan) Object.values(U.plan.days).forEach(day => { day.ex = day.ex.filter(x => x.id !== id); });
    if (U.draft && U.draft.ex) Object.keys(U.draft.ex).forEach(k => { U.draft.ex[k] = U.draft.ex[k].filter(x => x.id !== id); });
    saveUser(); syncCustom(); toast("Exercise deleted"); render();
  }
  function libGridHTML() {
    const q = (S.libQ || "").toLowerCase(), part = S.libPart || "All";
    const list = LIB.filter(e => (part === "All" || (part === "Custom" ? e.custom : e.muscle === part)) && (!q || e.name.toLowerCase().includes(q)));
    if (!list.length) return `<div class="empty">${part === "Custom" && !q ? "No custom exercises yet. Tap <b>New exercise</b> to add your first one." : "No exercises match."}</div>`;
    return `<div class="tiles lib">${list.map(e => `<button class="tile" data-act="lib-open" data-id="${e.id}">${e.custom ? `<span class="alt cust">Custom</span>` : ""}${media(e)}<div class="body"><h4>${esc(e.name)}</h4><p>${esc(e.muscle)} · ${esc(e.equip)} · ${e.sets} × ${esc(e.reps)}</p></div></button>`).join("")}</div>`;
  }
  function libDetail(id) {
    const e = EX[id]; if (!e) return;
    const o = modal(`<div class="lib-media">${media(e)}</div><h3 style="margin-top:14px">${esc(e.name)}</h3>
      <div class="pills" style="margin-bottom:10px">${tag(e.muscle)}<span class="pill">${esc(e.equip)}</span><span class="pill">${e.sets} × ${esc(e.reps)}</span>${e.custom ? `<span class="pill">Custom</span>` : ""}</div>
      <ol style="margin:0 0 8px;padding-left:20px;color:#d6dcd9">${e.cues.map(c => `<li>${esc(c)}</li>`).join("")}</ol><p class="avoid" style="color:var(--danger);font-size:13px;margin:0">Avoid: ${esc(e.avoid)}</p>
      <div class="foot">${e.custom ? `<button class="btn" id="ld-edit">${I("edit")} Edit</button>` : ""}<button class="btn primary" data-close>Close</button></div>`);
    Anim.mountAll(o);
    if (e.custom) o.querySelector("#ld-edit").onclick = () => { o.remove(); exerciseForm(e); };
  }

  /* ---------------- router ---------------- */
  function go(screen) { S.screen = screen; render(); scrollTo(0, 0); }
  function render() {
    syncCustom();
    if (!U) { document.body.classList.remove("has-bottomnav"); return renderAuth(); }
    if (S.screen === "wizard" || !U.plan) { document.body.classList.remove("has-bottomnav"); if (!U.draft) U.draft = { profile: {}, count: 0, days: [], parts: {}, ex: {} }; S.step = S.step || U.draft.step || 1; return renderWizard(); }
    renderHome();
  }

  /* ---------------- boot ---------------- */
  function boot() {
  U = loadSession();
  if (!U && TEST_MODE) {
    const id = "test-user";
    U = store.get(LS.user(id), null) || { id, name: "Test user", email: "test@local", salt: "", pass: "", created: Date.now(), profile: {}, plan: null, done: {}, draft: null };
    if (!users().some(u => u.id === id)) store.set(LS.users, users().concat([{ id, name: U.name, email: U.email }]));
    saveUser(); store.set(LS.session, id); S.screen = U.plan ? "home" : "wizard";
  }
  if (U) { if (U.draft && (U.draft.editing || !U.plan)) { S.screen = "wizard"; S.step = U.draft.step || 1; } else S.screen = U.plan ? "home" : "wizard"; }
  render();
  }
  boot();
  addEventListener("hashchange", () => { if (S.screen === "home" && U && U.plan) { const keep = S.homeDay; render(); if (keep) { S.homeDay = keep; rerenderWorkout(); } scrollTo(0, 0); } });
  addEventListener("online", () => { if (S.screen === "home") render(); });
  addEventListener("offline", () => { if (S.screen === "home") render(); });

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").then(reg => {
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing; nw && nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) toast("App updated — reopen to use the new version");
          if (nw.state === "activated" && !navigator.serviceWorker.controller) toast("Ready to work offline");
        });
      });
    }).catch(() => {});
  }
})();
