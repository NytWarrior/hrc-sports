# HRC Sports — Full-stack cricket turf booking

Next.js App Router + TypeScript + MongoDB/Mongoose booking application for HRC Sports. Includes a customer booking flow, separate day/night sessions and pricing, 1–6 hour reservations, MongoDB availability, admin booking management, pricing controls, and date-specific blocked time ranges.

## Requirements
- Node.js 20.9 or newer
- MongoDB Atlas (recommended) or a reachable MongoDB deployment

## Local setup
1. Extract the ZIP and open a terminal in the `hrc-sports-fullstack` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and enter your real values:
   ```env
   MONGODB_URI=mongodb+srv://.../hrc_sports?retryWrites=true&w=majority
   ADMIN_TOKEN=generate-a-long-random-secret-at-least-24-characters
   MORNING_HOURLY_RATE=800
   AFTERNOON_HOURLY_RATE=800
   EVENING_HOURLY_RATE=1000
   ```
   Never commit `.env.local` or put `ADMIN_TOKEN` in a `NEXT_PUBLIC_` variable.
4. In MongoDB Atlas, create a database user with a strong password. Configure Network Access for your app/deployment and copy the Atlas connection string into `MONGODB_URI`.
5. Run:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000`. Admin dashboard: `http://localhost:3000/admin`. Enter the same `ADMIN_TOKEN` to load the admin controls.

## Features
- Responsive customer website with date selection, day/night sessions, and 1–6 hour bookings.
- Day session: 6 AM–12 PM; night session: 4 PM–10 PM.
- Different day/night hourly rates. Defaults are ₹800/hour day and ₹1,000/hour night; update in the admin dashboard after configuring the token.
- `GET /api/bookings?date=YYYY-MM-DD` returns unavailable hourly slots and the three admin-configured category rates.
- `POST /api/bookings` validates customer details, session boundaries, duration, active booking conflicts, and blocked periods; creates pending bookings in MongoDB.
- Admin dashboard can list bookings, confirm/cancel/reopen bookings, update pricing, and create/remove blocked date/time ranges.
- All admin API endpoints require `Authorization: Bearer <ADMIN_TOKEN>`.
- Server-side validation rejects overlaps and out-of-session bookings. Cancelled bookings no longer block availability.

## API summary
- `GET /api/bookings?date=2026-11-15`
- `POST /api/bookings` with JSON fields `customerName`, `phone`, optional `email`, `gameType`, `date`, and `selectedHours` (an array of directly selected one-hour slots). Legacy `startHour` / `endHour` requests remain supported.
- `GET /api/admin/bookings` (admin token required)
- `PATCH /api/bookings/:id` with `{ "status": "confirmed" | "cancelled" | "pending" }` (admin token required)
- `GET/PATCH /api/admin/settings` (admin token required; PATCH body: `{ "morningRate": 800, "afternoonRate": 800, "eveningRate": 1000 }`)
- `GET/POST/DELETE /api/admin/blocked-slots` (admin token required; POST body: `{ "date": "YYYY-MM-DD", "startHour": 18, "duration": 2, "reason": "Maintenance" }`; DELETE query `?id=<blockId>`)

## Vercel deployment
1. Push this project to a private GitHub repository.
2. In Vercel, import the repository. Set Root Directory to `./` if `package.json` is in the repository root.
3. In Project → Settings → Environment Variables, add `MONGODB_URI`, `ADMIN_TOKEN`, `MORNING_HOURLY_RATE`, `AFTERNOON_HOURLY_RATE`, and `EVENING_HOURLY_RATE` for Production (and Preview/Development if needed). Use real secret values; do not include quote marks.
4. In MongoDB Atlas, ensure the database user/password are correct and Network Access allows your Vercel app to connect. `0.0.0.0/0` is broad and should only be a temporary diagnostic choice if you understand the risk; prefer an appropriate secure network strategy.
5. Redeploy after changing environment variables. Test the deployed customer flow and admin page.

## Build and test
```bash
npm install
npm run lint
npm run build
```
Manual checks:
1. Check day availability and night availability separately.
2. Try durations 1 through 6 and verify a duration cannot cross the session closing time.
3. Create a booking, then try to submit an overlapping booking; the API should return HTTP 409.
4. Block a date/time in `/admin`; confirm the customer page marks that time unavailable.
5. Cancel a booking and verify the time becomes available unless blocked or occupied by another active booking.
6. Change day/night prices in admin and verify the customer totals use the correct price.
7. Try admin APIs without the token; they should return HTTP 401.

## Important production notes
This is a functional starter, not a claim that your live site is deployed or production-audited. Configure real prices, contact details, backups, privacy/retention practices, monitoring, and rate limiting before public launch. The simple bearer-token admin gate is suitable for a controlled starter but is not a full multi-user authentication system. Application-level overlap checks can race under simultaneous requests; for strict booking guarantees at high traffic, implement an atomic reservation strategy/transaction and appropriate database constraints. Payments, email, and WhatsApp notifications are not implemented.


## Pricing categories and booking selection
Admin pricing is configured per hour for Morning (5 AM–11 AM), Afternoon (11 AM–5 PM), and Evening (5 PM–10 PM). Customers choose a start time and an end time directly; no duration dropdown or day/night session selection is required. The server calculates the bill by applying each category rate to the hours that fall inside that category, including bookings that cross category boundaries.


## Updated booking and pricing flow
- Admin sets hourly prices for Morning (5:00 AM–11:00 AM), Afternoon (11:00 AM–5:00 PM), and Evening (5:00 PM–10:00 PM).
- Customers do not select a duration or day/night session. They select a date, then a start time and an end time directly.
- The bill is calculated by the server using the category rate for each hour in the selected range. A booking crossing 11:00 AM or 5:00 PM is automatically split across the applicable rates.
- Opening window is 5:00 AM through 10:00 PM. The final end-time option is 10:00 PM.


### Customer slot selection and logo
- Customers can tap multiple individual one-hour slots; each selected slot is priced using the admin's saved category rate. Slots can be non-contiguous.
- Admins can upload a PNG, JPG, or WEBP logo from the Pricing categories section. Save prices & logo to publish it on the public site.


## WhatsApp booking and payment confirmation flow

1. In `/admin`, enter the HRC Sports WhatsApp number with country code and digits only (India example: `91` + the 10-digit mobile number), then click **Save settings**.
2. A customer selects one or more available hourly slots and submits their details. The app creates a **pending request** and opens WhatsApp with a pre-filled message containing the reference, customer details, date, selected slots, and estimated total. The customer still needs to press Send in WhatsApp.
3. Reply to the customer manually with your payment QR code and payment instructions.
4. After you verify payment, open `/admin`, refresh the dashboard if needed, and click **Confirm & block slots** for that request. Only confirmed bookings are removed from public availability; pending requests do not block slots.
5. If payment is not received or you decline the request, use **Cancel**.

Important: WhatsApp is opened using a `wa.me` click-to-chat link. This does not automatically send messages, deliver QR images, or verify payments. The customer must send the pre-filled message, and the admin must manually send the QR and confirm payment.
