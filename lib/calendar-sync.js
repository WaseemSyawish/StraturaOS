/**
 * Calendar Sync — Server-side Google Calendar API integration
 * ───────────────────────────────────────────────────────────
 * Handles OAuth token refresh, event push/pull, and incremental sync.
 *
 * Requires env vars:
 *   GOOGLE_CALENDAR_CLIENT_ID
 *   GOOGLE_CALENDAR_CLIENT_SECRET
 *   GOOGLE_CALENDAR_REDIRECT_URI
 *
 * Usage:
 *   import { getAuthUrl, exchangeCode, syncCalendar } from '../lib/calendar-sync';
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ');

/**
 * Generate the OAuth consent URL for Google Calendar.
 */
export function getGoogleAuthUrl(state = '') {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/calendar/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access + refresh tokens.
 */
export async function exchangeGoogleCode(code) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/calendar/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenExpires: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refresh an expired access token.
 */
export async function refreshGoogleToken(refreshToken) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) throw new Error('Token refresh failed');

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    tokenExpires: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Ensure we have a valid access token, refreshing if needed.
 * @param {object} connection — CalendarConnection record from DB
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {string} Valid access token
 */
export async function ensureValidToken(connection, prisma) {
  if (connection.token_expires && new Date(connection.token_expires) > new Date()) {
    return connection.access_token;
  }

  if (!connection.refresh_token) {
    throw new Error('No refresh token available — user needs to re-authenticate');
  }

  const refreshed = await refreshGoogleToken(connection.refresh_token);

  await prisma.calendarConnection.update({
    where: { id: connection.id },
    data: {
      access_token: refreshed.accessToken,
      token_expires: refreshed.tokenExpires,
      updated_at: new Date(),
    },
  });

  return refreshed.accessToken;
}

/**
 * Fetch events from Google Calendar (incremental sync using syncToken).
 */
export async function fetchGoogleEvents(accessToken, calendarId = 'primary', syncToken = null) {
  const params = new URLSearchParams({
    maxResults: '250',
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  if (syncToken) {
    params.set('syncToken', syncToken);
  } else {
    // First sync — get events from 30 days ago
    const timeMin = new Date(Date.now() - 30 * 86400000).toISOString();
    params.set('timeMin', timeMin);
  }

  const url = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 410) {
    // Sync token expired — do a full sync
    return fetchGoogleEvents(accessToken, calendarId, null);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API failed: ${err}`);
  }

  const data = await res.json();
  return {
    events: (data.items || []).map(normalizeGoogleEvent),
    nextSyncToken: data.nextSyncToken || null,
    nextPageToken: data.nextPageToken || null,
  };
}

/**
 * Push a task to Google Calendar as an event.
 */
export async function pushEventToGoogle(accessToken, task, calendarId = 'primary') {
  const event = taskToGoogleEvent(task);
  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to push event: ${err}`);
  }

  return res.json();
}

/**
 * Update an existing Google Calendar event.
 */
export async function updateGoogleEvent(accessToken, googleEventId, task, calendarId = 'primary') {
  const event = taskToGoogleEvent(task);
  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) throw new Error('Failed to update Google Calendar event');
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────

function normalizeGoogleEvent(gEvent) {
  const start = gEvent.start?.dateTime || gEvent.start?.date;
  const end = gEvent.end?.dateTime || gEvent.end?.date;
  return {
    googleId: gEvent.id,
    title: gEvent.summary || 'Untitled',
    description: gEvent.description || '',
    startDate: start,
    endDate: end,
    location: gEvent.location || null,
    status: gEvent.status, // 'confirmed', 'tentative', 'cancelled'
    htmlLink: gEvent.htmlLink,
    updated: gEvent.updated,
  };
}

function taskToGoogleEvent(task) {
  const hasTime = task.dueTime || task.hasTime;
  const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();

  const event = {
    summary: task.title || 'Untitled Task',
    description: [
      task.description || '',
      task.tags?.length ? `Tags: ${task.tags.join(', ')}` : '',
      task.priority ? `Priority: ${task.priority}` : '',
    ].filter(Boolean).join('\n'),
  };

  if (hasTime) {
    event.start = { dateTime: dueDate.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    const endDate = task.endDate ? new Date(task.endDate) : new Date(dueDate.getTime() + 60 * 60 * 1000);
    event.end = { dateTime: endDate.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  } else {
    const dateStr = dueDate.toISOString().split('T')[0];
    event.start = { date: dateStr };
    event.end = { date: dateStr };
  }

  if (task.location) {
    event.location = task.location;
  }

  return event;
}

/**
 * Full sync cycle: pull remote → merge → push local
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {object} connection — CalendarConnection record
 * @param {Array} localTasks — Current task list
 */
export async function syncCalendar(prisma, connection, localTasks = []) {
  const accessToken = await ensureValidToken(connection, prisma);
  const calendarId = connection.calendar_id || 'primary';

  // Pull from Google
  const { events, nextSyncToken } = await fetchGoogleEvents(
    accessToken,
    calendarId,
    connection.sync_token
  );

  // Update sync token
  if (nextSyncToken) {
    await prisma.calendarConnection.update({
      where: { id: connection.id },
      data: {
        sync_token: nextSyncToken,
        last_synced: new Date(),
        updated_at: new Date(),
      },
    });
  }

  return {
    imported: events.filter((e) => e.status !== 'cancelled'),
    cancelled: events.filter((e) => e.status === 'cancelled'),
    syncToken: nextSyncToken,
  };
}

export default {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  refreshGoogleToken,
  ensureValidToken,
  fetchGoogleEvents,
  pushEventToGoogle,
  updateGoogleEvent,
  syncCalendar,
};
