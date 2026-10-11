import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './supabase.config.js';

const url = import.meta.env.VITE_SUPABASE_URL || supabaseConfig.url;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || supabaseConfig.publishableKey;
export const backend = url && key ? createClient(url, key) : null;
export const bucket = 'wish-photos';
export const MAX_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export function photoUrl(path) { return backend?.storage.from(bucket).getPublicUrl(path).data.publicUrl; }
let guestSession;
export async function ensureGuest() {
  if (!backend) throw new Error('Chức năng online chưa sẵn sàng. Vui lòng quay lại sau.');
  if (!guestSession) guestSession = (async () => {
    const { data, error } = await backend.auth.getSession();
    if (error) throw error;
    if (data.session) return data.session.user;
    const result = await backend.auth.signInAnonymously();
    if (result.error) throw result.error;
    return result.data.user;
  })();
  try { return await guestSession; } finally { guestSession = null; }
}
export function friendlyError(error) {
  if (error?.message?.includes('WAIT_BEFORE_POSTING')) return 'Bạn vừa gửi lời chúc. Vui lòng đợi một phút trước khi gửi tiếp.';
  return 'Chưa gửi được. Bạn kiểm tra kết nối và thử lại nhé; nội dung vẫn được giữ để gửi lại.';
}
