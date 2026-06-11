const resolveApiBaseUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  return apiUrl.replace(/\/+$/, '');
};

const resolveApiOrigin = (): string => {
  const apiBaseUrl = resolveApiBaseUrl();
  return apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
};

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return '';

  if (/^(https?:\/\/|data:|blob:)/i.test(url)) {
    return url;
  }

  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  const origin = resolveApiOrigin();
  if (url.startsWith('/')) {
    return `${origin}${url}`;
  }

  return `${origin}/${url}`;
};
