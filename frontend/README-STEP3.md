# Step 3 — frontend wired to the API

## What changed

| File | Change |
|---|---|
| `src/lib/api.js` | **NEW.** The only file that speaks HTTP. Holds the access token in memory, refreshes automatically on 401. |
| `src/lib/storage.js` | The 7 auth functions now call FastAPI. Document functions still use localStorage until step 4. |
| `src/context/AuthContext.jsx` | `currentSession()` is a network call now, so boot is async. |
| `src/pages/Settings.jsx` | Delete-account modal asks for the password (the API requires it). |
| `.env` / `.env.example` | `VITE_API_URL` |

No component, page, or the builder was touched.

## Run it

Two terminals.

**Backend:**
```
cd sheaf-backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload
```

**Frontend:**
```
cd sheaf
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173 and sign up. Then check pgAdmin:

```sql
SELECT email, name, created_at FROM users ORDER BY created_at DESC;
```

Your account is in Postgres. Refresh the browser — you stay signed in, because
the httpOnly cookie survives and the app silently calls /api/auth/refresh.

## How the token flow works

- **Access token** — in a JavaScript variable, never localStorage. An XSS bug
  cannot read it from disk because it was never written there.
- **Refresh token** — httpOnly cookie. JavaScript cannot read it *at all*,
  including `api.js`. The browser attaches it automatically.
- **On page load** — memory is empty, so `bootstrap()` calls `/api/auth/refresh`;
  the cookie rides along and returns a fresh access token.
- **On a 401 mid-session** — `api.js` refreshes once and replays the request.
  Concurrent 401s share one refresh, not one each.

## Still on localStorage (until step 4)

`listResumes`, `getResume`, `createResume`, `saveResume`, `duplicateResume`,
`deleteResume`, `getResumeBySlug`. Documents are keyed by the real Postgres
user id now, so nothing breaks — they just live in the browser for the moment.

## Verified

21 integration checks, running the real `storage.js` against the live API:
signup shape and no leaked password field; duplicate email 409; weak password
422 with readable text; profile update; sign out clears the token; case-
insensitive sign in; session restore via cookie; wrong password 401; password
change kills the old password; session listing; delete requires the password;
deleted account cannot sign in.

## Bug found and fixed during this step

The backend committed during FastAPI's dependency teardown, which can run
*after* the response is sent. A client firing its next request immediately
could read stale data — the password-change test caught exactly this. Mutating
auth routes now commit explicitly before returning.
