# Sheaf — AI-assisted resume & portfolio builder

**Devloria Internship — Round 2, Full Stack Track, Project 9**
Frontend (React) submission.

Sheaf is a guided resume builder. You answer seven short steps, the finished A4 page
re-typesets beside you on every keystroke, and an assist reads any bullet point and
offers three sharper rewrites.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

Node 18+ required. No environment variables and no backend needed — see
[Where the backend plugs in](#where-the-backend-plugs-in).

**Fastest way to look around:** open `/login` and press **Use the demo account**. It
creates `demo@sheaf.app` on first use and drops you straight into the dashboard, where
"Open the example" gives you a fully filled document to play with.

---

## The five required features, and where each lives

| Requirement | Where |
|---|---|
| Auth system with saved drafts | `src/context/AuthContext.jsx`, `src/pages/Login.jsx`, `src/pages/Signup.jsx`; route guards in `src/App.jsx` |
| Guided multi-section form | `src/pages/Builder.jsx` + the seven steps in `src/components/builder/steps/` |
| Live preview panel | `src/components/preview/ResumePage.jsx` — a pure function of the document, so it re-renders as you type |
| AI-assist on a bullet point | `src/lib/aiAssist.js` (engine) + `src/components/builder/AssistPanel.jsx` (UI) |
| Export / shareable link | `StepReview.jsx` — `window.print()` produces a real A4 PDF; publish toggle exposes `/r/:slug` |

## Pages (11)

`/` landing · `/templates` · `/how-it-works` · `/pricing` · `/login` · `/signup` ·
`/dashboard` · `/builder/:id` · `/r/:slug` (public, no auth) · `/settings` · 404

---

## How it's built

- **React 18 + Vite** — fast dev server, plain JSX, no framework indirection.
- **React Router 6** — two route shells: marketing pages sit inside `SiteLayout`
  (header + footer); the builder and the public resume page are full-bleed with no
  site chrome.
- **Tailwind CSS 3** — the whole design system is in `tailwind.config.js`, so colours
  and type are named things (`brass`, `verdigris`, `ink`) rather than hex scattered
  through components.
- **No state library.** Two contexts (`AuthContext`, `ToastContext`) cover what's
  genuinely global. The builder holds its document in one `useState` and passes a
  `patch()` down; that's enough for a single-document editor and much easier to follow.

### Folder structure

```
src/
├── components/
│   ├── builder/        # step forms, bullet editor, assist panel
│   ├── layout/         # header, footer, wordmark
│   ├── preview/        # the A4 page and its auto-scaling frame
│   └── ui/             # button, field, modal, feedback primitives
├── context/            # auth + toasts
├── lib/                # aiAssist, storage, templates, utils
└── pages/              # one file per route
```

### Design direction

Letterpress metal: ink navy for the workshop, brass for the accent, verdigris (the
patina brass grows) for success states, warm paper for the ground. The app chrome is
set in Bricolage Grotesque and Public Sans; the resume itself is set in Source Serif 4,
because the artifact should look like a document while the tool around it looks like a
tool. Crop marks frame the live page — the structural motif that a resume is something
destined for print.

### Three things worth pointing out

**The page is a pure render of the document.** `ResumePage` takes the resume object and
returns the sheet. No effects, no syncing, no separate preview state — which is why the
live preview works at all, and why the same component is what the browser prints.

**Autosave is debounced, and says so.** The builder saves 700ms after you stop typing
and the header shows `saving → saved 3s ago`. If you try to close the tab mid-save,
`beforeunload` stops you.

**The assist won't invent your numbers.** Where a bullet has no metric, the rewrite
inserts `[X]` for you to fill rather than a plausible-sounding figure. A made-up number
on a resume is something you have to defend in an interview.

---

## Where the backend plugs in

Two files are the entire seam. Nothing above them knows the difference.

**`src/lib/storage.js`** — every function already has the shape of an API call: async,
throws on failure, returns the record. Replace the bodies with `fetch()` and the app is
on your server.

```js
export async function listResumes(userId) {
  const res = await fetch('/api/resumes');
  if (!res.ok) throw new Error('Your documents could not be loaded.');
  return res.json();
}
```

**`src/lib/aiAssist.js`** — `improveBullet()` is the one function to swap. The file ends
with the exact replacement and the server-side prompt to pair with it, including the
instruction that makes the model emit `[X]` placeholders instead of inventing metrics.

Both files currently use `localStorage` and a local rules engine so the frontend runs
and demos standalone. Deliberate artificial latency (300–900ms) is baked in so every
loading state is real rather than decorative, and `improveBullet` fails ~4% of the time
on purpose so the error path gets exercised in development — there's a marked line to
delete once the real API is live.

---

## Deploying

Static build, works anywhere. SPA rewrites are already configured:
`public/_redirects` (Netlify) and `vercel.json` (Vercel).

```
Build command:    npm run build
Publish directory: dist
```

---

## Quality checklist

- Responsive at every route — the builder collapses its preview column into a modal
  below `lg`, and the resume page scales via `ResizeObserver` rather than breakpoints.
- Keyboard navigable: one visible focus ring everywhere, focus trapped and restored in
  modals, `Alt + ←/→` moves between builder steps.
- `prefers-reduced-motion` removes all animation, including the landing-page demo,
  which falls back to showing its finished state.
- Loading, empty, and error states are designed rather than defaulted — the empty
  dashboard offers a worked example, and a failed assist tells you your text is
  untouched.
- Production build verified clean; all 11 routes verified to mount and render, and the
  assist engine, completeness scoring, and validators checked against expected output.

## Honest limitations

- Accounts live in `localStorage`, so they're per-browser and the password is not
  hashed. Fine for a frontend demo, replaced the moment the API lands.
- The assist is a rules engine, not a model. It finds real problems (passive voice,
  duty-verb openings, hedging, missing metrics) and fixes them, but it doesn't
  understand your job. The swap point is documented above.
- PDF export goes through the browser print dialog rather than a server-side renderer.
  It produces a correct A4 file; it just needs the user to pick "Save as PDF".

---

Built for the Devloria internship, Round 2. Design, copy, and code are original;
no reference site's layout, colours, or marks were copied.
