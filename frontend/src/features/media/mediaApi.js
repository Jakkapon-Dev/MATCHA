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
  const result = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(result.message || 'ติดต่อระบบไม่สำเร็จ กรุณาลองใหม่');
  return result;
}
export async function uploadImage(file, alt) {
  if (!file || file.size > 8 * 1024 * 1024) throw new Error('กรุณาเลือกรูปขนาดไม่เกิน 8 MB');
  const body = new FormData();
  body.append('image', file);
  body.append('alt', alt);
  return mediaRequest('/admin/media', { method: 'POST', body });
}
