# Cinema Seat Reservation System — Architecture

## 1. Overview

A cinema seat reservation system with the following core capabilities:

- **User authentication**
- **Session browsing**
- **Context switching**
  - Between halls (large / small)
  - By date (calendar)
  - Between sessions
- **Seat selection and booking**

---

## 2. Tech Stack

Stable, current-generation choices:

| Layer            | Technologies                                              |
| ---------------- | --------------------------------------------------------- |
| **Frontend**     | Next.js (App Router), React 18+, SCSS Modules            |
| **Data fetching**| Axios or Fetch API                                        |
| **Client state** | Zustand or TanStack React Query (optional)                |
| **Backend**      | NestJS, Prisma ORM                                        |
| **Database**     | PostgreSQL 14+                                            |
| **Infrastructure** | Docker, Docker Compose                                 |

---

## 3. High-Level Architecture

```text
[ Next.js Frontend ]
        |
        | HTTP (REST)
        v
[ NestJS Backend ]
        |
        | Prisma ORM
        v
[ PostgreSQL ]
```

---

## 4. Core Domain Model

Main entities:

| Entity         | Role                                      |
| -------------- | ----------------------------------------- |
| **User**       | Authenticated customer                    |
| **Movie**      | Film metadata                             |
| **Hall**       | Physical screen / auditorium              |
| **Seat**       | Seat in a hall (row + number)             |
| **Session**    | Scheduled showing (movie + hall + time)   |
| **Reservation**| User’s hold on a seat for a session       |

---

## 5. Database Schema (PostgreSQL + Prisma)

### User

| Field      | Notes                    |
| ---------- | ------------------------ |
| `id`       | UUID                     |
| `email`    | Unique                   |
| `password` | Nullable (OAuth users)   |
| `createdAt`| Timestamp                |

### Hall

| Field         | Notes        |
| ------------- | ------------ |
| `id`          |              |
| `name`        | e.g. Big / Small |
| `rowsCount`   |              |
| `seatsPerRow` |              |

### Seat

| Field    | Notes   |
| -------- | ------- |
| `id`     |         |
| `hallId` | FK → Hall |
| `row`    |         |
| `number` |         |

### Movie

| Field         | Notes |
| ------------- | ----- |
| `id`          |       |
| `title`       |       |
| `duration`    |       |
| `description` |       |

### Session

| Field       | Notes      |
| ----------- | ---------- |
| `id`        |            |
| `movieId`   | FK → Movie |
| `hallId`    | FK → Hall  |
| `startTime` |            |
| `price`     |            |

### Reservation

| Field       | Notes                         |
| ----------- | ----------------------------- |
| `id`        |                               |
| `userId`    | FK → User                     |
| `sessionId` | FK → Session                  |
| `seatId`    | FK → Seat                     |
| `status`    | `BOOKED` / `CANCELLED`        |
| `createdAt` |                               |

### Consistency: preventing double booking

- **Unique constraint:** `UNIQUE (sessionId, seatId)`
- Ensures the same seat cannot be reserved twice for the same session.

---

## 6. Authentication Strategy

### Option 1 — Recommended for a test / learning project

**JWT (email + password)**

| Pros                         | Cons        |
| ---------------------------- | ----------- |
| Fast to implement            | No SSO      |
| Full control                 |             |
| No third-party auth required |             |

### Option 2 — Optional

**OAuth (e.g. Google)**

| Pros                    | Cons                          |
| ----------------------- | ----------------------------- |
| Better UX               | More backend complexity       |
| No password storage     | Overkill for a small demo     |

### Recommendation

Use **JWT with refresh tokens** for a balance of security and implementation speed.

---

## 7. Backend Architecture (NestJS)

### Feature modules

- `AuthModule`
- `UsersModule`
- `MoviesModule`
- `SessionsModule`
- `HallsModule`
- `ReservationsModule`

### Suggested layout

```text
src/
  modules/
    auth/
    users/
    movies/
    sessions/
    halls/
    reservations/
  prisma/
```

---

## 8. REST API

### Auth

| Method | Path            |
| ------ | --------------- |
| `POST` | `/auth/register` |
| `POST` | `/auth/login`    |
| `GET`  | `/auth/me`       |

### Movies

| Method | Path              |
| ------ | ----------------- |
| `GET`  | `/movies`         |
| `GET`  | `/movies/:id`     |

### Sessions

| Method | Path                                      |
| ------ | ----------------------------------------- |
| `GET`  | `/sessions?date=YYYY-MM-DD&hallId=`       |
| `GET`  | `/sessions/:id`                          |

### Halls

| Method | Path                 |
| ------ | -------------------- |
| `GET`  | `/halls`             |
| `GET`  | `/halls/:id/seats`   |

### Reservations

| Method   | Path                   |
| -------- | ---------------------- |
| `POST`   | `/reservations`        |
| `GET`    | `/reservations/my`     |
| `DELETE` | `/reservations/:id`    |

### Create reservation — request body

```json
{
  "sessionId": "<uuid>",
  "seatId": "<uuid>"
}
```

---

## 9. Seat Availability Logic

When loading the seat map, the backend should return:

1. **All seats** for the relevant hall (or session context).
2. **Per-seat status:**
   - `AVAILABLE`
   - `BOOKED`

**Approach:** query seats with a `LEFT JOIN` on reservations filtered by `sessionId` and `seatId` (or equivalent Prisma relation), then derive availability from whether an active reservation exists.

---

## 10. Frontend Architecture (Next.js)

### Routes (App Router examples)

| Path        | Purpose              |
| ----------- | -------------------- |
| `/login`    | Authentication       |
| `/`         | Home / entry         |
| `/sessions` | Main booking flow    |

### Main screen behavior

- Date picker / calendar
- Hall switcher
- Session list
- Seat map

### UI building blocks

| Component       | Responsibility        |
| --------------- | --------------------- |
| `Calendar`      | Date selection        |
| `HallSwitcher`  | Hall selection        |
| `SessionList`   | Sessions for date/hall|
| `SeatMap`       | Grid of seats         |
| `Seat`          | Single seat control   |
| `BookingPanel`  | Confirm / summary     |

---

## 11. State Management

| Approach        | When to use                          |
| --------------- | ------------------------------------ |
| React state + hooks | Minimal viable product           |
| TanStack Query  | Caching, refetch, server sync        |

---

## 12. Seat Map Rendering

- **Grid:** `rowsCount × seatsPerRow` from hall metadata.
- **Per seat:** interactive control (e.g. button).
- **Color coding (example):**
  - Green — available  
  - Red — booked  
  - Yellow — selected (local UI state)

---

## 13. Concurrency & Race Conditions

**Problem:** two users attempt to book the same seat at the same time.

**Mitigations:**

1. **Database constraint** — `UNIQUE (sessionId, seatId)` (required).
2. **`try` / `catch`** on insert — map unique violation to a friendly error.
3. **Optimistic UI** — optional; always reconcile with server response.

---

## 14. Docker Setup

| Service    | Port  |
| ---------- | ----- |
| `frontend` | 3000  |
| `backend`  | 4000  |
| `postgres` | 5432  |

Orchestrate with **Docker Compose** (shared network, volumes for Postgres data).

---

## 15. Environment Variables

### Backend

| Variable          | Purpose              |
| ----------------- | -------------------- |
| `DATABASE_URL`    | PostgreSQL connection |
| `JWT_SECRET`      | Signing key          |
| `JWT_EXPIRES_IN`  | Access token TTL     |

### Frontend

| Variable              | Purpose           |
| --------------------- | ----------------- |
| `NEXT_PUBLIC_API_URL` | Backend base URL  |

---

## 16. Prisma Notes

- Run **migrations** for all schema changes.
- **Seed data** should cover:
  - Halls  
  - Seats  
  - Movies  
  - Sessions spanning multiple days  

---

## 17. Seed Strategy

On first setup / seed run, create:

- **Two halls** (large / small).
- **Seats** for each hall (from `rowsCount` × `seatsPerRow`).
- **Several movies**.
- **Sessions** across multiple days for realistic testing.

---

## 18. UX Flow

1. User signs in.
2. User selects **date**, **hall**, and **session**.
3. User sees the **seat map**.
4. User picks a **seat** and confirms **booking**.

---

## 19. Possible Enhancements (Optional)

- **WebSockets** — live seat availability updates.
- **Hold timer** — temporary lock before payment.
- **Payments** — integration with a provider.
- **Admin panel** — content and schedule management.

---

## 20. Key Design Decisions

| Decision              | Rationale                    |
| --------------------- | ---------------------------- |
| REST over GraphQL     | Simpler for this scope       |
| JWT                   | Fast to ship                 |
| Prisma                | Productive schema & queries  |
| SCSS Modules          | Scoped, maintainable styles  |
| Docker                | Reproducible environments    |

---

## 21. Risks

- **Race conditions** during concurrent bookings (mitigate with DB constraints + error handling).
- **Seat map UI** complexity (responsive layout, accessibility).
- **Client–server state sync** (stale selections after another user books).

---

## 22. Development Plan

1. Bring up **Docker** (frontend, backend, Postgres).
2. Configure **Prisma** and apply **schema + migrations**.
3. Implement **authentication**.
4. Implement **Sessions API** (list/filter by date and hall).
5. Implement **seat map / halls + seats API**.
6. Implement **reservation** creation with uniqueness handling.
7. Wire up the **Next.js** frontend.
8. Polish **UI/UX** (loading states, errors, feedback).

---

*End of document.*
