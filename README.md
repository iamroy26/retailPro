# Retail POS

The existing Vite/React interface lives in `frontend/` and talks to the independent Express API in `backend/`. The API uses Prisma with Neon PostgreSQL; the browser never connects directly to the database. Root-level npm scripts are convenience commands that delegate to the corresponding app.

## Install

```sh
npm --prefix frontend install
npm --prefix backend install
```

## Configure the API

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `DATABASE_URL` to the connection string from your Neon project.
3. Replace `JWT_SECRET` with a random value of at least 32 characters.
4. Keep both values in `backend/.env`. Never use a `VITE_` prefix for server secrets.
5. To enable product image search and uploads, configure `IMAGE_STORAGE_BUCKET`, `IMAGE_STORAGE_ACCESS_KEY_ID`, `IMAGE_STORAGE_SECRET_ACCESS_KEY`, and `IMAGE_STORAGE_PUBLIC_BASE_URL` in `backend/.env`. Set `IMAGE_STORAGE_REGION` to the bucket region (`auto` for Cloudflare R2), and `IMAGE_STORAGE_ENDPOINT` for an S3-compatible service. Use HTTPS for the public image base URL and restrict write credentials to the product image bucket/prefix. Image lookup uses Open Food Facts and commercially reusable Wikimedia Commons images; storage remains disabled until configured.
6. Generate Prisma Client:

   ```sh
   npm --prefix backend run prisma:generate
   ```

7. Apply the database migrations:

   ```sh
   npm run db:deploy
   npm run db:seed
   ```

For local schema development, use `npm run db:migrate` instead of `npm run db:deploy`.

## Run locally

Start the API and frontend in separate terminals:

```sh
npm run api:dev
```

```sh
npm run dev
```

The API listens on `http://localhost:4000`. Vite serves the existing interface from `frontend/` on `http://localhost:5173` and proxies `/api` requests to the API. New registrations receive an isolated account and the admin role.

## API and data

- `backend/src/routes` defines the REST endpoints; controllers and services implement authentication, catalogue, inventory, sales, and reporting.
- `backend/prisma/schema.prisma` is the canonical relational schema.
- `backend/prisma/migrations` contains versioned PostgreSQL migrations.
- Product image files are stored in the configured S3-compatible object store; product rows retain the per-account image URL and signed attribution/license metadata. The `20261112020000_add_product_image_metadata` migration adds brand and image attribution columns.
- Passwords use bcrypt and login sessions use HttpOnly cookies.
- Sale pricing, stock checks, receipt creation, sale items, payment records, and stock movements are committed in one database transaction. Products are locked during checkout to prevent overselling.
- Reports aggregate the full requested period in PostgreSQL rather than a fixed browser page.
- The AI assistant and AI API endpoints have been removed. The historical conversation migration and existing database records are retained and are no longer used by the application.

## Production

Deploy the frontend and API independently. Configure `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `WEB_ORIGIN`, and `PORT` on the API. Use HTTPS and set `COOKIE_SAME_SITE=none` when the sites are cross-origin. Set the frontend's `VITE_API_BASE_URL` only when the hosting platform does not proxy `/api` to the API.

## Validation commands

```sh
npm run lint
npm run build
npm test
```
