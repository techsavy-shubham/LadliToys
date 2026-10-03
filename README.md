# Ladli Toys – E-Commerce Store & Management Platform

Full-stack toy store built with Next.js, React, Tailwind CSS and Node REST APIs.
**Status: all four milestones delivered** (storefront → shopping experience → admin, orders & payments → launch & finalization).

- Live demo: https://ladli-toys.vercel.app · Admin: `/admin`
- Operations & go-live guide: [docs/HANDOVER.md](docs/HANDOVER.md)

## Features

**Customers** – homepage with banners, categories & age groups · search, filters (category, age, brand, price, rating, availability) & sorting · product pages with gallery, variants, stock, safety notes, reviews · wishlist · cart with coupons, shipping & tax · accounts (register, login, password reset, profile, addresses) · checkout with Cash on Delivery or online payment (Razorpay) · order history with live tracking timeline · email notifications.

**Admin** – dashboard & sales analytics · products (images, variants, pricing, publish) · inventory with low-stock alerts · categories, brands, banners · customers · orders (status, tracking, cancel, refund) · payments · coupons · review moderation · notification log.

**Launch** – SEO (metadata, Open Graph, JSON-LD, sitemap, robots) · security headers, CSRF protection, rate limiting · responsive, accessible UI · Playwright end-to-end tests on Chromium, Firefox and mobile Chrome.

## Run locally

```
npm install
AUTH_SECRET=change-me ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=change-me-too ALLOW_SANDBOX_PAYMENTS=true npm run dev
```

Environment variables, deployment and operations: see [docs/HANDOVER.md](docs/HANDOVER.md).

```
npm run build && npm run test:e2e
```
