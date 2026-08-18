import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};

// Membaca kredensial Supabase secara bersih dari file .env (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)
export const SUPABASE_URL = metaEnv.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = metaEnv.VITE_SUPABASE_ANON_KEY || '';

// Instance Supabase Client untuk digunakan di seluruh aplikasi
// Menggunakan placeholder jika .env belum diisi agar aplikasi tidak crash saat inisialisasi awal
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key'
);

// Helper function untuk mengecek apakah Supabase sudah terhubung dengan key yang valid dari .env
export const isSupabaseConfigured = () => {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    !SUPABASE_URL.includes('your-project') &&
    !SUPABASE_URL.includes('placeholder')
  );
};

