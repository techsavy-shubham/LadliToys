# Ladli Toys – Milestone 3: Admin, Orders & Payments

Builds on Milestones 1–2 (storefront, accounts, cart, checkout).

**Added in Milestone 3**
- **Admin authentication** – role-based; the store owner account is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. All `/api/admin/*` routes and `/admin/*` pages are admin-only.
- **Dashboard** – total sales, orders, customers, products, pending/completed orders, low-stock toys, recent orders & customers, 14-day sales chart.
- **Catalog management** – products (create/edit/delete, publish/unpublish, image upload, pricing & discounts, SKU, variants, age group, brand, category), categories (activate/deactivate), brands, homepage banners.
- **Inventory** – stock per product and per variant, low-stock / out-of-stock indicators, inline stock updates. Stock is deducted when an order is confirmed and restored on cancellation.
- **Customers** – list, search, order count, total spend, enable/disable account, order history.
- **Orders** – search/filter, details, status updates, shipping/tracking details, cancel, refund.
- **Payments** – Razorpay integration (create order → checkout → signature verification → webhook) using merchant credentials supplied via environment variables, plus a built-in sandbox gateway used automatically while no credentials are configured. Success / failure / cancellation handling, retry from the order page, payment ↔ order mapping, payment status management.
- **Coupons** – percentage or fixed, minimum order, maximum discount, expiry, usage limit, active/inactive; validated server-side at cart and checkout.
- **Review moderation** – hide / approve / delete.
- **Basic sales dashboard & analytics**.

## Environment variables
| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | required – signs session cookies |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | creates the admin account on first login |
| `DATABASE_URL` | optional – PostgreSQL (Neon). Without it data is in memory (demo mode) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | client's Razorpay credentials (enables real payments) |
| `RAZORPAY_WEBHOOK_SECRET` | webhook endpoint: `/api/payments/webhook` |
| `RESEND_API_KEY`, `MAIL_FROM` | optional – send transactional emails |

## Run
```
npm install
AUTH_SECRET=change-me ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=change-me-too npm run dev
```
Live demo: https://ladli-toys.vercel.app (admin at `/admin`)
