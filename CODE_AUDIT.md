# MatchA code audit — 18 September 2026

Read-only pass over `frontend/src` (79 files, 21,775 lines) and `backend`
(34 files, 5,919 lines). No source was modified.

Every finding below is marked **proven** (reproduced against the running app or
read directly from source) or **latent** (correct today, fragile by
construction). Six items my automated sweeps flagged turned out to be false
positives; they are listed at the end so nobody re-opens them.

---

## 1. Cart and checkout — the money path

### 1.1 Quantity changes send the wrong number to the server — **HIGH, proven**

**File** `frontend/src/context/CartContext.jsx`
**Function** `updateQty`, lines 90–106

`newCalculatedQty` is declared outside the state updater, assigned *inside* it,
and read *after* it on the way to the API:

```js
let newCalculatedQty = 1;
setCartItems((prev) => prev.map((item) => { … newCalculatedQty = qty; … }));
api.updateCartItem(key, newCalculatedQty);   // may still be 1
```

React does not promise to run an updater synchronously. A single click happens
to work because React eagerly computes state when the update queue is empty —
an internal optimisation, not a contract. The moment a second update is already
queued, the eager path is skipped, the updater has not run, and the initial `1`
is sent.

Reproduced in the browser. Three clicks on `+` in one tick:

| | |
| --- | --- |
| Quantity in the UI | 7 → **10** |
| Quantities sent to the server | **8, 1, 1** |

Last write wins, so the server cart ends on **1** while the shopper sees **10**.
Nothing surfaces the disagreement because every screen reads local state.

**Fix** Compute the quantity before dispatching, and let the updater use that
value rather than produce it:

```js
const current = cartItems.find((i) => getCartKey(i) === key);
const nextQty = Math.max(1, (current?.quantity || 1) + delta);
setCartItems((prev) => prev.map((i) => getCartKey(i) === key ? { ...i, quantity: nextQty } : i));
api.updateCartItem(key, nextQty).catch(…);
```

State updaters must be pure. `updateProfile` in `AuthContext.jsx` has the same
shape — it writes to `localStorage` inside a `setCurrentUser` updater — and
should be corrected with it.

### 1.2 The server-side cart is never emptied after an order — **HIGH, from source**

**Files** `frontend/src/context/CartContext.jsx:118` (`clearCart`),
`frontend/src/pages/PaymentPage.jsx:148`, `backend/routes/cartRoutes.js`,
`backend/routes/orderRoutes.js`

`clearCart()` resets local state only. There is no clear-all route on the
server — `cartRoutes.js` exposes `POST /`, `PUT /:itemId`, `DELETE /:itemId`
and `POST /merge`, nothing else — and `orderRoutes.js` never touches the cart
collection.

So every item a person has ever ordered stays in their server cart forever.
This is invisible today only because the cart was never attached to an account
(see 2.2, fixed on `backend/cart-identity`); once it is, a second device shows
a bag full of things already bought.

**Fix** Add `DELETE /api/cart` on the server and call it from `clearCart`, or
clear the owner's cart inside the order handler once the order is written. The
second is preferable — it keeps the two consistent even if a client dies
mid-checkout.

### 1.3 `getCartKey` is defined twice and the definitions disagree — **MEDIUM, latent**

**Files** `frontend/src/context/CartContext.jsx:10`, `frontend/src/pages/CartPage.jsx:10`

```js
// context — falls back to productId
`${item.id || item.productId}-${item.size || 'default'}-${item.color || 'default'}`
// page  — does not
`${item.id}-${item.size || 'default'}-${item.color || 'default'}`
```

The cart page computes the keys it hands to `onRemove` and `onUpdateQty`, and
the context matches them against its own. For any item carrying `productId` but
no `id` the two disagree, and that row silently cannot be removed or changed.
No current path produces such an item, which is exactly why this will be found
the hard way.

**Fix** Delete the local copy; import the exported one. `parsePrice` is
duplicated across the same two files and should go the same way.

---

## 2. Authentication and accounts

### 2.1 Signing in throws when storage is unavailable — **HIGH, from source**

**File** `frontend/src/context/AuthContext.jsx`, lines 31–52
**Functions** `login`, `logout`, `updateProfile`

`loadInitialUser` wraps its read in `try/catch` and even carries a comment about
private mode. The three writers do not:

```js
localStorage.setItem('matcha_user', JSON.stringify(userData));   // login
localStorage.removeItem('matcha_user');                          // logout
localStorage.setItem('matcha_user', JSON.stringify(nextUser));   // updateProfile
```

Safari private browsing, blocked site data, and a full storage quota all throw
on `setItem`. The throw happens inside a React event handler, so it reaches the
error boundary: the visitor is signed in on the server, holds a token, and sees
a crash screen.

**Fix** Give the writers the same `try/catch` the reader has, and treat storage
as a convenience — the session should survive its absence for the current page
even if it cannot persist.

### 2.2 Two parallel user systems — **MEDIUM, architectural**

**Files** `backend/services/userStore.js` (JSON file, ids `u_…`, bcrypt cost 12),
`backend/models/User.js` (Mongo, `ObjectId`, bcrypt cost 10)

`routes/auth.js` uses the JSON store. `models/User.js` is imported once, by
`middleware/auth.js`, and is otherwise unused. The two disagree on what a user
id looks like, which is the direct cause of the cart bug fixed on
`backend/cart-identity`: `Cart.userId` was declared `ObjectId` and the gate
`ObjectId.isValid()` rejected every `u_…` id in silence.

Both hash passwords properly and `backend/data/users.json` is correctly
gitignored and untracked, so there is no credential exposure. The risk is
future: any new collection that references a user will make the same wrong
assumption.

**Fix** Pick one. If the JSON store is the system of record, delete
`models/User.js` and type every `userId` as `String`. If Mongo is the
destination, migrate and retire the store. Leaving both is what produced the
bug.

### 2.3 Raw error messages returned to clients — **MEDIUM**

**File** `backend/routes/auth.js`, lines 81 and 107

```js
res.status(500).json({ success: false, message: err.message });
```

On register and login. A driver error can carry index names, collection names
or connection details. These are the two endpoints most worth probing.

**Fix** Log `err` server-side; return a fixed sentence.

### 2.4 CORS reflects any origin with credentials — **MEDIUM**

**File** `backend/server.js:37` — `app.use(cors({ origin: true, credentials: true }))`

`origin: true` echoes whatever `Origin` arrives and allows credentials, so any
site can make credentialed cross-origin calls. Impact is reduced because the
token lives in `localStorage` rather than a cookie, so it is not attached
automatically — but the setting is wider than anything here needs.

**Fix** An allow-list from the environment: the deployed front end, plus
localhost in development.

### 2.5 Rate limiting covers only auth and media upload — **LOW**

**Files** `backend/routes/auth.js:11`, `backend/routes/mediaRoutes.js:103`

`/api/cart`, `/api/orders` and `/api/products` have none. Order creation is the
one worth protecting.

---

## 3. Admin console

### 3.1 `localStorage` used as the database — **MEDIUM**

**File** `frontend/src/pages/AdminPage.jsx`, lines 188, 227, 325, 329, 333

Inventory, orders and members are read from and written to `localStorage` on
every change, unguarded:

```js
useEffect(() => { localStorage.setItem('matcha_admin_inventory', JSON.stringify(inventory)); }, [inventory]);
```

Three consequences: it throws where storage is blocked (as 2.1); the write fires
on mount and overwrites the stored copy with whatever was just loaded; and two
administrators never see each other's changes. The file does fetch real data
from the API on mount, so the local copy is a cache pretending to be a store.

**Fix** Guard the writes now. Longer term the API already returns this data —
the local copy should be a cache with an explicit refresh, not the source.

### 3.2 `AdminPage.jsx` is 1,456 lines — **LOW**

One component holds inventory, orders, members, media and the KPI panel, with
214 hardcoded hex values across 16 distinct colours. It is the least reviewable
file in the project. Splitting by tab would make it ordinary.

---

## 4. Cross-cutting

### 4.1 Every route change remounts the whole page — **MEDIUM, proven**

**File** `frontend/src/App.jsx:272` — `<ErrorBoundary key={location.pathname}>`

Keying by pathname resets the boundary per route, which is the intent, but it
also throws away the entire subtree on every navigation: form state, scroll
position, and any in-flight work. This was hit directly while building the
combined access page — switching between `/login` and `/signup` wiped the form —
and was worked around there by not navigating.

**Fix** Key the boundary by a coarser value (a route group), or give it a
`resetKeys` prop and let it clear its own error without discarding the tree.

### 4.2 The data migrations are not in the repository — **HIGH for reproducibility**

**Files** `backend/scripts/addEnglishDescriptions.mjs`,
`backend/scripts/fixProductColors.mjs`
**Rule** `.gitignore` — `backend/scripts/*` with three named exceptions

Both scripts are ignored and untracked. They are the only record of two
migrations already applied to Atlas: the colour repair (44 documents) and the
English descriptions (76 documents). If the database is reseeded from
`seed.js`, both are lost and nothing in the repository can redo them.

**Fix** Add them to the exception list beside `seed.js`. They are idempotent and
each writes a backup before touching anything.

### 4.3 Colour values are hardcoded throughout — **LOW**

1,200-odd hex literals across the front end; the heaviest are `AdminPage.jsx`
(214), `ProductModal.jsx` (143) and `MixMatchStudioPage.jsx` (121).
`index.css` already declares the palette as custom properties and almost nothing
reads them. A rename of the brand red means editing hundreds of call sites.

### 4.4 Naming collision on `SHIPPING_OPTIONS` — **LOW**

**File** `frontend/src/pages/PaymentPage.jsx:13, 25`

The file imports `SHIPPING_OPTIONS as SHIPPING_RATES` from config and then
declares its own `SHIPPING_OPTIONS`, a different shape. The prices are derived
from the import, so there is no money divergence — but `config/shipping.js`
carries a comment about a past bug of exactly this kind ($10 on the cart against
$0 at checkout), and this is how that returns.

### 4.5 Unused import — **LOW**

`frontend/src/App.jsx` imports `Navigate` from `react-router-dom`; nothing uses
it. The 23 `import React` statements the sweep also flagged are not bugs: the
project uses the automatic JSX runtime, so they are unnecessary but harmless.

---

## Checked and found sound

Recorded so these are not re-investigated:

- `pages/UserAccount.jsx:66` — has a dependency array, a `.catch`, and an
  `isMounted` guard. My brace counter mis-parsed it.
- `pages/AdminPage.jsx:239` — closes with `}, []);`; same parser limit.
- `hooks/useStreetProducts.js:26` — `.catch().finally()` with an `active`
  guard. Its `while (more)` loop has no page cap, but the server returns
  `hasNextPage: false` correctly (verified live), so it terminates.
- `components/product/ProductModal.jsx:79` — the wishlist write is inside a
  `try/catch`.
- Password storage — `userStore.js` uses `bcrypt` at cost 12;
  `backend/data/users.json` is gitignored and untracked.
- `getJwtSecret` — refuses to fall back to the dev secret when
  `NODE_ENV === 'production'`.
- No dead files and no unused npm dependencies.

---

## Proposed order of work

### High

1. **`updateQty` race** (1.1) — proven wrong quantities on the money path. Small, contained fix.
2. **Server cart never cleared** (1.2) — needs a backend route or an order-handler change.
3. **Unguarded storage writes in `AuthContext`** (2.1) — three `try/catch` blocks.
4. **Track the migration scripts** (4.2) — a `.gitignore` line; the work is otherwise unreproducible.

### Medium

5. `getCartKey` duplication (1.3) — delete the copy, import the export.
6. Raw error messages on auth routes (2.3).
7. CORS allow-list (2.4).
8. Admin `localStorage` writes (3.1) — guard now, re-architect later.
9. ErrorBoundary remount (4.1) — affects every page, so worth doing deliberately.
10. Decide between the two user systems (2.2) — design decision before code.

### Low

11. Rate-limit `/api/orders` (2.5).
12. Lift colours onto the existing custom properties (4.3).
13. Rename the shipping collision (4.4); drop the unused `Navigate` import (4.5).
14. Split `AdminPage.jsx` by tab (3.2).

Items 1–4 are independent of each other and of anything else in progress. 9 and
10 are the two that touch enough of the codebase to be worth scheduling rather
than slipping in.
