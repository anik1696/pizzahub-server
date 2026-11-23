# PizzaHub Server

Express.js REST API backend for PizzaHub — a Bangladesh-based pizza ordering and delivery platform.

## Live URL

**https://pizzahub-server-pthr.onrender.com**

## GitHub Repositories

- **Client:** https://github.com/anik1696/pizzahub-client
- **Server:** https://github.com/anik1696/pizzahub-server

## Tech Stack

- Node.js + Express.js
- MongoDB Atlas (Mongoose)
- Better Auth (JWT + Google OAuth)
- Stripe (subscription payments)
- ImgBB (image proxy upload)

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in your environment variables
npm run dev
```

Server starts on http://localhost:5000

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `BETTER_AUTH_SECRET` | Better Auth secret |
| `BETTER_AUTH_URL` | This server's URL |
| `CLIENT_URL` | Frontend URL |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `IMGBB_API_KEY` | ImgBB API key |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/menu-items` | Get approved menu items |
| GET | `/api/menu-items/:id` | Get single item |
| POST | `/api/menu-items` | Add item (vendor) |
| PUT | `/api/menu-items/:id` | Update item (vendor/admin) |
| DELETE | `/api/menu-items/:id` | Delete item |
| POST | `/api/menu-items/:id/reviews` | Submit review (customer, verified purchase) |
| GET | `/api/orders` | Get orders |
| POST | `/api/orders` | Place order |
| PUT | `/api/orders/:id/status` | Update order status |
| GET | `/api/users` | Get all users (admin) |
| PUT | `/api/users/:id/block` | Block/unblock user (admin) |
| POST | `/api/payments/create-checkout-session` | Stripe checkout |
| POST | `/api/payments/webhook` | Stripe webhook handler |

## Deployment

Deployed on Render.com (free tier).  
Build command: `npm install`  
Start command: `node index.js`
