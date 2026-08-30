# Sheaf API — backend

FastAPI + PostgreSQL backend for the Sheaf resume builder. **Steps 1 and 2:**
project skeleton and full authentication. Resume CRUD is next.

Verified end to end against PostgreSQL 16 — 29 test cases, all passing. See
[What was tested](#what-was-tested).

---

## Setup

**1. You need the database first.** Run `db/01_schema.sql` against a database
called `sheaf` (you've already done this in pgAdmin).

**2. Install dependencies**

```bash
cd sheaf-backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**3. Configure**

```bash
cp .env.example .env
```

Open `.env` and set two things:

- `DATABASE_URL` — your Postgres password. Note the `+asyncpg` part; without it
  the app fails at startup.
- `SECRET_KEY` — generate one:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(64))"
  ```
  This key signs your access tokens. Changing it invalidates every token
  currently issued. Never commit it.

**4. Run**

```bash
uvicorn app.main:app --reload
```

Then check these two, in order:

- <http://localhost:8000/api/health/db> — should list all three tables
- <http://localhost:8000/docs> — interactive API docs, try endpoints in the browser

If `/api/health/db` returns 503, nothing else will work. Fix that first.

---

## Endpoints

| Method | Path | Auth | Frontend function |
|---|---|---|---|
| POST | `/api/auth/signup` | — | `signUp()` |
| POST | `/api/auth/login` | — | `signIn()` |
| POST | `/api/auth/refresh` | cookie | `currentSession()` |
| POST | `/api/auth/logout` | cookie | `signOut()` |
| POST | `/api/auth/logout-all` | bearer | new |
| GET | `/api/auth/me` | bearer | new |
| PATCH | `/api/auth/me` | bearer | `updateProfile()` |
| POST | `/api/auth/change-password` | bearer | `changePassword()` |
| DELETE | `/api/auth/me` | bearer | `deleteAccount()` |
| GET | `/api/auth/sessions` | bearer | new |
| GET | `/api/health/db` | — | — |

---

## How the auth works

Two token types, doing two different jobs.

**Access token** — a JWT, 15 minutes, stateless. Sent as
`Authorization: Bearer <token>`. Not stored server-side, so it can't be revoked
— which is exactly why it expires quickly.

**Refresh token** — 48 bytes of randomness, 30 days, stateful. Stored in
`auth_sessions` as a SHA-256 hash and delivered to the browser as an
**httpOnly cookie**, which JavaScript cannot read. Because it's in the
database, it *can* be revoked. That's what logout does.

The flow:

```
signup/login  ->  access token in the JSON body
                  refresh token in an httpOnly cookie

page reload   ->  POST /api/auth/refresh
                  browser sends the cookie automatically
                  new access token comes back

logout        ->  session row marked revoked, cookie cleared
```

### Decisions worth defending in a review

**Refresh tokens rotate.** Every refresh revokes the old token and issues a new
one. If a token is stolen and used, the real user's next refresh fails — the
theft becomes visible instead of silent.

**Only hashes are stored.** Passwords with bcrypt cost 12, refresh tokens with
SHA-256. A database leak hands the attacker nothing usable.

SHA-256 rather than bcrypt for tokens is deliberate: the token is 48 bytes of
cryptographic randomness, so there's no dictionary to attack. bcrypt's slowness
would buy nothing and add 250ms to every refresh.

**Login timing is constant.** When the email doesn't exist we still run a dummy
bcrypt check (`dummy_verify()`). Otherwise "no such account" returns in 2ms and
"wrong password" in 250ms — and that gap tells an attacker which emails are
registered.

**Login errors are identical.** Same message for a missing email and a wrong
password, for the same reason.

**Changing a password kills every session.** If someone else had access, that's
the action that locks them out.

**Deletes are soft.** `deleted_at` is set rather than the row removed, so an
accidental deletion is recoverable. Resumes are unpublished at the same moment,
so public links die immediately.

**Tokens are re-checked against the database.** A valid JWT isn't enough —
`get_current_user` confirms the account still exists and is active. A deleted
user's token stops working immediately rather than lingering for 15 minutes.

**`password_hash` cannot leak.** It isn't in the `UserOut` schema, so FastAPI
can't serialise it even if a route hands over the whole ORM object.

---

## Project layout

```
app/
├── main.py              FastAPI app, CORS, error handlers
├── config.py            settings from .env, validated at startup
├── database.py          async engine + per-request session
├── models/__init__.py   SQLAlchemy tables (mirror 01_schema.sql)
├── schemas/auth.py      Pydantic request/response shapes
├── core/
│   ├── security.py      hashing, JWT, refresh tokens
│   └── deps.py          get_current_user, cookie helpers
└── routers/
    ├── health.py
    └── auth.py
alembic/                 migrations
```

---

## Migrations

The database was created by `db/01_schema.sql`. Alembic is baselined against
that with a **no-op** first revision.

**Do not run `alembic revision --autogenerate`.** Autogenerate compares the
database to `app/models`, and the models deliberately don't declare the CHECK
constraints, partial indexes, and triggers that live in the SQL file — so it
reads them as "removed" and emits `DROP` statements. Those constraints are your
safety net.

Write migrations by hand instead:

```bash
alembic revision -m "add resume_versions table"
# edit the generated file's upgrade() and downgrade()
alembic upgrade head
```

Useful:

```bash
alembic current     # which revision is applied
alembic history     # all revisions
alembic downgrade -1
```

---

## What was tested

Run against live PostgreSQL 16. All passing:

**Signup & validation** — account created (201); duplicate email rejected 409,
including different capitalisation; password under 8 chars rejected 422 with a
readable message; response contains no `password_hash`.

**Login** — correct credentials 200; wrong password 401; uppercase email works
(CITEXT); identical error message for both failure modes.

**Tokens** — valid bearer token returns the user; missing token 401; malformed
token 401.

**Refresh & rotation** — valid cookie returns a new access token *and* a new
refresh cookie; replaying the old cookie returns 401; no cookie returns 401.

**Sessions** — two logins produce two active sessions; `current: true` marks the
one making the request; `logout-all` revokes both.

**Password change** — wrong current password 400; correct 200; all sessions
revoked afterwards; old password no longer logs in; new one does.

**Account deletion** — wrong password 400; correct 200; login afterwards 401;
an already-issued access token stops working immediately.

**CORS** — preflight from `http://localhost:5173` returns
`allow-origin` and `allow-credentials: true` (both required for the cookie).

---

## Troubleshooting

**`DATABASE_URL must start with postgresql+asyncpg://`** — you used the sync
driver. Add `+asyncpg`.

**`password authentication failed for user "postgres"`** — wrong password in
`.env`. Same one you use in pgAdmin.

**`/api/health/db` returns 503** — Postgres isn't running, or the database name
is wrong. Check the `sheaf` database exists in pgAdmin.

**`missing_tables` is not empty** — you're connected to the wrong database, or
`01_schema.sql` was run against `postgres` instead of `sheaf`.

**CORS errors in the browser** — `CORS_ORIGINS` must match your frontend's
origin exactly: no trailing slash, and `localhost` ≠ `127.0.0.1`.

**Cookie not being set** — for local HTTP, `COOKIE_SECURE=false`. When
deployed on different domains, you need `COOKIE_SECURE=true` **and**
`COOKIE_SAMESITE=none`, and the frontend must send `credentials: 'include'`.

---

## Deploying on Railway

Railway does not interpolate reference variables (e.g.
`${{Postgres.DATABASE_URL}}`) when they're used as the *value* of another
variable — the app would receive the literal, un-substituted string instead of
real credentials, and fail at startup.

To work around this, `entrypoint.sh` runs before uvicorn starts. It reads the
individual Postgres credentials (`PGUSER`, `PGPASSWORD`, `PGPORT`,
`PGDATABASE`) that Railway sets as real OS environment variables on this
service, builds a proper `postgresql+asyncpg://` URL against
`postgres.railway.internal`, and writes it to `/app/.env` — which Pydantic
Settings reads before anything else. `railway.json` sets this as the deploy
start command (`sh entrypoint.sh`) instead of calling `uvicorn` directly.

## Next

Step 3: wire these endpoints into the frontend's `src/lib/storage.js` — the
seven auth functions, plus making `currentSession()` async.
Step 4: resume CRUD.
