const normalizeHost = hostOrIp => {
  const raw = String(hostOrIp || '').trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `http://${raw}`;
};

const withTimeout = async (promiseFactory, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await promiseFactory(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

export async function sendEsp32LightCommand({
  esp32_ip,
  on,
  timeoutMs = 8000,
}) {
  const base = normalizeHost(esp32_ip);
  if (!base) {
    throw new Error('Missing ESP32 IP');
  }

  const url = `${base}${on ? '/on' : '/off'}`;

  return await withTimeout(
    async signal => {
      const res = await fetch(url, { method: 'GET', signal });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`ESP32 HTTP ${res.status}: ${text}`);
      }
      return text;
    },
    timeoutMs,
  );
}

