const BACKEND_ORIGIN = 'http://192.168.100.91:3000';

const trimTrailingSlash = value => String(value || '').replace(/\/+$/, '');

const normalizedOrigin = trimTrailingSlash(BACKEND_ORIGIN);

export const API_BASE_URL = `${normalizedOrigin}/api`;
export const SOCKET_BASE_URL = normalizedOrigin;

