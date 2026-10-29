# HRC Sports — Full-stack cricket turf booking

A Next.js App Router + TypeScript + MongoDB/Mongoose starter. Includes a responsive booking website, availability endpoint, booking persistence, interval-overlap checks, and a token-protected admin dashboard.

## Requirements
- Node.js 20.9 or newer
- MongoDB Atlas database (recommended) or local MongoDB

## Run locally
1. Extract the ZIP and open the project directory in a terminal.
2. Install packages:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in real values:
   ```env
   MONGODB_URI=mongodb+srv://.../hrc_sports?retryWrites=true&w=majority
   ADMIN_TOKEN=use-a-long-random-secret-here
   NEXT_PUBLIC_HOURLY_RATE=800
   NEXT_PUBLIC_WHATSAPP_NUMBER=
   ```
   Never commit `.env.local` or expose `ADMIN_TOKEN` in any `NEXT_PUBLIC_` variable.
4. In MongoDB Atlas, create a database user and allow your current IP in Network Access. Use the connection string from Atlas.
5. Start the app:
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000. Admin dashboard: http://localhost:3000/admin.

## Features
- Responsive HRC Sports landing page and booking form.
- `GET /api/bookings?date=YYYY-MM-DD` returns unavailable hours and rate.
- `POST /api/bookings` validates the request, checks overlapping active bookings, and saves a `pending` booking.
- `GET /api/admin/bookings` requires `Authorization: Bearer <ADMIN_TOKEN>`.
- `PATCH /api/bookings/:id` lets the admin confirm, cancel, or reopen a booking with the same token.
- Admin page lists customer/contact info, slot, duration, total, status, and actions.
- Prices are read from `NEXT_PUBLIC_HOURLY_RATE` (defaults to ₹800).

## API examples
Create a booking:
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"customerName":"Demo Customer","phone":"9876543210","gameType":"Friendly match","date":"2027-01-15","startHour":18,"duration":2}'
```
Load admin bookings:
```bash
curl http://localhost:3000/api/admin/bookings -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

## Important production notes
This is a runnable full-stack starter, not a deployed service. Configure MongoDB, real rates, opening hours, business details, backups, and HTTPS before accepting customers. The overlap check is application-level; two nearly simultaneous requests can still race without a database transaction/locking strategy. For production booking guarantees, deploy MongoDB as a replica set and implement an atomic reservation/transaction strategy. Add rate limiting, request logging, privacy/retention rules, and proper admin authentication/session management before public launch. The admin token is a simple starter gate, not a substitute for a full user system. Payments and WhatsApp notifications are not wired up yet.
