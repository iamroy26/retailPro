# RetailPro Frontend Audit and Integration Map

Audit date: 2026-11-06

## Audit scope

The existing React/Vite application was inspected in place. Its routes, page components, feature components, API/service layer, authentication provider, browser storage use, manifests, and current Express/Prisma API contract were reviewed. This audit preserves the current frontend and is the acceptance record for development stage 1.

## Frontend structure

- `frontend/src/App.jsx` defines 13 routes: 11 protected business routes, login, and registration.
- `frontend/src/pages/` contains Dashboard, PointOfSale, Products, Categories, Inventory, SalesHistory, Customers, Suppliers, Expenses, Reports, Settings, Login, and Register.
- `frontend/src/components/` contains the responsive application shell/navigation; dashboard chart and summary panels; POS product/cart/payment/receipt components; product/category/contact/expense/inventory forms; sale detail; shared loading, error, empty, pagination, badge, and confirmation components; and reusable UI primitives.
- Feature services under `frontend/src/services/` encapsulate API queries and operations for API health, categories, customers, dashboard, expenses, inventory, products, reports, sales, settings, and suppliers. `frontend/src/api/retailApi.js` adapts entity and function calls to REST.
- `frontend/src/lib/AuthContext.jsx` restores the session from the API, exposes login/register/logout, and protects signed-in routes.

## Existing page-to-backend mapping

The endpoint column shows the current REST contract where it exists. `/api/v1` is the required target namespace for new/versioned APIs; migration to it must preserve the existing `/api` contract until the frontend and deployments are deliberately migrated.

| Page / workflow | Current frontend data and actions | Current API contract | Required target data and endpoints |
|---|---|---|---|
| Login | Email/password, restore signed-in user, sign out | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | `POST /api/v1/auth/login`, `GET /api/v1/auth/session`, `POST /api/v1/auth/logout`; persisted session, user, tenant membership, role, permissions |
| Register | Business-account owner name, email, password | `POST /api/auth/register` | `POST /api/v1/auth/register`; atomically provision the user, tenant, owner membership, default branch/register, and plan/trial only after product rules are decided |
| Dashboard | Today revenue/count/profit, 7-day trend, low stock, recent sales, best sellers, onboarding links | `GET /api/sales/aggregate`, `GET /api/sales/count`, `GET /api/sales`, `GET /api/products`, `GET /api/products/count`, `GET /api/reports` is available for report page | `GET /api/v1/dashboard/summary`; aggregate by authorized tenant and optional branch; use actual sales, inventory balances, and expenses |
| Point of Sale | Search/filter active products; cart; customer name; discount; cash/card/mobile-money selection; receipt and print | `GET /api/products`, `GET /api/categories`, `GET /api/app-settings`, `POST /api/sales/complete` | `GET /api/v1/branches/:branchId/catalogue`, `POST /api/v1/sales`; server pricing/tax/stock, client transaction idempotency, branch/register/cash-shift context, payment state, receipt snapshots |
| Products | Search/filter/sort/paginate, create/update, archive/restore/delete, opening stock | `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/:id`, `GET /api/products/count`; opening inventory is recorded by backend | `/api/v1/products` CRUD; tenant-scoped variants, barcodes, categories, tax categories, branch-specific stock balances |
| Categories | List active/inactive, add/edit/delete, show product count and stock value | `GET/POST /api/categories`, `PATCH/DELETE /api/categories/:id`, product count queries | `/api/v1/categories` CRUD; tenant ownership and safe product/category relationships |
| Inventory | Product stock levels, low-stock filter, adjustment history, receive/correct/return/damage adjustments with reason | `GET /api/products`, `GET /api/stock-movements`, `POST /api/stock-adjustments` | `/api/v1/inventory/balances`, `/api/v1/inventory/movements`, `/api/v1/inventory/adjustments`; branch-scoped locked balances and auditable movement records |
| Sales history / receipt detail | Date range, receipt/customer/cashier search, payment filter, totals, sale detail/receipt | `GET /api/sales`, `GET /api/sales/:id`, `GET /api/sales/aggregate`, `GET /api/sales/count` | `/api/v1/sales`, `/api/v1/sales/:id`; tenant/branch permission checks and immutable transaction snapshots |
| Customers | Search/list, create/edit/delete contact information | `GET/POST /api/customers`, `PATCH/DELETE /api/customers/:id` | `/api/v1/customers` CRUD; tenant-scoped customer records, loyalty account/transactions when enabled |
| Suppliers | Search/list, create/edit/delete, show supplier-related purchase movements | `GET/POST /api/suppliers`, `PATCH/DELETE /api/suppliers/:id`, `GET /api/suppliers/:id/purchases` exists but current UI reads purchase-type stock movements | `/api/v1/suppliers` CRUD; `/api/v1/purchase-orders` and receipt workflow; explicit supplier foreign-key linkage |
| Expenses | Date/category/search filters, create/edit/delete, aggregate totals | `GET/POST /api/expenses`, `PATCH/DELETE /api/expenses/:id`, `GET /api/expenses/aggregate` | `/api/v1/expenses` CRUD and `/api/v1/expense-categories`; tenant/branch scope and audit history |
| Reports | Date selection, sales summaries/series, product ranking, valuation and low stock | `GET /api/reports` | `GET /api/v1/reports/*`; server aggregates actual authorized tenant/branch records; apply plan and permission limits |
| Settings | Store name/tagline/address/phone/TIN, currency, tax, low-stock threshold, receipt footer; API health; signed-in user | `GET/POST /api/app-settings`, `PATCH /api/app-settings/:id`, `GET /api/health` | `/api/v1/tenant/settings`, `/api/v1/health`; tenant-scoped settings with permission checks |

## Existing forms and functional components

- Authentication: `AuthLayout`, `Login`, `Register`, `ProtectedRoute`.
- Catalogue: `ProductFormDialog`, `ProductDetailDialog`, `ProductsTable`, `CategoryFormDialog`.
- Contacts: shared `ContactFormDialog` for customers and suppliers.
- Checkout: `ProductTile`, `CartLine`, `CartPanel`, `PaymentDialog`, `ReceiptDialog`, `ReceiptView`.
- Inventory: `StockAdjustDialog`; adjustments require a reason and are posted as a backend operation.
- Expenses: `ExpensesFormDialog`.
- Sales: `SaleDetailDialog`.
- Settings: editable form embedded in the Settings page.
- Dashboard: sales chart, recent sales, best sellers, low-stock panels.
- Shared interaction states: `EmptyState`, `ErrorState`, `TableSkeleton`, `Pagination`, `ConfirmDialog`, toast notifications and `ConnectionBadge`.

## Existing data structures and persistence

- API entities: Product, Category, Customer, Supplier, Expense, Sale, StockMovement, and AppSettings.
- A sale includes item snapshots, totals, cashier/customer names, status, payment method and amount received/change. The backend additionally persists sale items, a payment record, and stock movements.
- Product and sale monetary fields are persisted as PostgreSQL decimals through Prisma.
- Authentication uses a server-set HttpOnly session cookie; the browser does not store a password or bearer token.
- The only `localStorage` use is `retailpro.sidebar.collapsed` in `AppLayout.jsx`, a display preference. TanStack Query caches API responses in memory; it is not durable offline storage.
- Audit search found no frontend mock/fixture data, IndexedDB, SQLite, Tauri, offline transaction queue, barcode-scanning workflow, payment-provider SDK, or webhook client.
- The configured live database is currently a single-user-owned data model. It has no tenant, membership, branch, register, or branch-level balance boundary. Registration creates an admin user whose own ID scopes business records; this is not multi-tenant membership isolation.

## Existing API and backend capabilities

The Express application currently serves unversioned `/api` routes. Authentication routes cover register/login/logout/current user. A generic authenticated resource router exposes list/get/create/update/delete/count/aggregate for configured entities. Dedicated operations complete sales, adjust stock, and generate reports. Prisma models currently cover roles, users, products, categories, customers, suppliers, expenses, sales, sale items, payments, stock movements, supplier purchases/items, and app settings.

Sales are processed transactionally with server-side prices, a unique receipt, stock row locks, oversell checks, payment persistence, sale-item snapshots and stock movements. Inventory adjustments are also transactional. These are working foundations, not evidence that the broader SaaS requirements below are implemented.

## Audit findings and incomplete requirements

1. **Tenant model and branch isolation:** the current owner-per-user arrangement must be evolved to explicit tenants, memberships and branch authorization. The frontend must never choose trusted tenant scope; the API must derive it from authenticated membership.
2. **Versioned modular API and validation:** routes are currently unversioned and generic-resource based. Zod is not installed; validation uses project-local helpers. A versioned migration and module-by-module contract tests are needed.
3. **Identity and authorization:** roles exist, but there are no sessions table, permissions, memberships, branch grants, employee/staff administration, rate-limit policy or security/audit-event modules.
4. **Commerce completeness:** no refund/return workflow, partial payment lifecycle, cash shifts/reconciliation, receipt entity, or explicit payment-provider confirmation/reconciliation. Cash/card/mobile-money are checkout labels, not integrated payment processing.
5. **Procurement:** supplier records and purchase-related models exist, but the frontend has no purchase-order form or receive-purchase workflow; supplier purchase display currently infers from stock movements.
6. **SaaS lifecycle:** no plans, subscriptions, subscription payments, tenant provisioning, branch/register management, or billing enforcement.
7. **Additional modules:** no tax-category/variant/barcode management, loyalty, employee/attendance/shift management, notifications, or integrations/webhooks.
8. **Offline and desktop:** there is no durable offline cache/outbox/idempotent synchronization/conflict UI and no Tauri desktop package or SQLite store.
9. **Testing and deployment:** backend tests cover validation, POS math, and unauthenticated API access. Full API/database integration, tenant-isolation, concurrency, migration rollback/restore, and end-to-end web/desktop/offline tests remain to be designed.

## Existing frontend dependencies (grouped)

- Runtime/UI: React, React DOM, React Router, Radix UI primitives, Lucide icons.
- Styling/build: Vite, Tailwind CSS 4 and its Vite plugin, Vite React plugin.
- Data/charting: TanStack Query, Recharts, date-fns.
- Utilities: class-variance-authority, clsx, tailwind-merge, input-otp.
- Tooling: ESLint and React Hooks/Refresh plugins.
- Not present: Zod, IndexedDB wrapper, test runner/browser automation, Tauri, SQLite bindings, or payment-provider clients. Backend-only libraries are kept in `backend/package.json`.

## Staged implementation and acceptance gates

Development should preserve these gates; do not combine all domains into an unreviewable schema or release:

1. **Frontend audit — this document:** route/component/data/storage/dependency inventory and feature integration mapping is complete; run baseline lint/build and retain this map as the frontend contract.
2. Backend foundation: API versioning, module boundaries, shared validation/error behavior, configuration and test harness.
3. Database foundation: tenant-safe normalized schema and reviewed migrations; retain/backfill existing records and verify rollback/restore on a non-production database.
4. Authentication/multi-tenancy: tenant provisioning, membership/permissions and negative cross-tenant/branch isolation tests.
5. Products/inventory: branch-aware stock balances, ledger consistency and concurrency tests.
6. Sales/payments/receipts/refunds: idempotency, decimal arithmetic, oversell prevention, payment state and authorized return tests.
7. Customers/suppliers/expenses/reports: page contract coverage and tenant/branch aggregate verification.
8. Branches/registers/shifts.
9. External integrations and signed webhooks after merchant/provider requirements are known.
10. Tauri packaging and offline sync only after web workflows and conflict semantics pass acceptance.
11. Production rollout: backups, staged migrations, observability, load/security testing, deployment and recovery runbooks.

## Stage status

- **Stage 1 — Frontend audit:** complete. The feature map above is the integration contract.
- **Stage 2 — Backend foundation:** complete for API version compatibility and dedicated request validation. `/api/v1` aliases coexist with `/api`; Zod validates authentication, sale, inventory-adjustment, and report requests; route alias and validation tests pass. Generic-resource validation and full per-module route extraction remain follow-up work.
- **AI assistant:** removed from the frontend and API. Historical database tables and migrations are retained; existing conversation data is not deleted.
- **Full multi-tenant stages:** incomplete. The current schema and API are owner-scoped, not tenant-membership or branch isolated; SaaS tenancy and branch controls must be completed and tested before production claims of multi-tenant isolation.
