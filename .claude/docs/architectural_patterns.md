# Architectural Patterns

Conventions observed across multiple files in `php_action/`, root pages, and `custom/js/`. Follow these when adding or modifying a page or endpoint, and match the pattern already used by the entity you're touching (patterns are not 100% uniform — see "Known inconsistencies" below).

## Page bootstrap & auth

Every protected page starts with the same two-line bootstrap:

```
require_once 'php_action/auth_guard.php';
requireRole("<Role Name>");
```

- `php_action/auth_guard.php:11` defines `requireRole($role)`, which checks `$_SESSION['user_type'] === $role` and redirects to `index.php?error=AccessDenied` otherwise. It does not support multiple allowed roles per page — one string only.
- `php_action/core.php:1` is the lighter bootstrap used by `php_action/*.php` endpoints: it starts the session and pulls in `db_connection.php`, but does **not** call `requireRole()`. Most CRUD endpoints in `php_action/` trust that only logged-in-and-correctly-routed users reach them and do not re-check role server-side (e.g. `php_action/createProduct.php:1`).
- Role strings are free text stored on `users.user_type` (see `stock.sql:171`) and must match exactly what `requireRole()` checks and what `index.php:57-93`'s login switch redirects to. These three places (seed data, `requireRole()` calls, login redirect switch) have drifted (e.g. `productionDashboard.php:3` requires `"Production"` while `index.php` routes `"Production Team"` there) — when adding a role, grep all three before assuming they agree.

## Page chrome / includes

- `includes/header.php` is the default nav (used by generic/super-admin-ish pages); role-specific variants `headerStores.php`, `headerProduction.php`, `headerProject.php`, `headerLogistics.php` duplicate the same nav shell with role-appropriate links rather than sharing one parameterized header. When changing nav markup, expect to touch multiple `includes/header*.php` files.
- Pages `require_once`/`include` the matching header near the top, then `includes/footer.php` at the bottom (see `dashboard.php:1-16` for the minimal shape).
- There are two overlapping sets of role dashboards: root-level `*Dashboard.php` (e.g. `accountsDashboard.php`) and `dashboards/*.php` (e.g. `dashboards/accountsDashboard.php`). Check which one is actually linked from the nav/login redirect before editing — don't assume the root one is canonical.

## `php_action/` endpoint pattern

Each entity (product, brand, category, order, etc.) gets a family of single-purpose scripts rather than one controller:

- `create<Entity>.php` — handles `$_POST`, inserts a row, returns `json_encode(['success' => bool, 'messages' => string])`.
- `fetch<Entity>.php` — returns the DataTables-shaped `{"data": [...]}` payload, building action-button HTML server-side as string concatenation (see `php_action/fetchProduct.php:26-44`).
- `fetchSelected<Entity>.php` — returns one row's data as JSON for populating an edit modal.
- `edit<Entity>.php` / `remove<Entity>.php` — update/soft-delete (soft delete via a `status`/`active` flag column, not `DELETE`).

Follow this same file-per-verb split for new entities rather than combining actions into one script.

## Front-end CRUD pattern (jQuery + DataTables)

`custom/js/<entity>.js` files (e.g. `custom/js/product.js:5-10`) all follow the same shape:

1. Initialize a DataTable with `'ajax': 'php_action/fetch<Entity>.php'`.
2. Bind the "add" modal's form `submit` to an inline validator (manual field-by-field empty checks appending `<p class="text-danger">` messages — no validation library) followed by a `$.ajax` POST to the matching `create<Entity>.php`, using `FormData`/`processData:false`/`contentType:false` whenever the form includes a file input.
3. On success, reset the form, show a Bootstrap alert that auto-fades via `setTimeout`, and call `<table>.ajax.reload(null, ...)` to refresh the DataTable in place — never a full page reload.
4. `edit<Entity>(id)` and `remove<Entity>(id)` are global functions invoked via inline `onclick` handlers from the action-button HTML that `fetch<Entity>.php` renders server-side, fetching the row via `fetchSelected<Entity>.php` and wiring a similar submit/reload flow.

Reuse this structure for new entities so behavior stays consistent with existing pages.

## File uploads

- Product images: `php_action/createProduct.php:17-22` builds a unique filename (`uniqid(rand())`), whitelists the extension, and moves the upload into `assets/images/stock/`.
- Order attachments (BOQ/artwork): `php_action/createOrder.php:32-43` moves uploads into a repo-root `uploads/` directory (created on demand), prefixing the filename with `boq_`/`artwork_` + `time()`.
- Both patterns store the resulting relative path directly in a DB column (`product.product_image`, `orders.boq_file`/`artwork_file`) and render it later via `<img src="...">` or a download link — there is no dedicated file-serving endpoint.

## Data access

- DB handle `$conn` (mysqli) is created once in `php_action/db_connection.php:13` and reused via `require_once`; endpoints call `$conn->close()` at the end (see `php_action/fetchProduct.php:68`).
- Newer/updated code (`createOrder.php`, `createRequisition.php`, `signup.php`, `manage_users.php`) uses **prepared statements** (`$conn->prepare()` + `bind_param()`), and wraps multi-table inserts (order + `order_assignments`) in `$conn->begin_transaction()`/`commit()`/`rollback()` (`php_action/createOrder.php:53-89`).
- Older code (`php_action/createProduct.php:24-25`, several other `create*`/`edit*` scripts) still builds SQL via raw string interpolation of `$_POST` values — a SQL-injection risk. When touching these files, prefer converting to prepared statements rather than extending the string-concatenation pattern.
- Multi-value form fields backed by a join table (e.g. `orders.assigned_users[]` → `order_assignments`) are inserted with one prepared statement executed in a loop per value, inside a transaction — follow this for any new many-to-many relationship.

## Known inconsistencies (be aware, don't silently "fix" without asking)

- Password hashing is mixed: seed data in `stock.sql` contains plain MD5 hex, PHP's legacy `crypt()`-style hashes, and modern `password_hash()`/bcrypt hashes side by side (`stock.sql:187-192`). `php_action/migrate_passwords.php` is a one-off script to upgrade 32-char MD5 hashes to `password_hash()` — it is not run automatically.
- Role-name strings are inconsistent between the `users` seed data, `requireRole()` calls, and the login redirect switch in `index.php` (see Auth section above).
- Some numeric-looking columns (`product.quantity`, `product.rate`, `orders_items.quantity/rate/total`) are typed `varchar` in the schema rather than numeric types — treat them as strings needing casts when doing arithmetic.
