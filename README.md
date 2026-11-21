# Training Dude

Offline-first workout planner (installable web app).

- **Profile:** each person enters weight, height and goal.
- **Plan:** they pick training days and body parts, and the app builds the weekly plan.
- **Exercises:** looping photos, a weight log, and swap alternatives.
- **Streak:** counts workouts done in a row. Planned rest days never break it; a missed training day does. Finishing a day's workout plays the weekly streak animation.

## Put it on GitHub Pages
1. Create a new repository on GitHub (e.g. `training-dude`). It must be **public** for free GitHub Pages.
2. Upload **everything inside this folder**:
   - Keep `img/`, `js/`, `css/`, `icons/`, `fonts/`.
   - Keep `.nojekyll`.
3. Go to Repo → **Settings → Pages**. Set Source to *Deploy from a branch*, Branch to `main` and folder to `/ (root)`, then Save.
4. Open `https://<your-username>.github.io/training-dude/` once with internet.
   - It saves itself (about 20 MB, all exercise photos included).
   - After that it works offline.
5. On iPhone: Safari → Share → **Add to Home Screen**.

## Updating
- After changing any file, regenerate the service worker so phones get the update. Run this from the project root (the folder that contains `build/`):
  `python3 build/make_sw.py .`
- Then commit and push.
- Installed copies pick up the new version the next time they open online.

## Notes
- **Accounts:** stored on each device (browser storage). Use *Menu → Export backup / Import backup* to move data, streak included.
- **Exercise photos:** Free Exercise DB by yuhonas (public domain / Unlicense).
- **Fonts:** Barlow Condensed and Inter (SIL Open Font License, in `fonts/`).
- **Rebuilding the exercise library:** `python3 build/exercises.py . && python3 build/expand.py . build/free-exercise-db.json`
  - Download `free-exercise-db.json` from github.com/yuhonas/free-exercise-db first.

## Test mode
`TEST_MODE = true` at the top of `js/app.js` skips sign-up and uses one local profile (menu → *Reset & start over*). Set it to `false` to bring back sign-up / log in.
