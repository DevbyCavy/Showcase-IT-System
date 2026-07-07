# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Showcase IT is a stock/inventory and order-management system for a signage/printing business. It tracks products, brands, categories, stock issuance, customer orders (with file uploads for BOQs/artwork), requisitions, vehicles/logistics, and per-role dashboards (Super Admin, Stores Admin, Project Manager, Marketers, Accountant, Graphic Designer, Production Team, Logistics).

## Tech Stack

- **PHP** (procedural, no framework) run via **XAMPP/Apache**, MySQLi (object-oriented) for DB access
- **MariaDB/MySQL** — schema and seed data in `stock.sql`, database name `stock`
- **Bootstrap 5**, **Font Awesome 6**, **jQuery**, **jQuery UI** — vendored under `assets/`
- **DataTables** and **Krajee Bootstrap FileInput** plugins — vendored under `assets/plugins/`
- No build step, no package manager, no test framework — this is plain PHP served directly by Apache

## Key Directories

- `php_action/` — AJAX/form-processing endpoints (create/fetch/edit/remove per entity). This is the "backend" layer; pages under the repo root POST/GET to these scripts. See `php_action/core.php:1` (shared bootstrap: session + DB) and `php_action/auth_guard.php:11` (`requireRole()` gate).
- `includes/` — shared page chrome: `header.php` (default nav) plus role-specific variants `headerStores.php`, `headerProduction.php`, `headerProject.php`, `headerLogistics.php`, and `footer.php`. `includes/vehicles/` holds the logistics/vehicle sub-pages (fuel log, maintenance log, trip logbook, documents, registration).
- `dashboards/` — a second, older set of role dashboards (accounts/graphics/marketing/project) that overlaps with the root-level `*Dashboard.php` files — check both when working on a given role's dashboard.
- `custom/js/` and `custom/css/` — page-specific jQuery/DataTables wiring (`product.js`, `brand.js`, `order.js`, `report.js`, `setting.js`, `issuedProduct.js`) and the site's custom stylesheet. `assets/` is entirely third-party/vendored code — don't hand-edit it.
- Root `*.php` files — one file per page/dashboard, generally named after the role or entity (`storesDashboard.php`, `manageOrder.php`, `requisitions.php`, `product.php`, etc).
- `stock.sql` — authoritative reference for table structure (`brand`, `category`, `product`, `orders`, `orders_items`, `order_assignments`, `issued_tools`, `users`; note `requisitions` is used by code but not present in this dump).

## Running & Testing

- Serve the project through XAMPP/Apache with the repo at the web root (e.g. `htdocs/showcase-it/Showcase-IT-System`); no CLI dev server.
- Import `stock.sql` into a local MariaDB/MySQL instance named `stock` before first run. DB credentials are hardcoded in `php_action/db_connection.php:3-6` (`root` / empty password / `localhost`).
- There is no automated test suite. Verify changes by loading the affected page in a browser and exercising the relevant form/DataTable/AJAX flow directly.
- No linter is configured; rely on your own PHP/JS syntax care since there's no CI to catch mistakes.

## Additional Documentation

- `.claude/docs/architectural_patterns.md` — request/response conventions, auth/session pattern, DataTables+AJAX CRUD pattern, file upload handling, and where the codebase is inconsistent (raw SQL vs prepared statements, password hashing schemes, mismatched role strings) — read this before adding or modifying any `php_action/` endpoint or role-gated page.
