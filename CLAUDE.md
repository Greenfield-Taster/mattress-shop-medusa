# CLAUDE.md — Mattress Shop Backend

## Overview

MedusaJS v2 backend for a Ukrainian mattress e-commerce store. Custom modules for products, customers, orders, and promo codes on top of the MedusaJS framework.

**Stack:** Node.js 20+, TypeScript, MedusaJS 2.10.3, PostgreSQL, MikroORM
**Frontend counterpart:** `../mattress-shop/` (React 19 SPA)

## Commands

```bash
npm run dev          # Dev server with hot reload — http://localhost:9000
npm run build        # Build to .medusa/server
npm start            # Start production server
npm run seed         # Seed store, sales channel, Ukraine, UAH, shipping
npx medusa exec ./src/scripts/seed-mattresses.ts   # Seed 3 mattresses with 29 size variants each
npx medusa db:generate <module-name>               # Generate migration for module
npx medusa db:migrate                               # Run pending migrations
```

Test scripts exist but test directories are empty:
```bash
npm run test:unit                     # No tests written
npm run test:integration:http         # No tests written
npm run test:integration:modules      # No tests written
```

Note: Test scripts use Unix-style `TEST_TYPE=...` syntax — won't work on Windows without `cross-env`.

## Directory Structure

```
src/
├── api/
│   ├── middlewares.ts                # Zod validation, CORS, Multer for image uploads
│   ├── store/
│   │   ├── mattresses/route.ts       # GET — list with filtering/sorting/pagination
│   │   ├── mattresses/popular/route.ts  # GET — popular products
│   │   ├── mattresses/[handle]/route.ts # GET — product detail
│   │   ├── orders/route.ts           # POST — create order; GET — list user orders
│   │   ├── orders/[id]/route.ts      # GET — order detail (owner vs public view)
│   │   ├── promo-codes/route.ts      # POST — validate promo code
│   │   ├── delivery/cities/          # EMPTY — planned proxy, not implemented
│   │   └── delivery/warehouses/      # EMPTY — planned proxy, not implemented
│   ├── auth/
│   │   ├── send-code/route.ts        # POST — send SMS verification code
│   │   ├── verify-code/route.ts      # POST — verify code, return JWT
│   │   ├── google/route.ts           # POST — Google OAuth login
│   │   ├── me/route.ts              # GET — current user profile (JWT required)
│   │   └── update/route.ts          # PUT — update profile (JWT required)
│   ├── shop-orders/route.ts          # GET — customer orders (JWT required, custom CORS)
│   ├── admin/
│   │   ├── mattresses/route.ts       # GET/POST — list/create mattresses
│   │   ├── mattresses/[id]/route.ts  # GET/PUT/DELETE — mattress CRUD
│   │   ├── mattresses/upload/route.ts # POST — image upload (Multer, 10MB max)
│   │   ├── promo-codes/route.ts      # GET/POST — list/create promo codes
│   │   ├── promo-codes/[id]/route.ts # GET/PUT/DELETE — promo code CRUD
│   │   ├── shop-customers/route.ts   # GET — list customers
│   │   ├── shop-customers/[id]/route.ts # GET/PUT/DELETE — customer CRUD (soft delete)
│   │   ├── shop-orders/route.ts      # GET — list orders with pagination
│   │   └── shop-orders/[id]/route.ts # GET/PUT — order detail + status update
│   └── admin/custom/route.ts         # Placeholder (returns 200)
├── modules/
│   ├── mattress/
│   │   ├── models/mattress-attributes.ts  # height, hardness, block_type, cover_type, max_weight, fillers (JSON), descriptions, specs, is_new, discount_percent
│   │   ├── service.ts                     # CRUD with @ts-expect-error for dynamic MedusaService methods
│   │   ├── types/index.ts                 # Constants: hardness, block types, cover types, fillers, 29 sizes
│   │   └── migrations/
│   ├── customer/
│   │   ├── models/customer.ts        # phone, email, first_name, last_name, city, address, verification_code, code_expires_at, google_id, last_login_at, is_active
│   │   ├── service.ts               # findByPhone, findByEmail, findByGoogleId, findOrCreateByPhone, findOrCreateByGoogle, saveVerificationCode, verifyCode, updateCustomerData
│   │   ├── migrations/              # 2 migrations (initial + city/address)
│   │   └── test-methods.ts          # DEBUG FILE — should be removed
│   ├── order/
│   │   ├── models/order.ts          # customer_id, contact info, delivery info, payment, amounts (bigNumber/kopecks), promo code data, status, admin_notes
│   │   ├── models/order-item.ts     # product_id, title, image, size, firmness, unit_price, quantity, total
│   │   ├── service.ts              # generateOrderNumber (random 8-digit), createOrderWithItems, getOrderWithItems, findByOrderNumber, getCustomerOrders, getOrdersByPhone, updateOrderStatus, updatePaymentStatus, cancelOrder, getOrdersStats
│   │   └── migrations/
│   └── promo-code/
│       ├── models/promo-code.ts     # code, discount_type (percentage/fixed), discount_value, min_order_amount, max_uses, current_uses, starts_at, expires_at, is_active
│       ├── service.ts              # findByCode, validatePromoCode, calculateDiscount, incrementUsage
│       └── migrations/
├── admin/
│   ├── routes/
│   │   ├── mattresses/page.tsx           # List with delete confirmation
│   │   ├── mattresses/create/page.tsx    # Create with 29-size price matrix, image upload, description templates (823 lines)
│   │   ├── mattresses/[id]/edit/page.tsx # Edit (no validation, can't add new sizes)
│   │   ├── promo-codes/page.tsx          # List with activate/deactivate toggle
│   │   ├── promo-codes/create/page.tsx   # Create with Zod-like validation
│   │   ├── promo-codes/[id]/edit/page.tsx # Edit
│   │   ├── shop-customers/page.tsx       # List with client-side search
│   │   ├── shop-customers/[id]/edit/page.tsx # Edit profile + activate/deactivate
│   │   └── shop-orders/page.tsx          # List + modal detail + status changes (NO confirmation dialog)
│   ├── widgets/
│   │   └── mattress-attributes.tsx       # Inline edit widget on product detail page
│   └── components/
│       └── image-uploader.tsx            # DEAD CODE — never imported by any file
├── links/
│   └── product-mattress.ts               # Product ↔ MattressAttributes module link
├── services/
│   └── sms.ts                            # MOCK ONLY — logs codes to console, no real SMS provider
├── utils/
│   ├── jwt.ts                            # generateToken (7-day expiry), verifyToken, extractBearerToken
│   └── mattress-formatters.ts            # formatProductForStore (raw English keys), formatProductForDetail, extractFillers, calculateDiscountedPrice, normalize sizes
├── scripts/
│   ├── seed.ts                           # Store, sales channel, Ukraine, UAH, tax, stock, shipping (idempotent)
│   ├── seed-mattresses.ts                # 3 test mattresses with all 29 size variants
│   ├── check-customers.ts               # Debug script — should be removed
│   ├── check-promo-table.ts             # Debug script — should be removed
│   └── reset-promo-code.ts              # Utility script
├── workflows/                            # EMPTY — only README.md template
├── subscribers/                          # Empty
└── jobs/                                 # Empty
```

## Auth System

### Routes (at `/auth/*`, NOT `/store/auth/*`)

**SMS flow:**
1. `POST /auth/send-code` → validates phone, normalizes to `0XXXXXXXXX`, generates 6-digit code with 5-min TTL
2. SMS service (`sms.ts`) is MOCK: in dev, logs code to console; in prod, also just logs — **no real SMS provider**
3. `POST /auth/verify-code` → checks code (or dev bypass `123456` when `NODE_ENV=development`), returns JWT + user
4. JWT signed with `JWT_SECRET` env var, 7 days expiry, no refresh mechanism

**Google OAuth:**
1. `POST /auth/google` → verifies Google ID token via `google-auth-library`
2. Finds or creates customer by Google ID or email (silent account merge if email matches existing phone user)
3. Returns JWT + user data

**Profile:**
- `GET /auth/me` → JWT required, returns customer data
- `PUT /auth/update` → validates email regex + phone format + uniqueness. WARNING: uses `.trim()` not `normalizePhoneNumber()` — can create inconsistent phone formats

### JWT
- `src/utils/jwt.ts` — uses `jsonwebtoken` library
- 7-day expiry, `JWT_SECRET` from env (throws if not set)
- No token refresh, no revocation/blacklist, no session tracking
- Each protected route does inline JWT extraction — no centralized middleware

## Product Data Flow

### List endpoint (`GET /store/mattresses`)
Uses `query.graph` to fetch products with mattress_attributes via module link, then filters in-memory (all products loaded first). Returns raw English keys for all attributes (frontend translates). Response:
```typescript
{
  items: [{ id, title, name, handle, thumbnail, image, images, type, height, hardness, blockType, cover, maxWeight, fillers, isNew, discount, discountPercent, inStock, descriptionMain, descriptionCare, price, oldPrice, variants, size }],
  total, page, limit, maxPrice
}
```
`name` is alias for `title`, `image` is alias for `thumbnail`, `cover` is alias for `coverType`. `inStock` is hardcoded `true`. `maxPrice` is the global max price across all products (for dynamic price filter slider).

### Detail endpoint (`GET /store/mattresses/:handle`)
Returns different structure:
```typescript
{
  mattress: {
    id, title, handle, thumbnail, images,
    height, hardness, blockType, coverType, maxWeight, fillers,
    isNew, discountPercent,
    description: { main, care, specs },    // Structured object (list endpoint has string)
    variants: { "Дитячий": [...], ... },   // GROUPED by category (list has flat array)
    allVariants: [...],                     // Flat array also provided
    price, oldPrice
  }
}
```
**No `name` field** (frontend uses `product.name` — will be undefined).
**No `image` field** (frontend uses `product.image` — will be undefined).

### Price storage
Prices in MedusaJS are in display currency units (hryvnias). Order model stores amounts in kopecks (x100) using `bigNumber` type. Conversions: `Math.round(amount * 100)` for storage, `/100` for display.

## Order System

### Create (`POST /store/orders`)
- Supports authenticated (JWT) and guest orders
- Validates: fullName (>=2), phone (truthy), email (truthy), deliveryMethod, paymentMethod, items (non-empty), totals.total (number)
- **Does NOT validate:** email format, phone format, delivery details per method
- **Does NOT recalculate totals** — trusts client-sent subtotal/discount/total
- Optionally creates customer account during checkout
- Validates promo code against DB (but frontend sends hardcoded promo data, not from DB)
- Generates random 8-digit order number (model comment says `ORD-YYYY-XXXXX` — outdated)
- **Delivery cost fields from frontend (`deliveryPrice`, `deliveryPriceType`) are silently dropped** — not in the type definition

### List (`GET /shop-orders`)
- JWT required
- Finds orders by `customer_id` OR by matching phone number
- **Performance issue:** fetches ALL orders then loops through to match phone (O(n) scan)

## Configuration

### `medusa-config.ts`
- Database: `DATABASE_URL` env var
- CORS: `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS` from env
- Secrets: `JWT_SECRET || "supersecret"`, `COOKIE_SECRET || "supersecret"` — **INSECURE fallbacks**
- File provider: `@medusajs/medusa/file-local` with `static/` directory — not suitable for production (no CDN, no container persistence)
- All 4 custom modules registered

### `src/api/middlewares.ts`
- Zod validation schemas for mattress create/update (H1-H5 hardness, optional product_type), promo code create/update, auth routes
- Custom CORS for `/shop-orders` route
- Multer for image uploads (10MB max, png/jpg/jpeg/webp/gif)

### Dependencies Note
`multer`, `cors`, `zod` are used in middlewares.ts but NOT listed in `package.json`. They work as transitive deps of MedusaJS — fragile, should be declared directly.

## Admin Panel

Custom admin pages for managing the store:

- **Mattresses:** List, Create (29-size price matrix + image upload), Edit (no validation, can't add new sizes)
- **Promo Codes:** List (with status badges), Create, Edit
- **Customers:** List (with search), Edit (soft delete on deactivate)
- **Orders:** List + modal detail + status/payment status changes

**Known issues:**
- Edit mattress has NO form validation
- Order status changes have no confirmation dialog
- `promo-codes/create`, `promo-codes/[id]/edit`, `shop-customers/[id]/edit` incorrectly export `defineRouteConfig`, creating unwanted sidebar entries
- Edit forms overwritten on query refetch (window focus discards unsaved changes)
- `ImageUploader` component (`src/admin/components/image-uploader.tsx`) is dead code — never imported

## Known Issues

See `docs/PROJECT-AUDIT-FULL.md` for the complete list with line numbers.

**Critical:**
- SMS service is mock-only — phone auth won't work in production
- JWT/Cookie secrets default to "supersecret"
- No payment gateway — card data sent in plain JSON
- CORS not configured for production frontend URL
- Product detail endpoint returns incompatible data for frontend (grouped variants, no `name`)
- No hosting configuration (no Dockerfile, Procfile, or PaaS config)

**Security:**
- Dev bypass code `123456` if NODE_ENV misconfigured
- Google auth logs PII to console (`auth/google/route.ts:73`)
- SMS codes logged to console in all modes (`sms.ts:42-51,67`)
- No rate limiting on auth endpoints
- No token refresh or revocation
- Silent Google account merge by email match

**Performance:**
- All mattresses loaded then filtered in-memory (`store/mattresses/route.ts:72`)
- All orders scanned to match phone (`shop-orders/route.ts:68-81`)
- N+1 queries in admin order listing

**Missing features (from original task checklist):**
- Cart API (Phase 3) — not started
- Wishlist module (Phase 5) — not started
- Delivery proxy API (Phase 7) — empty stub directories only
- Reviews module (Phase 8) — not started
- Formal checkout workflow (`src/workflows/`) — empty
- Centralized auth middleware (each route does inline JWT check)
