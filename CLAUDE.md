# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Showcase IT is a stock/inventory and order-management system for a signage/printing business. It tracks products, brands, categories, stock issuance, customer orders (with file uploads for BOQs/artwork), requisitions, quotations, vehicles/logistics, a per-user Work Log Sheet, an Office Task Calendar, and per-role dashboards (Super Admin, Stores Admin, Project Manager, Accountant, Graphic Designer, Production Team, Logistics).

The app was originally a plain PHP/MySQL application (procedural PHP, no framework, MySQLi, XAMPP/Apache). That codebase was fully migrated to the stack below and then deleted — see `MIGRATION_PLAN.md` for the complete module-by-module migration history, every scope decision made along the way, and the legacy behavior each module preserves or intentionally fixes. If you need to see the original PHP source for historical context, check out an earlier commit (e.g. `git log --diff-filter=D --summary | grep delete` from the migration branch, or the `main` branch prior to this cleanup).

## Tech Stack

- **Frontend** (`client/`): React 19 + TypeScript + Vite, React Router, React Hook Form + Zod, Axios, Tailwind CSS v4, shadcn/ui-style components, TanStack Query + TanStack Table, Recharts, lucide-react icons
- **Backend** (`server/`): Node.js + Express + TypeScript, Prisma ORM, Zod validation, JWT (access + refresh) + bcrypt auth, Multer file uploads, Puppeteer for PDF generation (BOQs/quotations)
- **Database**: PostgreSQL, schema in `server/prisma/schema.prisma`, migrations in `server/prisma/migrations/`
- No CI is configured; rely on `tsc --noEmit` and `npm run lint` (oxlint) in both `client/` and `server/`, plus manual verification in a browser.

## Key Directories

- `server/src/routes/`, `controllers/`, `services/`, `repositories/`, `validations/` — one file per module per layer (e.g. `order.routes.ts` → `order.controller.ts` → `order.service.ts` → `order.repository.ts` → `order.validation.ts`). Controllers stay thin; business logic lives in services; Prisma calls live in repositories only.
- `server/src/middleware/` — `auth.ts` (JWT verification + `requireRole()`), `upload.ts` (Multer `createUploader()` factory), `validate.ts` (Zod `validateBody()`), `errorHandler.ts` (`ApiError` + centralized error responses).
- `server/src/utils/` — PDF renderers (`boqPdf.ts`, `quotationPdf.ts`, both Puppeteer-based), `mapUser.ts` (`toPublicUser()` — strips `passwordHash` before any user object reaches a client), date helpers.
- `client/src/pages/` — one file per route/page. `client/src/components/` — shared components (`AppShell` is the sidebar+header shell, `DashboardSidePanel` is the persistent right-hand profile/calendar/BOQ rail, `TaskCalendar`/`WorkLogSheet` are the two dashboard widgets). `client/src/components/ui/` — shared primitives (`Card`, `PageHeader`, `DataTable`, `Button`, `Input`).
- `client/src/api/` — one file per module, thin Axios wrappers matching the server's REST routes.
- `images/showcaseit_logo.png` — the actual company logo; still referenced directly by `server/src/utils/quotationPdf.ts` (embedded as base64 in generated PDFs) and by `client/public/showcaseit-icon.png` (a resized copy used in the UI). Don't delete this directory.
- `MIGRATION_PLAN.md` — the living design/decision doc for the whole project. Read this before assuming why something is built a particular way; it documents every legacy quirk, bug fix, and scope decision made during the PHP→Node/React migration and the post-migration UI work.

## Running & Testing

- `server/`: copy `.env.example` if present or check `server/src/config/env.ts` for required vars (`DATABASE_URL`, JWT secrets, `UPLOADS_DIR`, `CLIENT_ORIGIN`). Run `npx prisma migrate dev` against a local Postgres instance, then `npx tsx src/server.ts` (or the configured dev script) to start the API on its configured port.
- `client/`: `npm run dev` starts the Vite dev server; it proxies `/api` and `/uploads` to the server (see `client/vite.config.ts`).
- No automated test suite exists. Verify changes by running both processes and exercising the relevant page/flow in a browser — screenshot-verify anything visual.
- Typecheck with `npx tsc --noEmit` in both `client/` and `server/` before considering a change done; lint with `npm run lint` (oxlint) in `client/`.

## Adding New Features or Fixing Bugs

**IMPORTANT**: When you work on a new feature or bug, create a git branch first. Then work on changes in that branch for the remainder of the session.
