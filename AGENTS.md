# AGENTS.md — MatchA

Instructions for AI coding agents working in this repository.
Where docs disagree, trust current source code first, then tests, config files and `package.json`, then README/docs.

## 1. Project overview

MatchA is a full-stack fashion e-commerce web app. Its main features are:
- product catalog, cart and checkout
- member accounts and admin dashboard
- Personal Color quiz, Mix & Match studio and editorial Lookbook

The app is multilingual (`frontend/src/i18n/`). Thai is the main language for UI copy and user-facing error messages, including backend error messages. Match the language and tone of the code around your change.

## 2. Repository structure

```
backend/          Express REST API (ESM, no build step)
  server.js       entry point (default port 5001)
  config/         store mode, Stripe, coupons, currency, payment states, frontend URL
  controllers/    request handlers
  middleware/     auth guard, error handler
  models/         Mongoose schemas (the User schema is in services/userStore.js)
  routes/         API routers, mounted in server.js
  services/       email, media storage, notifications, reservation sweeper,
                  rate-limit store, Mongo safety guard, user store, ...
  scripts/        seed, migration, backup/restore, repair and data-fix scripts
  tests/          node:test suites (*.test.js)
frontend/         React + Vite client
  index.html → src/main.jsx → src/App.jsx
  src/pages/ components/ features/ context/ hooks/ services/ i18n/ config/ utils/ styles/
  public/         static assets
  vite.config.js  Vite + Vitest config and dev proxy
  vercel.json     production rewrites (/api → backend, SPA fallback)
e2e/              Playwright specs; fixtures/ holds global setup/teardown
test-support/     shared test helpers
docs/             PRODUCT.md, design/, plans/, runbooks/ (other docs/ content is gitignored)
playwright.config.js, package.json (root orchestration scripts)
```

## 3. Stack

- **Frontend:** React 18, Vite 6, React Router 7, Tailwind CSS v4 (`@tailwindcss/vite`), motion, lenis, lucide-react, Stripe Elements, Firebase client SDK.
- **Backend:** Node.js with Express 4, Mongoose 9 (MongoDB Atlas), zod, jsonwebtoken + bcryptjs, helmet, cors, compression, express-rate-limit, multer + sharp + Cloudinary, Stripe SDK. Email is sent through Resend.
- **Auth:**
  - Session: JWT, stored client-side in localStorage.
  - Firebase: used for sign-in, verification, reset and account linking. The backend verifies Firebase ID tokens.
- **Language:** JavaScript/JSX only (no TypeScript). ES modules everywhere (`"type": "module"`), so use `import`, not `require`.
- **Deployment:** frontend on Vercel, backend on Render.

## 4. Package manager

- npm only. There are three separate lockfiles: root, `backend/` and `frontend/`.
- These are not npm workspaces. Install and run each package with `--prefix` or from its own directory.
- Do not switch to or add another package manager.
- Do not install, remove or upgrade dependencies without permission.

## 5. Commands

Run these from the repo root unless a directory is shown.

| Purpose | Command |
|---|---|
| Install everything | `npm run install:all` |
| Dev (backend + frontend) | `npm run dev` |
| Dev (one side only) | `npm run dev:backend` / `npm run dev:frontend` |
| Build | `npm run build` (frontend only; the backend has no build step) |
| Backend tests | `cd backend && npm test` (needs `TEST_MONGODB_URI`) |
| Frontend tests | `cd frontend && npm test` (Vitest, jsdom) |
| E2E tests | `npm run test:e2e` (Playwright; needs `TEST_MONGODB_URI`) |
| E2E report | `npm run test:e2e:report` |

- In dev, the frontend runs on `:5173` and Vite proxies `/api` to `127.0.0.1:5001`.
- No linter or formatter is configured. Follow the style of the surrounding code, and don't add lint or format tooling unless asked.

## 6. Architectural constraints

- **Store mode:** `backend/config/storeMode.js` treats any `SHOP_MODE` other than `'live'` as demo mode (fake stock, stubbed checkout). Read this file before changing cart, order, stock or payment logic.
- **Stripe webhook:** it is mounted with `express.raw()` **before** `express.json()` in `server.js`. Keep that order, or webhook signature verification breaks.
- **Routes:** add new routers in `backend/routes/` and mount them in `server.js`.
- **DNS pin:** `server.js` currently pins DNS to 8.8.8.8/1.1.1.1. This is existing behavior. Do not change or remove it without investigation and explicit approval.
- **Validation:** validate request input with zod, following the existing pattern.
- **Production API path:** the frontend reaches the backend through relative `/api` paths (the Vite proxy in dev, `vercel.json` rewrites in production). Don't hardcode backend URLs in frontend code.

## 7. Environment and secret safety

- **Never read, print, commit or modify real `.env` files** (`backend/.env`, `frontend/.env`) unless the user explicitly asks.
- To learn which variables exist, read `backend/.env.example` and `frontend/.env.example`. Use variable names only.
- Some variables the code reads are not in `.env.example`, for example `CORS_ORIGINS`. Search the code for `process.env.` / `import.meta.env.` before assuming a variable doesn't exist.
- Never put secrets in frontend code or in `VITE_*` variables. Secrets such as `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` belong to the backend only.
- Never paste secrets, tokens, connection strings or credentials into code, tests, docs, logs, commits or chat.
- When you add a new variable, add its name, with a placeholder value, to the matching `.env.example`.

## 8. Database safety

- **Never run** anything in `backend/scripts/` (seed, migrate, backup, restore, repair, sync, fix or clean scripts) or the npm scripts that wrap them (`seed`, `seed:users`, `repair:stock-totals`, `bundle:demo-media`) without explicit permission. They act on whatever database the environment points to.
- **Test mode:** when `NODE_ENV=test` or `IS_E2E=true`, the backend requires `TEST_MONGODB_URI` and refuses to fall back to `MONGODB_URI`.
- **Safety guard:** `backend/services/mongoSafetyGuard.js` and `e2e/fixtures/global-setup.js` check that the test database name and host are safe.
- **Never weaken, bypass or remove these guards**, including the fallback block in `server.js`.
- **Don't point tests at a non-test database**, and don't make test code write to one.
- **Playwright can reuse an already-running server.** Outside CI it reuses servers already running on ports 5001 and 5173. Before running E2E, make sure no normal dev backend is running on 5001, so that Playwright starts one in test mode.

## 9. Git safety

- **Never push, merge, rebase shared branches, deploy, or delete branches** without explicit permission.
- **Don't commit unless the user asks.**
  - When you do commit, make **one fix per commit** and keep unrelated changes out of it.
  - Never add AI or assistant attribution (e.g. `Co-Authored-By`) to commits.
- **Branch names:** `feat/*`, `fix/*`, `chore/*`, `test/*`, `docs/*`.
- **Other git state:**
  - Don't change git config.
  - Don't drop stashes.
  - Don't switch branches without permission.
- **Sibling worktrees:** sibling folders of the repo root (for example `../worktree-*`) may be separate git worktrees. Don't edit them unless asked.

## 10. Testing expectations

- **Backend:**
  - Any auth, order, payment, cart or media change needs a new or updated test in `backend/tests/` (`node:test`, `*.test.js`).
  - Backend tests need `TEST_MONGODB_URI`. If it isn't available, say so; don't redirect tests to another database.
- **Frontend:**
  - When you change frontend logic, add or extend a test file next to the code under `frontend/src/` (`*.test.js` / `*.test.jsx`).
  - Vitest only picks up tests under `src/`.
- **E2E:** add or update `e2e/*.spec.js` for changes to user flows (auth, account, access control, responsive layout).
- **Reporting:** report the actual test results. Never state pass counts you didn't observe.

## 11. Treat carefully

| Path | Rule |
|---|---|
| `backend/.env`, `frontend/.env` | Don't read or edit (see §7) |
| `backend/scripts/` | Don't run without permission (see §8) |
| `backend/services/mongoSafetyGuard.js`, `e2e/fixtures/global-*.js` | Safety-critical; don't weaken |
| `backend/server.js` | Middleware order, CORS, webhook mount, DNS pin, test-DB guard |
| `backend/config/storeMode.js`, `paymentStates.js`, `coupons.js`, `stripe.js` | Money and stock logic; change carefully, with tests |
| `backend/middleware/auth.js`, `backend/routes/auth.js` | Auth and account-linking security |
| `frontend/vercel.json` | Production routing |
| `backend/storage/`, `backend/logs/`, `backend/backups/` | Runtime data and backups; don't edit, delete or commit |
| `frontend/dist/`, `playwright-report/`, `test-results/`, `node_modules/` | Generated; don't edit or commit |
| Untracked files you didn't create | Don't delete, move or commit without asking |
| `package-lock.json` (any) | Change only as part of an approved dependency change |

## 12. Definition of done

1. The change is limited to the task. No unrelated edits, formatting churn or drive-by refactors.
2. `git status` and `git diff` have been reviewed, and only the intended files changed.
3. Relevant tests were added or updated (§10).
4. Relevant tests were run when it was safe to do so (a test database is available and no production data is involved), and the actual results were reported. If they couldn't be run, the reason was stated.
5. `npm run build` passes for frontend changes, when it's safe to run.
6. `.env.example` is updated for any new environment variable, and docs are updated if commands or behavior changed.
7. No secrets, real `.env` values or credentials appear in the diff.
8. Nothing was committed, pushed, merged, deployed or deleted without explicit permission.
