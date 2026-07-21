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
- **Module 12 (Fuel Logs)** is next.
