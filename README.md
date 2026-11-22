# PizzaHub Server

Express.js REST API backend for PizzaHub — a Bangladesh-based pizza ordering and delivery platform.

## Tech Stack
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB Atlas (Mongoose)
- **Auth**: Better Auth (JWT-based)
- **Port**: 5000

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `BETTER_AUTH_SECRET` | Better Auth secret |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `CLIENT_URL` | Frontend URL (default: http://localhost:3000) |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/menu-items` | List all menu items |
| POST | `/api/menu-items` | Create menu item (vendor) |
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Place order |
| GET | `/api/users` | List users (admin) |
| PATCH | `/api/users/:id/role` | Update user role (admin) |
| GET | `/api/payments/transactions` | List transactions (admin) |

## Seeding

```bash
node scripts/seed.js        # seed 12 menu items
node scripts/make-admin.js  # assign admin role
```
