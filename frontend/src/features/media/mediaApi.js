import { getToken } from '../../services/api';
import { API_BASE } from '../../services/apiConfig';

export async function mediaRequest(path, { body, ...options } = {}) {
  const token = getToken();
  const multipart = body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(!multipart && body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? multipart ? body : JSON.stringify(body) : undefined
  });
  let result;
  try {
    result = await res.json();
  } catch (err) {
    if (!res.ok) throw Object.assign(new Error(`errors.server (${res.status})`), { i18nKey: 'errors.server' });
    throw Object.assign(new Error('errors.badResponse'), { i18nKey: 'errors.badResponse' });
  }

  if (!res.ok) throw result?.message
      ? new Error(result.message)
      : Object.assign(new Error('errors.network'), { i18nKey: 'errors.network' });
  return result;
}
export async function uploadImage(file, alt) {
  if (!file || file.size > 8 * 1024 * 1024) throw Object.assign(new Error('errors.imageTooLarge'), { i18nKey: 'errors.imageTooLarge' });
  const body = new FormData();
  body.append('image', file);
  body.append('alt', alt);
  return mediaRequest('/admin/media', { method: 'POST', body });
}
