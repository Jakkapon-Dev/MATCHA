# Admin data follow-up — 2026-09-19

Base: main / origin/main da6f3aa (local refs; no remote fetch).

## Changes
- GET /api/users is administrator-only, projects safe account fields, and aggregates order counts and confirmed paid totals by user ID. Old orders with null userId are not attributed by guessing an email match.
- PUT /api/users/:id accepts membership tier only; rejects role/password changes.
- GET /api/admin/products and /api/admin/orders read Mongo directly with no storefront demo fallback or legacy 50-order / 100-product truncation.
- Admin starts with empty data and explicit loading/error states. Refresh reads the server; no admin records are loaded from or written to localStorage. The loaded state is an in-memory cache.
- Failed writes leave the UI data unchanged. Product and order mutations require a live database. Order updates now require administrator authorization and validate status values.
- Monthly analytics are computed from confirmed paid orders; fabricated growth, targets, margins, and conversion values were removed. The JSON download is labeled a report, not a restorable database backup.
- Six presentation tabs and data normalization/loading are separate modules.
- The existing ToastProvider supplies no-op callbacks. Admin therefore displays save success/error inline; the global toast behavior was not changed.

## Validation
- Backend tests cover authorization, field projection, tier updates, unavailable databases, empty results, normalization and paid revenue.
- Frontend production build.
- Local browser checks against a disposable fixture API: registered-member display, VIP save, error and empty states, failed-write preservation, and two independently loaded admin tabs refreshing stock from 5 to 7.
- Desktop and 390px mobile inspection; no production data used or modified.

## Deployment
Changes are local and are not committed, pushed or deployed. Deploy the backend routes before the frontend; no new environment variables or database migration are required. Production smoke checks remain: member directory, tier update and reload, stock refresh from a second session.

## Remaining concerns
- The existing public GET /api/orders route can return recent orders without authentication (and allows email filtering). This predates this change; the new admin endpoint is protected, but the public route needs a separate ownership/access-control fix together with the guest tracking flow.
- Admin list endpoints currently load all records. For a much larger store, add paginated lists and server-side report aggregation together so summaries do not silently become partial.
- Branch activity cannot be inferred from commit ancestry. Preserve the unmerged branches below until their owners confirm whether the work is active or superseded. A zero patch count means equivalent content exists in main, not that the commit is an ancestor.

## Branch audit and recovery references
Only the nine non-main branches with zero ahead commits are selected for local deletion. No remote branches or unmerged work are deleted. Restore any deleted local branch with `git branch <name> <SHA>`.

| Branch | SHA before cleanup | Commits ahead | Patches absent from main | Action |
|---|---|---:|---:|---|
| backend/audit-fixes | 6ceeee8db723864105f61ad226b72428043781d8 | 0 | 0 | Delete merged local ref |
| backend/auth-mongo | 34f36f30d0e035e8f7bc21242a88520b186340e2 | 0 | 0 | Delete merged local ref |
| backend/cart-identity | 4717cfe0c263064895dd257be773103709dc30f1 | 1 | 0 | Preserve; review with owner |
| design/home-swatch | fb2bc62ff994d11f1d867e605dc0f8def3515681 | 1 | 1 | Preserve; review with owner |
| feat/backend-auth-media-lookbook | 8c1da412ed0debbedf4f9d1b73873852a66fc1c2 | 2 | 2 | Preserve; review with owner |
| feat/backend-auth-security | b6a4e0785425dfa5271067bd6eb18312ded66d66 | 5 | 5 | Preserve; review with owner |
| feat/backend-cart-api | fbd1d8eb58924b4f27b3e911d27f7898510d0bb7 | 2 | 2 | Preserve; review with owner |
| feat/backend-database-setup | aff4ff6a5cf603e52408b67a40d81e0476b97ad8 | 1 | 1 | Preserve; review with owner |
| feat/backend-esm-modules | ea027b35774c2a650bfef28edc075e0f3ecc11bf | 0 | 0 | Delete merged local ref |
| feat/backend-lookbook-media | 39df29ebc319689dd3b6cf2a423037d534258bb9 | 6 | 6 | Preserve; review with owner |
| feat/backend-orders-api | ca98dc539cc3694642ebdc6f32d134dd60e4953f | 4 | 4 | Preserve; review with owner |
| feat/backend-products-api | 03eb7e6f753b1fd177862a7285d991ee7b11c3be | 3 | 3 | Preserve; review with owner |
| feat/backend-setup | b190c71df3ec315a3703428d843a51d2c14e23c9 | 0 | 0 | Delete merged local ref |
| feat/backend-tests-seeding | bbe6cbe1013a3baaee16161cef7642f0092154b0 | 10 | 10 | Preserve; review with owner |
| feat/update-backend-cloud-connection | 1d5f70db97fb8b30579ef0ac14a9bbd0e09c1df3 | 0 | 0 | Delete merged local ref |
| feat/update-frontend-only | dd247d1ad72d883c15556f80b115aea5b66bc2c6 | 0 | 0 | Delete merged local ref |
| feature/lookbook-media | a4b0f0014d56a4c7f3ef939320fed7b86ced5657 | 0 | 0 | Delete merged local ref |
| fix | 777bf1552d9546b13baf60ead777b12a578f0af8 | 0 | 0 | Delete merged local ref |
| frontend/audit-fixes | d02e6fe4a436e83e4cec2a8bff91b2351280766e | 0 | 0 | Delete merged local ref |
| main | da6f3aae41c7a8e5590bc2ffcc89af819282d6a6 | 0 | 0 | Keep main |
