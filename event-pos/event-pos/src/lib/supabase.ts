import { createClient } from '@supabase/supabase-js';

/**
 * SupabaseのURLとanonキーは公開情報として扱って問題ない設計（RLSで保護されるため）。
 * 値は環境変数（.env）から読み込む。詳細は README.md の「Supabaseセットアップ」を参照。
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
