# User scenarios (backend API)

This document describes typical flows against the `apps/backend` REST API and the corresponding HTTP requests. The API base URL is written as `{API}` (e.g. `http://localhost:4000`). Authenticated calls use a **JWT access token** in the header: `Authorization: Bearer <token>`.

---

## 1. Sign-up and sign-in

Registration and login use **email and password**. Passwords are stored hashed (bcrypt). Responses include a short-lived **access token** (TTL from `JWT_EXPIRES_IN`, default `7d`) and the public user profile.

### 1.1. Register

1. `POST {API}/auth/register`  
   Body: `{ "email": "user@example.com", "password": "<min 8 chars>" }`  
   Success: `{ "accessToken": "<jwt>", "user": { "id", "email", "createdAt" } }`.  
   Conflict if email exists: `409`.

### 1.2. Login

1. `POST {API}/auth/login`  
   Body: `{ "email": "...", "password": "..." }`  
   Success: same shape as register.  
   Invalid credentials: `401`.

### 1.3. Check that the user is signed in

- `GET {API}/auth/me`  
  Header: `Authorization: Bearer <accessToken>`.  
  Response: `{ id, email, createdAt }`.  
  Missing or invalid token: `401 Unauthorized`.

### 1.4. Sign out

- `POST {API}/auth/logout`  
  Stateless JWT: server returns `{ "ok": true }`. The client should **discard** the stored access token.

### 1.5. Client notes

- CORS allows the frontend origin (`FRONTEND_ORIGIN`). Bearer tokens do not require `credentials: 'include'`.
- Auth routes are subject to **rate limiting** (see backend code).

---

## 2. Available seats: hall + movie + time

The backend does not accept a single “movie + time + hall” string as one parameter. You **first resolve a showing** (`sessionId`), then fetch the seat map with occupancy for that session.

### 2.1. Find a session (specific hall, date — i.e. movie and start time)

1. The user picks a **date** (`YYYY-MM-DD`) and **hall** (`hallId` from `GET {API}/halls`).
2. Request:  
   `GET {API}/sessions?date={YYYY-MM-DD}&hallId={hallId}`  
   Response: list of sessions with nested `movie` (including `title`, `id`), `hall`, `startTime`, `price`.

3. On the client, pick the right row by **movie** (`movie.title` / `movieId`) and **start time** (`startTime`). Store **`sessionId`**.

You can also load one session:  
`GET {API}/sessions/{sessionId}`.

### 2.2. Available vs booked seats for that session

- `GET {API}/sessions/{sessionId}/seats`

Response: array of seats in the hall where the session runs, with:

- `id`, `hallId`, `row`, `number`
- `status`: **`AVAILABLE`** or **`BOOKED`** (only “active” bookings from the DB perspective are counted as booked).

This endpoint matches “available seats in the hall for the chosen screening”: hall, time, and movie are already implied by `sessionId`.

> `GET {API}/halls/{hallId}/seats` returns **layout only** — no per-session occupancy; use the endpoint above for booking flows.

---

## 3. Booking a seat and releasing it

### 3.1. Preconditions

- The user **must be authenticated** (valid `Authorization: Bearer` token).
- Request body: `sessionId` and a `seatId` that was `AVAILABLE` on the client (the server re-validates hall and uniqueness).

### 3.2. Create a reservation

`POST {API}/reservations`  

Headers: `Authorization: Bearer <accessToken>`, `Content-Type: application/json`  

Body:

```json
{
  "sessionId": "<uuid>",
  "seatId": "<uuid>"
}
```

Success: reservation object (including related `session`, `seat`, `status`, and **`expiresAt`** — end of the hold window, default **5 minutes** after creation).  
Typical errors (short list): seat not in the session’s hall (`400`), seat already taken (`409 Conflict`), not authenticated (`401`), too many requests (`429`).

Hold length: override with env `RESERVATION_HOLD_MS` (milliseconds, minimum sensible value enforced in code).

### 3.3. List my reservations

`GET {API}/reservations/my` with `Authorization: Bearer <accessToken>`.

### 3.4. Cancel a reservation

`DELETE {API}/reservations/{reservationId}` (with bearer token), response `204`.  
You may cancel **only your own** active booking (`BOOKED`); status becomes `CANCELLED`, and the seat can show as `AVAILABLE` again on the next `GET .../sessions/{sessionId}/seats`.

### 3.5. Hold expiry and confirming a booking

New reservations are **time-limited holds**: `expiresAt` is set (default **5 minutes** from `POST /reservations`). When the hold passes:

- A **cron job** (every minute) sets the reservation to `CANCELLED`.
- `GET {API}/sessions/{sessionId}/seats` treats expired holds as **not** blocking the seat (same rule at read time, so the map updates even before the cron runs).

To **keep the seat** (e.g. after payment), remove the deadline:

`POST {API}/reservations/{reservationId}/confirm` (with bearer token) — clears `expiresAt`; the booking stays `BOOKED` until manual `DELETE` or admin flow.

You can still **`DELETE /reservations/{id}`** at any time to cancel an active hold or confirmed booking.

---

## Short flow: sign-in → seat

1. `POST /auth/register` or `POST /auth/login` → store `accessToken`.  
2. `GET /auth/me` with `Authorization: Bearer` — confirm the user.  
3. `GET /halls` — pick a hall.  
4. `GET /sessions?date=...&hallId=...` — pick movie and time → `sessionId`.  
5. `GET /sessions/{sessionId}/seats` — show `AVAILABLE` / `BOOKED`.  
6. `POST /reservations` — book (returns `expiresAt` hold deadline).  
7. Optional: `POST /reservations/{id}/confirm` — turn hold into a non-expiring booking.  
8. If needed: `DELETE /reservations/{id}` — cancel; if the hold is not confirmed, the server also auto-cancels after `expiresAt`.

---

## See also

- `ARCHITECTURE.md` — target architecture and REST tables (auth details may vary).
- `apps/backend/env.example` — environment variables for JWT, CORS, and database.
