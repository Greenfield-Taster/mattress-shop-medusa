# Just Sleep — Backend API

MedusaJS v2 backend for the Just Sleep mattress e-commerce store.

## Stack

- **Runtime:** Node.js 20+
- **Framework:** MedusaJS 2.10.3
- **Database:** PostgreSQL
- **ORM:** MikroORM
- **Language:** TypeScript
- **Email:** Resend + React Email
- **SMS:** TurboSMS
- **Payments:** WayForPay

## Setup

```bash
# Install dependencies
npm install

# Create .env from template
cp .env.template .env
# Fill in required values: DATABASE_URL, JWT_SECRET, COOKIE_SECRET

# Run migrations
npx medusa db:migrate

# Seed initial data (store, currency, shipping)
npm run seed

# Start dev server
npm run dev
```

Dev server runs at `http://localhost:9000`.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run seed` | Seed store data |
| `npx medusa db:migrate` | Run migrations |
| `npx medusa db:generate <module>` | Generate migration |

## Custom Modules

| Module | Description |
|--------|-------------|
| `mattress` | Product attributes (type, hardness, fillers, etc.) |
| `customer` | Phone auth, Google OAuth, verification codes |
| `order` | Orders with 8-digit numbers, line items |
| `promo-code` | Percentage/fixed discounts, usage limits, date ranges |
| `review` | Ratings, moderation, admin management |
| `resend` | Email notification provider with React Email templates |

## API Routes

### Store (`/store/*`)
- `GET /store/mattresses` — Product list with filtering, sorting, pagination
- `GET /store/mattresses/:handle` — Product detail
- `GET /store/mattresses/popular` — Popular products
- `POST /store/orders` — Create order
- `GET /store/orders/:id` — Order detail
- `POST /store/promo-codes` — Validate promo code
- `POST /store/contact` — Contact form
- `GET /store/delivery/cities` — City search (Nova Poshta, Delivery Auto, SAT)
- `GET /store/delivery/warehouses` — Warehouse search
- `GET /store/reviews/:productId` — Product reviews
- `POST /store/reviews` — Create review
- `POST /store/payments/webhook` — WayForPay webhook
- `POST /store/payments/initiate/:id` — Retry payment

### Auth (`/auth/*`)
- `POST /auth/send-code` — Send SMS code
- `POST /auth/verify-code` — Verify code, get JWT
- `POST /auth/google` — Google OAuth login
- `GET /auth/me` — Current user
- `PUT /auth/update` — Update profile
- `POST /auth/refresh` — Refresh JWT

### Admin (`/admin/*`)
Full CRUD for mattresses, promo codes, customers, orders, reviews.

## Environment Variables

See `.env.template` for all required and optional variables.

## Frontend

Frontend counterpart: [mattress-shop](https://github.com/Greenfield-Taster/mattress-shop)
