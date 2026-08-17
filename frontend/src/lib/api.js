/**
 * api.js
 * -----------------------------------------------------------------------------
 * The only file that talks to the backend over HTTP.
 *
 * Token handling, and why it looks like this:
 *
 *   The ACCESS token lives in a module variable — plain JavaScript memory. It is
 *   deliberately NOT in localStorage. Anything in localStorage is readable by any
 *   script on the page, so a single XSS bug would hand an attacker the token.
 *   In memory it dies with the tab, which is the point.
 *
 *   The REFRESH token is an httpOnly cookie. JavaScript cannot read it at all —
 *   not even this file. The browser attaches it automatically to /api/auth
 *   requests because every call here sets credentials: 'include'.
 *
 *   On page load the access token is gone (memory was cleared), so bootstrap()
 *   calls /auth/refresh. The cookie goes along for the ride and we get a new
 *   access token back. That is how a signed-in user survives a refresh without
 *   anything sensitive ever being written to disk.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

let accessToken = null;

/** Queue so ten parallel 401s trigger one refresh, not ten. */
let refreshPromise = null;

export const setAccessToken = (t) => {
  accessToken = t;
};
export const getAccessToken = () => accessToken;
export const clearAccessToken = () => {
  accessToken = null;
};

/** Error carrying the HTTP status, so callers can branch on 409 vs 401 etc. */
export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function parseError(res) {
  let detail = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    // FastAPI always returns { detail: "..." } — see main.py's error handlers.
    if (typeof body?.detail === 'string') detail = body.detail;
    return new ApiError(detail, res.status, body);
  } catch {
    return new ApiError(detail, res.status, null);
  }
}

/**
 * One refresh at a time. Concurrent callers await the same promise.
 * Returns true if a new access token was obtained.
 */
async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        clearAccessToken();
        return false;
      }
      const data = await res.json();
      setAccessToken(data.access_token);
      return true;
    } catch {
      clearAccessToken();
      return false;
    } finally {
      // Release the lock on the next tick so late callers see the new token.
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();

  return refreshPromise;
}

/**
 * Core request.
 *
 * @param {string} path      e.g. '/api/auth/me'
 * @param {object} options   { method, body, auth, retry }
 */
async function request(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include', // required for the refresh cookie
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only rejects on network-level failure, never on a 4xx/5xx.
    throw new ApiError(
      'Cannot reach the server. Check that the backend is running.',
      0,
      null,
    );
  }

  // Access token expired mid-session: refresh once, then replay the request.
  if (res.status === 401 && auth && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(path, { method, body, auth, retry: false });
    }
  }

  if (!res.ok) throw await parseError(res);

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const http = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, body, opts) => request(path, { ...opts, method: 'DELETE', body }),
};

/**
 * Called once when the app mounts.
 * Returns the signed-in user, or null if there is no valid session.
 */
export async function bootstrap() {
  const ok = await refreshAccessToken();
  if (!ok) return null;
  try {
    return await http.get('/api/auth/me', { retry: false });
  } catch {
    clearAccessToken();
    return null;
  }
}

/** Backend UserOut -> the shape the frontend components already expect. */
export function toAppUser(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    headline: dto.headline ?? undefined,
    createdAt: dto.created_at,
  };
}

export { BASE_URL };
