const BACKEND_ORIGIN = 'https://postperforated-inwrought-susy.ngrok-free.dev';

const trimTrailingSlash = value => String(value || '').replace(/\/+$/, '');

const normalizedOrigin = trimTrailingSlash(BACKEND_ORIGIN);

export const API_BASE_URL = `${normalizedOrigin}/api`;
export const SOCKET_BASE_URL = normalizedOrigin;
