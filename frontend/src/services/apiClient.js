const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiConfig = {
  baseUrl: String(rawBaseUrl).trim().replace(/\/+$/, ''),
  isConfigured: true,
  timeoutMs: 15000,
};

export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'network', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
    this.details = details;
  }
}

function classify(status) {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 404) return 'not_found';
  if (status === 422 || status === 400) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

export async function request(path, { method = 'GET', body, rawBody, headers = {}, signal, timeoutMs } = {}) {
  const timeout = AbortSignal.timeout(timeoutMs ?? apiConfig.timeoutMs);
  const composedSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let response;
  try {
    response = await fetch(`${apiConfig.baseUrl}${path}`, {
      method,
      signal: composedSignal,
      credentials: 'include',
      headers: rawBody === undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: rawBody !== undefined ? rawBody : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    const message = error?.name === 'TimeoutError' || error?.name === 'AbortError'
      ? 'The API took too long to respond. Check the connection and try again.'
      : 'Could not reach the Retail POS API. Start the API server and try again.';
    throw new ApiError(message, { kind: 'network' });
  }
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  if (!response.ok) {
    const detailMessages = Array.isArray(payload?.details)
      ? payload.details.map((detail) => detail?.message).filter((message) => typeof message === 'string' && message.trim())
      : [];
    const serverMessage = (payload && typeof payload === 'object' && (payload.message || payload.error))
      || `Request failed (${response.status})`;
    const message = detailMessages.length
      ? `${serverMessage} ${detailMessages.join(' ')}`
      : serverMessage;
    throw new ApiError(message, { status: response.status, kind: classify(response.status), details: payload });
  }
  return payload;
}

export const apiClient = {
  request,
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export async function checkApiHealth() {
  const started = performance.now();
  try {
    const response = await fetch(`${apiConfig.baseUrl}/api/health`, { credentials: 'include', signal: AbortSignal.timeout(6000) });
    return {
      status: response.ok ? 'online' : 'degraded',
      latencyMs: Math.round(performance.now() - started),
      message: response.ok ? 'API and database online' : `API responded with ${response.status}`,
    };
  } catch {
    return { status: 'offline', latencyMs: null, message: 'API or PostgreSQL is unreachable.' };
  }
}
