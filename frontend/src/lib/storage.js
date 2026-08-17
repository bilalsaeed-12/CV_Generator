/**
 * storage.js
 * -----------------------------------------------------------------------------
 * The single boundary between this app and its data.
 *
 * Everything here calls the FastAPI backend. Nothing is stored in the browser
 * any more — not the session, not the documents.
 *
 * Every function is async and throws on failure, which is exactly how it
 * behaved back when it was faking a backend. That is why swapping the
 * implementation never required touching a single component.
 */

import { http, bootstrap, setAccessToken, clearAccessToken, toAppUser, ApiError } from './api';

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** URL-safe slug used for the public share link. */
export function slugify(text) {
  return (
    String(text || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'untitled'
  );
}

export { ApiError };

/* ------------------------------- auth ------------------------------------ */
/* The access token is held in memory by api.js; the refresh token is an
   httpOnly cookie the browser manages for us.                                */

export async function signUp({ name, email, password }) {
  const data = await http.post('/api/auth/signup', { name, email, password }, { auth: false });
  setAccessToken(data.access_token);
  return toAppUser(data.user);
}

export async function signIn({ email, password }) {
  const data = await http.post('/api/auth/login', { email, password }, { auth: false });
  setAccessToken(data.access_token);
  return toAppUser(data.user);
}

export async function signOut() {
  try {
    await http.post('/api/auth/logout', undefined, { auth: false, retry: false });
  } catch {
    // Signing out must never fail from the user's side. Even if the server is
    // unreachable, drop the local token so the UI reflects being signed out.
  }
  clearAccessToken();
}

/**
 * Restores the session on page load.
 * Async, because it makes a network call. AuthContext awaits it.
 */
export async function currentSession() {
  return toAppUser(await bootstrap());
}

export async function updateProfile(_userId, patch) {
  // Backend takes snake_case and ignores omitted keys.
  const body = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.email !== undefined) body.email = patch.email;
  if (patch.headline !== undefined) body.headline = patch.headline;
  return toAppUser(await http.patch('/api/auth/me', body));
}

export async function changePassword(_userId, { current, next }) {
  await http.post('/api/auth/change-password', {
    current_password: current,
    new_password: next,
  });
  // The server revoked every session, so this device is signed out too.
  clearAccessToken();
  return true;
}

export async function deleteAccount(_userId, password) {
  await http.del('/api/auth/me', { password });
  clearAccessToken();
}

/** Active logins for this account, for a "signed in on" screen. */
export async function listSessions() {
  return http.get('/api/auth/sessions');
}

export async function signOutEverywhere() {
  await http.post('/api/auth/logout-all');
  clearAccessToken();
}

/* ------------------------------ documents -------------------------------- */
/* The database stores the document in one JSONB column, so the API speaks
   { id, title, slug, published, content, version, ... } while the app has
   always used a flat object with basics/experience/... at the top level.
   The two mappers below are the only place that difference exists.          */

/**
 * Last version we saw for each document, used for optimistic locking.
 *
 * The server rejects a save whose version does not match the stored row, which
 * is what stops two open tabs from silently overwriting each other. Holding it
 * here rather than in component state keeps saveResume's signature unchanged —
 * nothing above this file had to be touched.
 */
const versionCache = new Map();

/** API record -> the flat shape every component already expects. */
function toAppResume(dto) {
  if (!dto) return null;
  if (dto.version !== undefined) versionCache.set(dto.id, dto.version);
  const { id, user_id, title, slug, published, content, version, created_at, updated_at } = dto;
  return {
    id,
    userId: user_id,
    title,
    slug,
    published,
    version,
    createdAt: created_at,
    updatedAt: updated_at,
    ...content, // basics, experience, education, skills, projects, design, kind
  };
}

/** Flat app object -> just the document half, for the content column. */
function toContent(resume) {
  const {
    id, userId, user_id, title, slug, published, version,
    createdAt, updatedAt, created_at, updated_at, deletedAt,
    ...content
  } = resume;
  return content;
}

export async function listResumes(_userId) {
  const rows = await http.get('/api/resumes');
  return rows.map(toAppResume);
}

export async function getResume(id) {
  return toAppResume(await http.get(`/api/resumes/${id}`));
}

/** Public share page. No auth — the browser may not even have a session. */
export async function getResumeBySlug(slug) {
  const dto = await http.get(`/api/public/resumes/${slug}`, { auth: false, retry: false });
  return {
    id: dto.id,
    title: dto.title,
    slug: dto.slug,
    published: true,
    updatedAt: dto.updated_at,
    ...dto.content,
  };
}

export async function createResume(_userId, draft) {
  const dto = await http.post('/api/resumes', {
    title: draft.title,
    content: toContent(draft),
  });
  return toAppResume(dto);
}

export async function saveResume(id, patch) {
  const body = {
    title: patch.title,
    content: toContent(patch),
    published: patch.published,
    // Cached value is authoritative: patch comes from component state, which
    // still holds whatever version was loaded at mount.
    version: versionCache.get(id) ?? patch.version,
  };

  try {
    return toAppResume(await http.patch(`/api/resumes/${id}`, body));
  } catch (err) {
    if (err.status === 409) {
      // Our version was stale. Drop it so the next attempt is unconditional
      // rather than looping on a conflict forever.
      versionCache.delete(id);
    }
    throw err;
  }
}

export async function duplicateResume(id) {
  return toAppResume(await http.post(`/api/resumes/${id}/duplicate`));
}

export async function deleteResume(id) {
  await http.del(`/api/resumes/${id}`);
  versionCache.delete(id);
}