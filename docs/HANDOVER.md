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

1. **Database** – accept the Neon terms (Vercel → Storage → Neon) or set `DATABASE_URL` to any PostgreSQL. Until then the site runs in *demo mode*: data lives in server memory and is lost on restarts / between serverless instances. **Do not take real orders before this is done.** The `docs` table is created automatically.
2. **Payment gateway** – add the Razorpay merchant credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`). In the Razorpay dashboard add a webhook to `https://<your-domain>/api/payments/webhook` for `payment.captured`, `payment.failed` and `order.paid`. As soon as the keys exist the built-in sandbox is switched off automatically. Remove `ALLOW_SANDBOX_PAYMENTS` once real keys are set.
3. **Email** – create a Resend account, verify the sending domain, set `RESEND_API_KEY` and `MAIL_FROM` (e.g. `Ladli Toys <orders@yourdomain.com>`). Until then every notification is only recorded in Admin → Notifications.
4. **Domain** – add the custom domain in Vercel and set `NEXT_PUBLIC_SITE_URL` (used for sitemap, canonical URLs and email links).
5. **Content** – replace seed products with real ones in Admin → Products (upload photos, set prices/stock); edit banners, categories and brands; update policies in the footer.
6. **Change the admin password** (Account → Profile) after first login, and keep `ADMIN_PASSWORD` out of chat/e-mail.
7. **Image storage** – uploads are stored in the database (1 MB each). For a large catalogue move to object storage (Vercel Blob / S3 / Cloudinary) by changing `app/api/admin/upload` and `app/api/images`.

## 3. Environment variables

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | yes | long random string; signs session cookies |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | yes | admin account is created on first login with these |
| `DATABASE_URL` | recommended | PostgreSQL connection string |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | for online payments | merchant credentials |
| `RESEND_API_KEY`, `MAIL_FROM` | for emails | |
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

## 7. Testing

```
npm install
npx playwright install chromium firefox
npm run build
npm run test:e2e        # 10 scenarios x 3 projects (Chromium, Firefox, mobile Chrome)
```
Tests start their own server on port 3113 with test credentials. To run against a deployed site: `E2E_BASE_URL=https://… npx playwright test --grep-invert admin`.
Safari/WebKit was not available in the build environment, so it has not been tested; please do a quick manual pass on an iPhone before launch.

## 8. Moving off the demo database

Data is stored through `lib/db.ts` (a small document store on a single Postgres table). `prisma/schema.prisma` contains the fully normalised model for a later migration if reporting needs grow.
