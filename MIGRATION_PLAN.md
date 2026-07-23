# Showcase IT — Migration Plan (PHP/MySQL → React/Node/Postgres)

This is a **framework migration, not a redesign**. Every workflow, calculation, validation rule,
permission check, and (unless explicitly flagged below) bug/quirk in the current PHP app is to be
carried forward faithfully into the new stack. This document is the source of truth for scope,
ordering, and the handful of judgment calls that had to be made because the legacy code is
inconsistent or incomplete in places.

Source analyzed: `main` @ `ae58504` (this branch, `migration/node-react-postgres`, was created from
`main`). The in-progress `feature/boq-stock-requisitions` branch was also inspected read-only
(`git show <branch>:<path>`) because it contains the only working implementation of the BOQ module
— see "Scope decision: BOQ module" below.

---

## 1. Target architecture

```
repo/
  client/    React 19 + TS + Vite + React Router + React Query + Axios + Tailwind + shadcn/ui + TanStack Table
  server/    Node + Express + TS + Prisma
    src/
      config/         env loading, constants (role enum, status enums)
      controllers/     thin — parse req, call service, shape response
      services/        business logic (the translated PHP logic lives here)
      repositories/     Prisma queries, one per entity
      middleware/       auth (JWT verify), requireRole, error handler, multer config
      routes/          one router per module, mounted under /api
      validations/      Zod schemas per endpoint
      types/           shared TS types / DTOs
      utils/           pdf (Puppeteer), file naming, number formatting
    prisma/
      schema.prisma
      migrations/
      seed.ts
```

Controller → Service → Repository → Prisma, per the brief. No business logic in controllers.

## 2. Scope decisions (read before building)

These are the places the legacy code was ambiguous, broken, or incomplete, and a call had to be
made. Flagging instead of silently resolving, per instructions.

### 2.1 BOQ module source of truth
`main` has `php_action/downloadBOQ.php` (reads from `boq`/`boq_items` tables) but **no
`createBOQ.php`** — there is no code path on `main` that ever inserts a `boq` row, so BOQ
download is dead/unreachable on `main` today. The actual create flow (`createBOQ.php`, full
`boq`/`boq_items` schema, order-linking) only exists, uncommitted-then-committed, on
`feature/boq-stock-requisitions`. Since the migration brief explicitly lists "BOQ module" as a
must-preserve feature, and CLAUDE.md documents BOQ as core to the product, **the BOQ module is
scoped from `feature/boq-stock-requisitions`'s implementation**, not from bare `main`.
**Decided (2026-07-20): confirmed — BOQ is in scope, sourced from that branch.**

### 2.2 Role-string normalization
Confirmed via full-repo grep: role strings are inconsistent across three places (seed data,
`requireRole()` calls, `index.php` login switch). The **live, self-consistent** role set (used by
both the login redirect and a matching page gate) is:

`Super Admin`, `Stores Admin`, `Project Manager`, `Accountant`, `Graphic Designer`,
`Production Team`, `Logistics`

Everything else is a dead/broken path today:
- `dashboards/*.php` duplicates require `Accounts`, `Graphics`, `Marketing`, `Project Management`
  — strings nothing ever produces. These four files are unreachable.
- `productionDashboard.php` requires `"Production"` (no "Team") — unreachable via login switch,
  which only produces `"Production Team"`.
- Login switch has a case for `'Marketers'` → `dashboards/marketingDashboard.php`, but that page's
  own gate requires `"Marketing"` — a user with `user_type = 'Marketers'` gets redirected then
  immediately bounced. Broken today.
- Seed users with `user_type = 'StoresAdmin'` (no space) or `''` (empty) fall through to a
  `default: dashboardOne.php` case — a file that doesn't exist in the repo. Those accounts are
  unroutable today.

**Decided (2026-07-20):** normalize to a `Role` enum with the 7 live values above. Bugs fixed as
part of this: `StoresAdmin` → `Stores Admin`, drop the 4 dead `dashboards/*` duplicate pages and
the orphaned `productionDashboard.php`, fix the `Marketers`/`Marketing` bounce.

### 2.3 Password hashes
Seed data mixes plain MD5, PHP `crypt()`, and `password_hash()`/bcrypt. New system standardizes on
bcrypt everywhere (per target stack). Existing users will need a one-time password reset or a
migration script that re-hashes on next successful login (mirrors what `php_action/migrate_passwords.php`
already attempted for MD5). Decide approach when Module 2 (Auth) starts.

### 2.4 Known pre-existing bugs (preserve or fix — flagging, not deciding)
- `php_action/editBrand.php` runs `UPDATE brands SET ...` (table is actually `brand`, singular) —
  edit-brand likely silently fails today.
- `includes/vehicles/vehicleDocuments.php` binds a typo'd `$uploadeFile` instead of
  `$uploadedFile` — uploaded document file path is never actually saved despite the file landing
  on disk.
- Several numeric-looking columns (`product.quantity`, `product.rate`, `orders_items.quantity/rate/total`)
  are `varchar` in MySQL. New Prisma schema uses proper `Decimal`/`Int` types (an explicit,
  intentional improvement per the brief's "improve where appropriate" allowance) — application
  code will parse/validate on the way in rather than storing numeric strings.

These will be called out again at the relevant module boundary rather than fixed opportunistically.

## 3. Full data model (all tables found — stock.sql plus tables only referenced in code)

| Table | Status in stock.sql | Notes |
|---|---|---|
| brand | present | |
| category | present | |
| product | present | quantity/rate are varchar in MySQL → Int/Decimal in Postgres |
| orders | present but incomplete | missing `ongoing_since` column (datetime, nullable) used by the 24h auto-complete job |
| orders_items | present | quantity/rate/total are varchar → Decimal |
| order_assignments | present | join table, order↔user, cascade delete both sides |
| issued_tools | present | |
| users | present | |
| requisitions | **missing from dump** | reconstructed from `createRequisition.php`/`processRequisition.php` |
| vehicles | **missing from dump** | reconstructed from `includes/vehicles/*.php` |
| vehicle_documents | **missing from dump** | " |
| maintenance_logs | **missing from dump** | " |
| fuel_logs | **missing from dump** | " |
| vehicle_trips | **missing from dump** | " |
| boq | **missing from dump, missing from main entirely** | from `feature/boq-stock-requisitions` — see 2.1 |
| boq_items | **missing from dump, missing from main entirely** | " |

Full column-level detail for the reconstructed tables is in `server/prisma/schema.prisma` (Module
1 deliverable) — this doc doesn't duplicate it to avoid drift between the two.

## 4. Module order (per brief: "work module by module", each fully functional before the next)

1. **Database** — `schema.prisma`, initial migration, seed script mirroring `stock.sql` data. *(this session)*
2. **Auth** — login, JWT issue/verify, bcrypt, `requireRole` → RBAC middleware. Needs the Section
   2.2 role decision first.
3. **Users** — `manage_users.php`, `signup.php` → Users CRUD + role assignment.
4. **Categories** — `categories.php`, `createCategory.php`, `fetchCategories.php`,
   `editCategories.php`, `removeCategories.php`.
5. **Brands** — same shape as Categories (`brand.php` + `*Brand.php` family). Note the
   `UPDATE brands` bug from 2.4 — fix during this module.
6. **Products** — `product.php`, `createProduct.php` (image upload → Multer), `editProduct.php`,
   `editProductImage.php`, `fetchProduct.php`, `removeProduct.php`, `updateQuantity.php`.
7. **Inventory / Issued Tools** — `issueProduct.php`, `IssueProductReport.php`.
8. **Orders** — `manageOrder.php`/`manageOrderP.php`, `createOrder.php` (BOQ/artwork upload),
   `order_card.php` rendering logic, `update_order_status.php`, and critically the **lazy-cron
   auto status transitions** in `orders.php` (New/Assigned → On Going when `deadline_datetime`
   passes; On Going → Completed 24h after `ongoing_since`) — this runs on every page load in PHP;
   in Node this becomes either a scheduled job or a check-on-read at the top of `GET /api/orders`
   to stay behaviorally identical. Preserve the exact 24-hour window and the "self-heals on next
   read" semantics.
9. **BOQ** — per 2.1, scoped from `feature/boq-stock-requisitions`: `createBOQ.php` (order-linked,
   multi-row item entry, auto-numbered like orders: "001", "002", ...), `downloadBOQ.php` (DOMPDF → Puppeteer PDF,
   preserve the exact HTML/CSS layout).
10. **Requisitions** — `requisitions.php`, `createRequisition.php` (auto-numbered `REQ-###`,
    type-with-"Other" pattern), `processRequisition.php` (Super-Admin-only approval,
    Pending→Processed transition).
11. **Logistics / Vehicles** — `manageLogistics.php`, `includes/vehicles/vehicleRegister.php`,
    `getVehicle.php`, `getVehicleDetails.php`, `deleteVehicle.php`.
12. **Fuel Logs** — `includes/vehicles/fuelLog.php`.
13. **Maintenance Logs** — `includes/vehicles/maintananceLog.php`.
14. **Trip Logbook** — `includes/vehicles/tripLogbook.php` (status side-effects: starting a trip
    requires `vehicles.status == 'Available'` → sets `'On Trip'`; ending a trip sets
    `vehicle.status` back to `'Available'` and computes `distance_travelled`).
15. **Vehicle Documents** — `includes/vehicles/vehicleDocuments.php` (expiry status computed
    server-side: Valid/Expiring Soon/Expired based on `expiry_date` vs `reminder_days`). Fix the
    2.4 upload-path typo bug here.
16. **Reports** — `report.php`, `IssueProductReport.php`.
17. **Dashboards** — per-role stats for all 8 roles (Super Admin, Stores Admin, Project Manager,
    Marketers, Accountant, Graphic Designer, Production Team, Logistics).

Each module ships as: Prisma models already exist (Module 1) → repository → service → controller →
routes → Zod validation → React page + React Query hooks + TanStack Table where the PHP used
DataTables → manual verification against the equivalent PHP page before moving on.

## 5. Frontend page inventory (PHP page → React route)

Mirrors the file list above 1:1 — no new pages, no removed pages, same nav structure (the 5
`includes/header*.php` variants collapse into one `<AppShell role={...}>` component with
role-conditional nav items, replacing the copy-pasted-per-role headers, not the roles themselves).

## 6. Non-goals for this migration
- No new features. No workflow changes beyond the explicit bug-fixes flagged in §2.4 and the role
  cleanup pending §2.2 sign-off.
- No change to file storage layout beyond swapping `move_uploaded_file()` for Multer with
  equivalent destination paths (`uploads/`, `assets/images/stock/` → served via a static/Express
  route since the old code had no dedicated file-serving endpoint either — this one's a forced
  change since Node doesn't serve `assets/` as a raw docroot the way Apache did).

## 7. Local dev environment

PostgreSQL 17 is installed locally (Windows service `postgresql-x64-17`, installed via winget).
Dev credentials: `postgres`/`postgres`, database `showcase_it`, matching `server/.env.example`'s
`DATABASE_URL`. Copy `server/.env.example` → `server/.env` to get a working local setup; no other
setup needed for Postgres itself.

To run locally: `cd server && npx tsx src/server.ts` (API on :4000) and `cd client && npm run dev`
(Vite on :5173, proxies `/api` to :4000). Seeded login: any seeded username (see
`prisma/seed.ts`) with password `ChangeMe123!`.

## 8. Status

- **Module 1 (Database):** done. Schema, initial migration (generated offline via
  `prisma migrate diff`, applied against a real local Postgres), and seed script all verified.
- **Module 2 (Auth):** done and verified end-to-end — login/refresh/logout/me endpoints tested
  against the real DB (correct role resolution, generic invalid-credentials message preserved,
  no-token/wrong-role rejection), and the React login page was verified visually in a real
  browser (Playwright) through to a role-gated dashboard placeholder.
- **Module 3 (Users):** done and verified end-to-end. Two real gaps found in the legacy code and
  resolved per Calvin's decisions:
  - `signup.php` has no `auth_guard` at all — public self-registration with a role picker
    (excluding Super Admin) is preserved exactly as `POST /api/users` (no auth required).
  - `manage_users.php`'s Edit/Delete links point to `update_user.php` /
    `php_action/delete_user.php`, neither of which exists anywhere in the repo or its git
    history — dead links today. Decided to implement real Edit/Delete (`PUT`/`DELETE
    /api/users/:id`, Super-Admin-gated), completing the CRUD every other entity already has.
  - Verified via curl (RBAC, validation, generic-uniqueness errors) and a full browser flow
    (signup → login → Manage Users → search → edit → delete).
- **Module 4 (Categories):** done and verified end-to-end (curl + full browser CRUD flow).
  `categories.php` requires a session but calls no `requireRole()` — any authenticated user can
  manage categories; preserved exactly (`authenticate` only, no role gate). Confirmed the "Status"
  field on the add/edit forms actually writes `categories_active` (the `isActive` business flag),
  never `categories_status` (the separate soft-delete flag, only ever set on create/remove) —
  modeled as two distinct fields per schema.prisma's existing `RecordStatus`/`isActive` split.
  Dropped one piece of dead markup (`categories.php` has a leftover "Edit Brand" modal that no
  button ever targets — copy-paste residue, not a feature) and replaced the DataTables auto-search
  with one working TanStack Table global filter (the page's own `#categorySearch` input was never
  wired to anything in `categories.js` — only DataTables' own injected search box worked).
- **Module 5 (Brands):** done and verified end-to-end. Fixed the known `editBrand.php` bug
  (`UPDATE brands` against a table actually named `brand`, singular — edits 500'd in the legacy
  app) simply by using the correct Prisma model; verified the fix explicitly (edit now works).
  Refactored Categories + Brands onto one shared `SimpleCatalogManager` component/pattern since
  both entities are structurally and behaviorally identical (name + isActive + soft-delete status)
  — avoids duplicating the CRUD page a third time when Module 6 needs the same shape elsewhere.
- **Module 6 (Products):** done and verified end-to-end, including a real file upload through the
  browser. Introduced a reusable `createUploader()` Multer factory (`server/src/middleware/upload.ts`)
  for reuse by Orders/BOQ/vehicle-documents later. Two real bugs found and fixed during
  verification (both confirmed broken before, working after):
  - The update-info endpoint had accidentally reused the create endpoint's multipart-string
    `isActive` schema for a JSON body — caught immediately by the curl test rejecting a real
    boolean.
  - Vite's dev proxy only forwarded `/api`, not `/uploads`, so uploaded images 404'd in the
    browser even though the upload itself succeeded — added `/uploads` to the proxy.
  Confirmed the product form's brand/category dropdowns correctly replicate the legacy's narrower
  filter (`status=1 AND active=1`, not just `status=1` like the Brands/Categories list pages).
  Product image paths are stored cleanly from Multer; the legacy's own path bug (createProduct.php
  stored a wrong `../`-prefixed path that editProductImage.php then fixed inconsistently) has no
  equivalent here since the storage layer is entirely new.
- **Module 7 (Inventory / Issued Tools):** done and verified end-to-end. Found and fixed a real,
  meaningful bug: `custom/js/issuedProduct.js` bound *two* separate `submit` listeners to the issue
  form (one with no validation, one with validation) — both fire on every real submit, since
  `addEventListener` doesn't replace a prior handler and `preventDefault()` in one doesn't stop the
  other from running. Every issue action in the legacy app double-POSTs to `issueProduct.php`,
  double-deducting stock and creating two `issued_tools` rows per click. The new implementation has
  exactly one issue path — not preserved, since replicating this would mean deliberately shipping a
  stock-corruption bug. Also made the stock-check + decrement + insert atomic via a Prisma
  transaction (the legacy version ran three unguarded separate queries, exposed to race conditions
  under concurrent use — not previously atomic). Verified via curl (stock-check rejection, single
  correct deduction) and a full browser store→issue→report flow.
- **Module 8 (Orders):** done and verified end-to-end, including file upload, the lazy-cron
  auto-transitions, and a client-side countdown that mirrors the legacy's responsive UX (calls the
  status endpoint the moment a deadline/24h window hits zero, without waiting for a reload).
  Several real findings resolved along the way:
  - `manageOrder.php` never even `require_once`s `auth_guard.php` (not just missing
    `requireRole()` — no auth check at all). Applied the same "authenticate only" default used for
    every other no-`requireRole()` page rather than leaving it fully public.
  - `manageOrder.php`/`manageOrderP.php`'s "Edit Order" tab links to `editOrder.php`, which has
    never existed — same class of dead link as Users' edit/delete. **Decided with Calvin: build it**,
    reusing the create-order field set (`PUT /api/orders/:id`, full reassignment support).
  - Their "View Order" tab referenced a non-existent `orders.assigned_users` column (assignment is
    actually via `order_assignments`) — always rendered empty. Fixed outright (unambiguous, same
    class of fix as `editBrand.php`'s wrong table name) rather than asking, since the correct query
    was obvious and no real workflow depended on the broken behavior.
  - `manageOrder.php` and `manageOrderP.php` are byte-for-byte identical apart from which header
    include they use — consolidated into one `/orders/manage` page per §5's AppShell plan, rather
    than shipping the same page twice.
  - `createOrder.php`'s assignee dropdown queries all users with no role restriction, distinct from
    `manage_users.php`'s Super-Admin-only list — added `GET /api/users/assignable` (any
    authenticated user) rather than loosening the admin endpoint's gate.
  Note: `orders.php`'s "New/Assigned" grouping (both land in the New tab) and "OnGoing"/"Completed"
  split is preserved exactly in `OrdersKanban.tsx`.
- **Module 9 (BOQ):** done and verified end-to-end, including real Puppeteer PDF generation
  (checked the actual PDF bytes/layout, not just a 200 response) and a full browser
  create→download flow. Corrections/notes:
  - Correction to this doc's Module 9 description above: BOQ numbers are a plain zero-padded
    sequence ("001", "002", ...) like order numbers — not "BOQ-###" like requisitions. Mixed up
    the two conventions when first writing this plan.
  - `puppeteer` (v25+) ships ESM-only while the server is CommonJS; loaded via dynamic `import()`
    in `utils/boqPdf.ts` rather than switching the whole server to ESM.
  - The PDF download needs the JWT Bearer token, which a plain `<a href>` can't send (unlike the
    legacy's cookie-based session, sent automatically on any same-origin link click) — the client
    fetches the PDF as a blob via axios and triggers the download from an object URL instead.
  - HTML/CSS layout copied verbatim from `downloadBOQ.php`; only the "Date Created" field was
    reformatted from a raw ISO timestamp to a readable date, since Puppeteer receives a real `Date`
    object where DOMPDF received a pre-formatted MySQL datetime string.
- **Module 10 (Requisitions):** done and verified end-to-end (curl + full browser submit→process
  flow across two roles). One real data-modeling issue found and resolved:
  - `createRequisition.php` computes `$finalType = ($req_type === 'Other') ? $req_type_other : $req_type`
    and stores **that** into the `req_type` column — meaning the legacy DB column holds arbitrary
    free text whenever "Other" is chosen, not one of the four fixed values. Storing that directly
    would conflict with `RequisitionType` being a Postgres enum (already migrated in Module 1).
    Kept `reqType` as the clean enum (the actual category) and `reqTypeOther` holding the custom
    text as originally intended, then compute a `displayType` field at read time
    (`reqType === 'Other' ? reqTypeOther : reqType`) — reproduces the exact same user-visible
    outcome (the badge shows "Custom Stage Setup", not "Other") without overloading an enum column
    with free text, which would have broken any future filtering/reporting by category.
  - `processRequisition.php`'s `WHERE status = 'Pending'` guard (preventing double-processing) is
    preserved as an atomic `updateMany` with the same predicate, not a separate check-then-update.
- **Module 11 (Logistics / Vehicles):** done and verified end-to-end. `manageLogistics.php`'s Vehicle
  Register tab built as its own page (`/vehicles`) rather than replicating its Dashboard/Trip
  Logbook sibling tabs prematurely — those land with Modules 14/17. Findings:
  - `manageLogistics.php` has no auth check at all (not even `require_once auth_guard.php`) —
    applied the same authenticate-only default used everywhere else.
  - Caught a real security bug during curl verification, not just a translation nit: the
    `assignedUser` Prisma relation was being returned to the client with the full `User` row
    attached, **including `passwordHash`**. Fixed by mapping through the existing `toPublicUser()`
    helper before the vehicle ever leaves the service layer. Re-verified the fix with curl before
    moving on.
  - `vehicleRegister.php` only checked registration-number uniqueness at the app level, and only on
    add — edit could silently create a duplicate since there was no DB constraint.
    `registrationNumber` is `@unique` in schema.prisma (a Module 1 improvement), so both add and
    edit now surface the same friendly "already exists" message instead of a raw constraint error.
  - `deleteVehicle.php` is a real hard `DELETE`, not a soft-delete flag — preserved as-is (Vehicle
    has no status/isActive column, unlike brand/category/product).
  - Caught and fixed a validation bug via the browser test itself: an unfilled `purchaseDate`
    (empty string from `<input type="date">`) was failing `z.coerce.date()` outright instead of
    falling back to its default — fixed with a preprocess step treating `''` as `undefined`.
- **Module 12 (Fuel Logs):** done and verified end-to-end. Confirmed `fuel_logs` is queried nowhere
  else in the entire codebase — the legacy page genuinely only ever shows three aggregate stat
  cards (entry count, total litres, total cost) plus an add-entry form; there is no history/list
  view anywhere, and no dead link suggesting one was ever planned. Not invented here either,
  per the brief — flagging it because it's a real practical gap (no way to see/audit past entries)
  Calvin may want addressed later, but that would be a new feature, not a migration task. Caught
  and fixed a minor validation-message bug via curl: an entirely missing `vehicleId` produced zod's
  generic "expected number, received NaN" instead of the friendly "Please select a vehicle" —
  fixed by giving `z.coerce.number()` an explicit base-type error message (the custom message on
  `.positive()` never runs if the base type check fails first). Same fix applied to the other
  required numeric fields for consistency.
- **Module 13 (Maintenance Logs):** done and verified end-to-end. Unlike Fuel Logs, this module
  does have a real history table (joined with vehicle registration number, `ORDER BY service_date
  DESC`), preserved as-is. The legacy page's own `<h3>` heading literally reads "Fuel Log" — a
  copy-paste leftover from `fuelLog.php` that its own breadcrumb and card header two lines later
  both contradict (correctly saying "Maintenance Log") — used the obviously-correct text rather
  than reproducing the typo, same category of fix as the earlier `editBrand.php` table-name bug.
  "Services Due Soon" preserves the legacy's exact predicate (`next_service_date <= today + 30
  days`, no lower bound, so overdue-forever services still count) rather than "improving" it to
  exclude already-overdue records — no evidence that was unintentional.
- **Module 14 (Trip Logbook):** done and verified end-to-end — this closes out the four vehicle
  modules (11–14). The vehicle-status side effects (start requires `Available` → sets `OnTrip`;
  end sets `Available` back and computes `distanceTravelled`) are now atomic Prisma transactions,
  replacing the legacy's unguarded separate queries; double-booking a busy vehicle is correctly
  rejected. Two things caught and fixed before landing:
  - The transaction originally updated the vehicle status *after* creating/updating the trip
    record with its `vehicle` relation included — meaning the API response's nested `vehicle.status`
    reflected the pre-update value for one request cycle (the DB itself was always correct on the
    next fetch). Reordered so the vehicle flips first, so the response is never stale.
  - Same `passwordHash`-leak class of bug as Module 11: the trip's `user` (driver) relation was
    being returned raw. Mapped through `toPublicUser()` from the start this time, having learned
    from the Vehicles module.
- **Module 15 (Vehicle Documents):** done and verified end-to-end — this was a bigger find than
  originally scoped. The known `$uploadeFile` typo bug (confirmed and fixed: uploaded files landed
  on disk but the DB column always stayed NULL) turned out to be the smaller of two bugs — the
  legacy `<form>` itself only ever rendered a single `document_type` field. Every other column the
  `INSERT` statement needs (vehicle, document number, issue/expiry dates, reminder days) was
  simply absent from the HTML, so the "Save Document" feature could never have worked at all, with
  or without the typo. Reconstructed the complete field set from the `INSERT` column list and the
  file-upload handler, matching the sibling Fuel Log/Maintenance Log forms' conventions. Also:
  - Dropped a standalone dead code block at the top of the legacy file that referenced an
    undefined `$daysRemaining` variable outside any loop (executed unconditionally on every page
    load, printing a meaningless badge) — clearly copy-paste residue from the row-rendering loop
    lower in the same file, not a real feature.
  - Fixed the page's own heading, which again read "Fuel Log" (the same copy-paste bug as
    Maintenance Log, not fixed at its source apparently).
  - The "Renew" action linked to `renewDocument.php`, which has never existed — same class of dead
    link as `editOrder.php`. Built it as a real edit action reusing the create fields, applying the
    same precedent already established for Orders rather than re-asking a third time.
  - Verified the status computation (Valid/Expiring Soon/Expired) against the exact legacy formula
    for all three outcomes, and confirmed a renewal correctly recomputes status from the new
    expiry date while leaving the uploaded file untouched when no new one is provided.
- **Module 16 (Reports): skipped, confirmed with Calvin.** `report.php` is a genuinely empty stub —
  one line (`require_once 'php_action/auth_guard.php';`), no queries, no form, no output — and its
  companion `custom/js/report.js` is also empty. Unlike every other broken module so far, there
  was no evidence at all to reconstruct from (no INSERT statement, no dead link, no partial form).
  `IssueProductReport.php`, the only real reporting feature, was already covered by Module 7's
  Issued Products Report. Decided not to invent placeholder content for an empty legacy page.
- **Module 17 (Dashboards): done.** A background survey of all 7 live-role dashboard PHP files
  (`superDashboard.php`, `storesDashboard.php`, `proj_manDashboard.php`, `accountsDashboard.php`,
  `designDashboard.php`, `prod_teamDashboard.php`, `logisticsDashboard.php`) found they're all
  structurally identical: `auth_guard` → `requireRole()` → a role-specific header include →
  `require_once 'orders.php'` (the kanban) → `footer.php`. **Zero stat cards, zero SQL queries,
  zero role-specific widgets exist anywhere** — every role's "dashboard" is just the Orders Kanban
  (already built in Module 8) wrapped in that role's nav chrome. Two more bugs turned up along the
  way: `accountsDashboard.php` and `designDashboard.php` both include `headerProduction.php`
  instead of a dedicated header (Accountant/Graphic Designer got Production's nav by copy-paste
  mistake), and `includes/logisticsDashboard.php` — included by `manageLogistics.php`'s Dashboard
  tab — doesn't exist anywhere, ever (same class of dead include as `editOrder.php`/
  `renewDocument.php`).

  Decided with Calvin: since no per-role content survives to translate, build genuine
  role-conditional navigation (`client/src/lib/navLinks.ts`) grounded in what each role's actual
  pages are, replacing the 5 duplicated `header*.php` includes with one shared `AppShell`
  component. This incidentally fixes both bugs above — Accountant and Graphic Designer now get
  their own sensible link sets instead of Production's by accident, and there's no dead
  `logisticsDashboard.php`-shaped hole in the new architecture since the former "Dashboard" tab
  concept was never built as a placeholder needing that include (Vehicles and Trip Logbook became
  their own standalone pages back in Modules 11/14).

  Collapsed the 7 role-specific `/dashboard/<role>` placeholder routes into one shared
  `/dashboard` route (any authenticated role) rendering `OrdersKanban` — matching the legacy
  reality that every role sees the same content. `DashboardPlaceholder.tsx` and the now-unneeded
  `roleRoutes.ts` were deleted. Verified via browser across three roles (Super Admin, Stores
  Admin, Production Team): each sees exactly its intended nav links, `/dashboard` renders the
  kanban for all of them, and a non-admin hitting `/users` directly still correctly redirects to
  `/access-denied`.

## 9. Migration status: complete

All 17 modules are done (Module 16 skipped by decision — see above, nothing existed to migrate).
Every module was verified via curl and a real browser flow before being committed; several genuine
bugs in the legacy application were found and fixed along the way (see each module's notes above
for specifics), always flagged rather than silently resolved when the right behavior was
ambiguous. `client/` and `server/` are feature-complete replacements for the PHP application at
the repo root, which remains untouched — retiring it is a separate decision for Calvin to make
once he's had a chance to use the new system.

## 10. Post-migration: modern UI + Work Log Sheet + Quotations + Office Task Calendar

After the migration finished, Calvin asked to bring over UI/UX work that exists on several
never-merged branches (`feature/work-log-sheet`, built on `feature/super-admin-modern-ui`; later
`feature/office-task-calendar`) — none of this was ever part of `main`, so it's new scope on top of
the completed 1:1 migration, not a translation of anything already covered above. Investigated
read-only via `git show <branch>:<path>` (branches never checked out or modified).

1. **Modern AppShell (done, later corrected — see §10.6).** The branch's dark-sidebar shell
   (`includes/sidebarSuper.php` + `custom/css/modern-dashboard.css`) replaced the plain top-nav
   `AppShell` from Module 17: fixed 250px sidebar, Poppins font, brand-orange (`#F15A2C`)/brand-purple
   (`#8B5CF6`) accents added as new Tailwind tokens (`bg-brand-orange`, etc.) alongside the existing
   shadcn semantic tokens, 18px card radius, mobile off-canvas toggle, and a notifications bell
   (pending requisitions count + up to 5 pending quotations). Verified visually at both desktop and
   mobile viewports. The initial pass used the branch's dark ink sidebar color scheme — Calvin didn't
   like it and asked for it back to white/bordered/black-text; see §10.6 for the correction (kept
   the sidebar structure, not its original dark colors).
2. **Work Log Sheet (done).** Shift login, task start/stop with a live timer, two fixed break
   windows (Tea 08:30–09:00, Lunch 13:00–13:40) that block starting a task, a live adherence
   percentage, an evening-shift toggle, and a weekly view. New tables `work_shifts`/`work_tasks`
   (`WorkShift`/`WorkTask` models, `@@unique([userId, shiftDate])` for idempotent shift login).
   `startTask`/`stopTask`/`toggleEveningShift` all use the same atomic guard pattern as
   `processRequisition.php` (`updateMany` with a status/ownership WHERE-guard). One real behavior
   improvement over the legacy PHP: `toggleEveningShift` used MySQL `affected_rows`, which is 0 (and
   so reported as a failure) when re-toggling an already-`evening_shift=1` row — Prisma's
   `updateMany` count reflects rows matching the WHERE clause regardless of whether the SET
   changes anything, so re-toggling now correctly no-ops as a success instead of surfacing "Log in
   first." Legacy rendered the week view as a pre-built HTML fragment (`getWeekLog.php`); here the
   endpoint returns raw shift/task data and the React `WorkLogSheet`/`TimelineRow` components render
   it, with the fixed schedule/break windows computed once server-side as the single source of
   truth instead of being duplicated in every consuming template. Embedded below the Orders section
   on the shared `/dashboard` route for every role, matching `includes/workLogSheet.php`'s
   any-logged-in-role placement. Verified via curl (idempotent shift start, running-task guard,
   break-time guard, atomic stop, idempotent evening-shift toggle, week aggregation) and a full
   Playwright browser pass (log in, start/stop task, evening shift, week modal — screenshots
   confirmed correct rendering).
3. **Quotations (done).** Customer quotations with line items, a design-file attachment,
   server-recomputed totals (never trust client math), Super-Admin-only approval (same atomic
   Pending-only guard pattern as `processRequisition.php`), and a Puppeteer-generated PDF matching
   the legacy DOMPDF layout byte-for-byte in structure (logo embedded as base64, customer block,
   items table, terms/bank-details split, footer — verified by rendering and reading the actual
   PDF). The legacy gates *submission* to a `requireRole('Marketer')` check — but "Marketer" was
   already dropped during Module 2's role-normalization (it's the same broken role string flagged
   back then). Since no live role is really "the marketer," submission is open to any authenticated
   user (matching the precedent already set for Requisitions), and every role's nav gets a "Make
   Quotation" link rather than hiding it inconsistently for some roles while the API allows it for
   all. Line items travel as a JSON-encoded string field alongside the multipart file upload (no
   existing module combined an object array with a file upload, so this is a new but small
   pattern: `z.preprocess` parses the JSON string before array validation). `submittedBy`/
   `approvedBy` are mapped through the existing `toPublicUser()` helper so `passwordHash` never
   leaks (same fix applied to Vehicles/Trip Logbook earlier). Routes: `/quotations` (submit + "My
   Submitted Quotations" list, any role), `/quotations/process` (Super Admin — Pending/All tabs,
   confirm-then-approve modal, matching `processQuotations.php`'s UI exactly). Verified via curl
   (server-side total recomputation, atomic approve + re-approve rejection, real PDF byte
   generation and visual read-back) and a full Playwright browser pass (submit with file upload,
   pending list, approve modal, pending count drops to 0).

Both new features were built the same way as the original 17 modules: Prisma model → repo →
service → controller → routes → Zod validation → React page, verified via curl then a real
browser flow before committing.

4. **Super Admin Dashboard (done).** Translated from `superDashboard.php`: an orders carousel
   (cycling New/On Going/Completed panels via prev/next arrows, one gradient-tile group visible at
   a time — a closer match to the legacy's single-active-panel behavior than the plain tabs used
   elsewhere), the Work Log Sheet widget, a Pending Requisitions quick-process list, a Pending
   Quotations quick-approve list, a profile card (avatar, role, Total Jobs/Current Jobs/Rating stat
   tiles), the Office Task Calendar (§10.5), and a recent-BOQs list with PDF download.
   `totalJobs`/`currentJobs` are derived client-side from the orders already fetched for the
   carousel (each order's `assignedUsers` is filtered against the current user) rather than adding a
   new aggregate endpoint — the data was already on the page. The `4.8` rating is a genuine legacy
   placeholder (`$dummyRating = 4.8; // placeholder — real rating source TBD`), preserved as-is, not
   wired to anything real. The legacy's order auto-transition "lazy cron" (New/Assigned → OnGoing at
   deadline, → Completed 24h later) already lives in `order.repository.ts`'s `autoTransition()` from
   Module 8 and runs on every `orders.list()` call, so the dashboard gets it for free. `/dashboard`
   now renders `SuperAdminDashboard` only for the Super Admin role; every other role still gets the
   plain `OrdersKanban` (unchanged). Verified with a full Playwright pass: initial render with real
   pending-requisition data, carousel cycling through all three tabs, and the mobile breakpoint
   (sidebar collapses, side column stacks below main column).

5. **Office Task Calendar (done).** Scoped from `feature/office-task-calendar` (never merged to
   main). Replaces the original deadline mini-calendar with the legacy's "family calendar" widget:
   a month/week grid with colored dots (red = personal To-Do, blue = a job assigned to you, green =
   a job you assigned) and a day panel listing that date's items. Clicking a day opens a modal to
   add either a To-Do (writes to a new lightweight `Memo` model — title/description/dueDate/status,
   just enough to back this widget's quick-add, *not* the full separate Marketer Memos feature with
   its due-reminder popup, which lives on its own unrequested branch and is out of scope) or a Job
   (writes to the new `OfficeTask` model — assign a task to any user in any department, the actual
   "office task management" entity, translated from `createOfficeTask.php`/`office_tasks`). The
   department → assignee picker reuses the existing `GET /users/assignable` endpoint (open to any
   authenticated user, same one Orders' assignee dropdown uses) with `department` added to its
   response — a small additive field, safe for the existing Orders caller to ignore.
   `GET /task-calendar` aggregates all three sources (own memos, tasks assigned to you, tasks you
   assigned) for a given month, mirroring `getTaskCalendar.php`'s three queries; the widget polls
   every 25s like the legacy's `setInterval(fetchAndRender, 25000)` so a newly-assigned job appears
   without a reload. Verified via a full Playwright pass: adding a To-Do (shows as a red dot/card),
   adding a Job assigned to self (correctly appears as both "you assigned" and "assigned to you"
   since assignedBy === assignedTo), and the month grid/day panel rendering.

6. **Style correction, round 1 (done).** The AppShell/dashboard rebuild in §10.1–10.4 pulled
   feature/work-log-sheet's dark-ink sidebar and dark widget panels (profile card, mini-calendar)
   wholesale — Calvin didn't want that; he wanted the original app's actual look back: white
   backgrounds, bordered cards/forms, black text, keeping the sidebar *structure* (it still replaces
   5 duplicated header files) but not its color scheme. Fixed: `AppShell` sidebar is now
   `bg-card`/`border-r` with black nav text (bordered active/hover states instead of a solid dark
   fill); the dashboard's profile card and BOQ date badge are now white/bordered instead of
   `bg-ink`; the Work Log Sheet's "Evening Shift Active" badge is now a bordered brand-orange chip
   instead of a dark pill. Orange accent tiles (order cards, requisition/quotation icon chips) were
   kept as-is — those are small colored accents matching the legacy's *own* design, not part of the
   dark-theme complaint. Worth noting: the Office Task Calendar (§10.5) needed no such fix — its
   actual legacy CSS (`custom/css/modern-dashboard.css`) was already explicitly changed to a white
   `.cal-card` in the same commit that introduced it (comment: "light 'family calendar' style"), so
   building it faithfully already matched the corrected direction.

7. **Style correction, round 2 — the real root cause (done).** Calvin reported the app was *still*
   showing black after round 1. The actual bug: `client/src/index.css` had a
   `@media (prefers-color-scheme: dark)` block that swapped every shadcn semantic token
   (`--background`, `--card`, `--secondary`, etc.) to dark values whenever the browser/OS is in dark
   mode — which silently overrides every single "white" `bg-card`/`bg-background` class from round
   1, regardless of what the component markup says. This app has no theme toggle, so a
   system-driven dark override only ever fights the one theme it actually has. Removed the media
   query entirely; verified with Playwright's `colorScheme: 'dark'` viewport emulation that the app
   now stays fully white end-to-end regardless of OS preference. While in there: also pulled real
   colors from `images/showcaseit_logo.png` (sampled via a pixel probe — the glossy orange "S" mark
   is `#F5821F`, its small accent triangle is a magenta `#B71B8A`) to replace the originally-guessed
   `--brand-orange`/`--brand-purple`/`--primary`/`--ring` values, and added the actual logo icon
   (resized 1500×1500 → 256×256, `client/public/showcaseit-icon.png`) to the sidebar brand mark and
   the Login page, replacing the plain text-only wordmark.

8. **Memos — full CRUD (done).** Calvin asked for the Office Task Calendar's "Memos" and "Office
   Task Calendar" entry points to also live in the sidebar as their own pages, not just inside the
   Super Admin dashboard widget. Memos needed real list/create/mark-done/delete endpoints beyond the
   calendar's quick-add-only support (translated from `memos.php` +
   `createMemo.php`/`updateMemoStatus.php`/`deleteMemo.php`, same "Marketer" role dropped in Module 2
   → open to any authenticated user, own-records-only ownership guard preserved). New `/memos` page:
   a create form plus a searchable table with overdue highlighting, mark-done, and delete. New
   `/task-calendar` page: the same `TaskCalendar` widget already built for the dashboard, in a
   full-page wrapper. Both added to every role's nav (same "no live role gates this" precedent as
   Make Quotation). The due-date reminder popup/acknowledge flow from the original Marketer Memos
   feature remains out of scope — this is the to-do list itself, not that popup.

9. **Office Task Calendar — board redesign (done).** Calvin pointed at a Monday.com-style board
   screenshot and asked for the full-page `/task-calendar` view to look like it: a left sidebar of
   toggleable calendar categories and a big day-column grid, instead of the compact
   month-grid-with-day-panel widget style. The reference's bars span multiple days and group by
   team; our Memos/Office Tasks only carry one due date each (no start-to-end range) and group
   naturally by item type instead — by his choice, adapted to single-day colored chips (still using
   the red/blue/green To-Do / Assigned-to-you / You-assigned palette) with sidebar checkboxes that
   filter the grid live, rather than adding a date-range field that never existed in the legacy app.
   The dashboard's compact widget (`components/TaskCalendar.tsx`) is untouched — this full board
   layout lives only in `pages/OfficeTaskCalendarPage.tsx`. Also by his choice, this page's "Add
   Task" form is a right-anchored slide-in panel (mount + requestAnimationFrame to trigger the
   transform transition, matching the mobile sidebar's slide pattern already used in AppShell)
   instead of the centered modal used everywhere else in the app — scoped to just this page, not a
   global modal-to-drawer change. Verified via Playwright: grid rendering with real data, sidebar
   checkbox filtering (unchecking a category hides its chips live), the slide-in panel opening and
   closing, and the Week/Month toggle.

10. **Profile card / calendar / BOQ list made global (done).** Calvin tracked down the original
    "Selena Academy" template screenshot the Super Admin Dashboard's right column (§10.4) was
    actually built from, and asked to keep that column — profile card, calendar, small BOQ/schedule
    list — visible "exactly where it is" on every page, not just the dashboard. Extracted that
    column out of `SuperAdminDashboard.tsx` into a new `DashboardSidePanel` component, now rendered
    by `AppShell` itself alongside every route's content (`<Outlet/>` + `DashboardSidePanel` in a
    flex row that stacks vertically below `xl:`). Since it's global now, it runs for every role, not
    just Super Admin — no permission changes were needed since `/orders`, `/boqs`, and
    `/task-calendar` were already open to any authenticated user. React Query's shared cache keys
    (`['orders']`, `['boqs']`) mean visiting a page that also fetches those (OrdersKanban, BOQ) does
    not trigger extra network round-trips. `SuperAdminDashboard` is now single-column — just the
    orders carousel, Work Log Sheet, and pending requisitions/quotations quick-actions. Verified via
    Playwright: the panel appears identically on the dashboard, on an unrelated CRUD page (Products),
    and on the new Office Task Calendar board page (which now shows both the compact global calendar
    widget *and* the full board — intentional, a quick glance plus a deep-dive view), and correctly
    stacks below the main content on mobile widths instead of disappearing.
