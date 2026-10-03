# Ladli Toys – Milestone 2: Shopping Experience

Builds on Milestone 1 (storefront, catalog, product pages, product APIs).

**Added in Milestone 2**
- Search & filtering: category, age, brand, price range, minimum rating, in-stock only; sorting by newest / popularity / rating / price
- Customer accounts: register, login, logout, forgot/reset password, profile & password change (scrypt-hashed passwords, signed httpOnly session cookie, basic rate limiting)
- Address management: add / edit / delete / default address
- Wishlist: guests (browser) and logged-in customers (saved to account, merged on login), move to cart
- Cart: variants, quantity management, stock validation, coupons, shipping & tax calculation (server-side quote API)
- Checkout: address selection, payment method, order review, order creation, confirmation page, order history
- Product reviews: star rating + text for logged-in customers
- Quick add-to-cart and wishlist heart on product cards

**API additions:** `/api/auth/*`, `/api/me`, `/api/addresses`, `/api/wishlist`, `/api/cart/quote`, `/api/orders`, `/api/products/[slug]/reviews`

**Notes**
- Data layer (`lib/db.ts`) uses PostgreSQL when `DATABASE_URL` is set, otherwise in-memory (demo mode – data resets on server restart).
- Payment: Cash on Delivery only; online payments arrive in Milestone 3. Coupons `WELCOME10` and `TOY100` are placeholders until admin-managed coupons (Milestone 3).
- Password-reset emails need an email provider (Milestone 4); until `EMAIL_ENABLED=true` the reset link is shown on screen.
- Shipping: ₹99, free over ₹999. Tax: 5% GST added at checkout.

## Run
```
npm install
AUTH_SECRET=some-long-random-string npm run dev   # http://localhost:3000
```
Env vars: `AUTH_SECRET` (required in production), `DATABASE_URL` (optional Postgres/Neon), `EMAIL_ENABLED`.
Live demo: https://ladli-toys.vercel.app
