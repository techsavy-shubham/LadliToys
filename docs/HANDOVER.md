# Ladli Toys – Handover & Operations Guide

Live site: https://ladli-toys.vercel.app · Admin: https://ladli-toys.vercel.app/admin

## 1. What was built

| Area | Where |
|---|---|
| Storefront (home, catalog, filters, product pages, wishlist, cart, checkout, accounts, reviews, order tracking) | `app/`, `components/` |
| Admin (dashboard, products, inventory, categories, brands, customers, orders, coupons, banners, reviews, payments, analytics, notifications) | `app/admin/`, `components/admin/` |
| REST API | `app/api/**` (public, customer and `/api/admin/*`) |
| Business logic (catalog merge, pricing, coupons, orders, payments, notifications) | `lib/` |
| Database model (target schema) | `prisma/schema.prisma` |
| Tests | `e2e/` (Playwright) |

Stack: Next.js (App Router), React, Tailwind CSS, Node route handlers (REST), PostgreSQL via Neon (optional until connected).

## 2. Go-live checklist (what the store owner must still provide)

1. **Database** – the live site uses **MongoDB Atlas** (`MONGODB_URI`, `MONGODB_DB`; Atlas Network Access must allow `0.0.0.0/0` because Vercel IPs change; use a dedicated database user limited to the `ladlitoys` database). If `MONGODB_URI` is absent the app falls back to PostgreSQL (`DATABASE_URL`, e.g. Neon) and finally to in-memory demo mode, where data is lost between serverless instances – never take real orders in demo mode. All data is stored in one `docs` collection/table created automatically.
2. **Payment gateway** – add the Razorpay merchant credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`). In the Razorpay dashboard add a webhook to `https://<your-domain>/api/payments/webhook` for `payment.captured`, `payment.failed` and `order.paid`. As soon as the keys exist the built-in sandbox is switched off automatically. Remove `ALLOW_SANDBOX_PAYMENTS` once real keys are set.
3. **Email** – choose one provider. **Resend:** verify a sending domain, set `RESEND_API_KEY` and `MAIL_FROM`. **SMTP (no domain needed, e.g. Gmail):** enable 2-step verification on the Google account, create an *App password*, then set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=<gmail address>`, `SMTP_PASS=<app password>` (`MAIL_FROM` is optional). Check `/api/health` shows the provider. Until a provider is set every notification is only recorded in Admin → Notifications and customers cannot receive password-reset emails.
4. **Domain** – add the custom domain in Vercel and set `NEXT_PUBLIC_SITE_URL` (used for sitemap, canonical URLs and email links).
5. **Content** – replace seed products with real ones in Admin → Products (upload photos, set prices/stock); edit banners, categories and brands; update policies in the footer.
6. **Change the admin password** (Account → Profile) after first login, and keep `ADMIN_PASSWORD` out of chat/e-mail.
7. **Image storage** – uploads are stored in the database (1 MB each). For a large catalogue move to object storage (Vercel Blob / S3 / Cloudinary) by changing `app/api/admin/upload` and `app/api/images`.

## 3. Environment variables

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | yes | long random string; signs session cookies |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | yes | admin account is created on first login with these |
| `MONGODB_URI`, `MONGODB_DB` | recommended | MongoDB Atlas connection string and database name (takes priority) |
| `DATABASE_URL` | alternative | PostgreSQL connection string (used when `MONGODB_URI` is not set) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | for online payments | merchant credentials |
| `RESEND_API_KEY`, `MAIL_FROM` | for emails | Resend provider |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | for emails | SMTP provider (used when Resend is not configured) |
| `ALLOW_DEMO_DB` | demo/tests only | lets a production build run on in-memory storage. Without it, sign-ups and orders are refused (503) when no database is connected |
| `NEXT_PUBLIC_SITE_URL` | recommended | e.g. `https://www.ladlitoys.com` |
| `ALLOW_SANDBOX_PAYMENTS` | demo only | `true` enables the test gateway when no Razorpay keys exist. **Never** leave on for a live store |
| `ALLOW_DEV_RESET_LINK` | dev only | returns the password-reset link in the API response. Never in production |

## 4. Daily operations

- **Orders**: Admin → Orders. Move an order through *Placed → Confirmed → Processing → Shipped → Out for delivery → Delivered*. Add carrier + tracking number before marking *Shipped*; the customer is notified at each step and sees the timeline on their order page.
- **Cash on delivery** orders are marked paid automatically when set to *Delivered*.
- **Cancel** restores stock. **Refund** calls Razorpay for online payments; for cash orders it is recorded only (refund the customer manually).
- **Inventory**: Admin → Inventory (inline editing, variant level). Stock is deducted when an order is confirmed (COD placed / online payment received). Items below 10 are flagged low.
- **Coupons**: Admin → Coupons (percent/fixed, minimum order, max discount, expiry, usage limit).
- **Reviews** are published immediately; hide or delete from Admin → Reviews.

## 5. Business rules (change in code if needed)

- Shipping ₹99, free for orders ≥ ₹999 after discounts (`lib/pricing.ts`).
- Tax: 5% GST added on the discounted subtotal (`TAX_RATE`).
- Currency: INR (₹). Low-stock threshold: 10.

## 6. Security measures in place

- scrypt password hashing; signed, `HttpOnly`, `SameSite=Lax`, `Secure` session cookies.
- Role-based access: every `/api/admin/*` route and `/admin` page requires the ADMIN role; customers can only read their own orders/addresses.
- Input validation on all write endpoints; per-IP rate limiting on auth, orders, payments, reviews, addresses, uploads and newsletter.
- CSRF protection: cross-origin state-changing API calls are rejected (`proxy.ts`).
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- Payments: card data never touches the server (Razorpay hosted checkout); payment signatures and webhooks are verified (HMAC-SHA256); order amounts are always recomputed on the server.
- Password-reset links are only emailed, never returned by the API (unless `ALLOW_DEV_RESET_LINK=true`).
- Known limitation: rate limiting is per serverless instance. Add Vercel Firewall / Upstash for stricter global limits at scale.

## 7. Verifying production readiness

```
node scripts/verify.mjs https://your-site.com
VERIFY_EMAIL=you@gmail.com node scripts/verify.mjs https://your-site.com   # also delivers a real reset email to you
```
Checks the persistent database (`/api/health`), stock deduction and restoration on order/cancel (simple and variant products), the oversell guard, and the password-reset flow. The test order is cancelled automatically so stock is restored.

## 8. Testing

```
npm install
npx playwright install chromium firefox
npm run build
npm run test:e2e        # 10 scenarios x 3 projects (Chromium, Firefox, mobile Chrome)
```
Tests start their own server on port 3113 with test credentials. To run against a deployed site: `E2E_BASE_URL=https://… npx playwright test --grep-invert admin`.
Safari/WebKit was not available in the build environment, so it has not been tested; please do a quick manual pass on an iPhone before launch.

## 9. Database layer

Data is stored through `lib/db.ts` (a small document store with MongoDB, PostgreSQL and in-memory backends). `prisma/schema.prisma` contains the fully normalised model for a later migration if reporting needs grow.
