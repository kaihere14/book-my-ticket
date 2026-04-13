# Book My Ticket

Simplified seat booking platform built on top of the ChaiCode hackathon starter. Adds an auth layer (register/login with JWT) and protects booking endpoints so only logged-in users can reserve seats.

## Features

- User register & login with bcrypt-hashed passwords
- JWT access tokens (15 min expiry)
- Protected booking endpoint — token required
- Duplicate seat booking prevented via `SELECT ... FOR UPDATE` (row-level lock)
- Each booking tied to the logged-in user's `user_id`
- Mock movie data exposed via `/movies`
- Optional frontend included (`index.html`)

## Prerequisites

- Node.js v18+
- PostgreSQL v13+

## Setup

### 1. Clone & install

```bash
git clone <your-repo-url>
cd book-my-ticket
npm install
```

### 2. Database

Create the DB and tables:

```sql
CREATE DATABASE sql_class_2_db;

CREATE TABLE users (
  id       SERIAL PRIMARY KEY,
  name     VARCHAR(100)  NOT NULL,
  email    VARCHAR(100)  UNIQUE NOT NULL,
  password VARCHAR(255)  NOT NULL
);

CREATE TABLE seats (
  id       SERIAL PRIMARY KEY,
  isbooked INT     DEFAULT 0,
  name     VARCHAR(100),
  user_id  INT REFERENCES users(id)
);

-- seed seats
INSERT INTO seats (isbooked)
SELECT 0 FROM generate_series(1, 32);
```

> Default DB config: `localhost:5433`, database `sql_class_2_db`, user/pass `postgres/postgres`.  
> Override via env vars (see below).

### 3. Environment variables (optional)

Create a `.env` file or export directly:

```
JWT_SECRET=your_super_secret_key
PORT=8080
```

If `JWT_SECRET` is not set, a default insecure value is used — **always set this in production**.

### 4. Run

```bash
npm run dev
```

Server starts on `http://localhost:8080`.

---

## API Reference

### Auth

#### `POST /register`
Create a new account.

**Body:**
```json
{ "name": "Arman", "email": "arman@example.com", "password": "secret123" }
```

**Response `201`:**
```json
{ "user": { "id": 1, "name": "Arman", "email": "arman@example.com" }, "token": "<jwt>" }
```

---

#### `POST /login`
Login with existing credentials.

**Body:**
```json
{ "email": "arman@example.com", "password": "secret123" }
```

**Response `200`:**
```json
{ "user": { "id": 1, "name": "Arman", "email": "arman@example.com" }, "token": "<jwt>" }
```

---

### Movies

#### `GET /movies` — public
Returns mock movie list.

**Response `200`:**
```json
[
  { "id": 1, "title": "Dhurandhar The Revenge", "genre": "Action", "duration": "2h 15m", "language": "Hindi" },
  ...
]
```

---

### Seats

#### `GET /seats` — public
Returns all seats with booking status.

**Response `200`:**
```json
[{ "id": 1, "isbooked": 0, "name": null, "user_id": null }, ...]
```

---

#### `PUT /:id/:name` — protected
Book a seat. Requires JWT in `Authorization` header.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Params:**
- `id` — seat ID
- `name` — name to show on the seat

**Response `200`:**
```json
{ "seat": { "id": 5, "isbooked": 1, "name": "Arman", "user_id": 1 } }
```

**Response `409`** — seat already taken  
**Response `401`** — no token  
**Response `403`** — invalid / expired token  

---

## Flow

```
Register / Login  →  get JWT token
GET /movies       →  pick a movie (mocked)
GET /seats        →  see available seats
PUT /:id/:name    →  book a seat (send token in header)
```
