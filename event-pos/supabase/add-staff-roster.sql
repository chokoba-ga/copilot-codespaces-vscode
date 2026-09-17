-- ============================================================================
-- Event POS - スタッフ名簿機能を追加するSQL
-- ------------------------------------------------------------------------
-- すでに supabase/schema.sql を実行済みのプロジェクトに対して、
-- 「事前登録した名前をタップしてログイン」機能を追加するためのSQLです。
-- 既存のテーブル・データには一切影響しません。
-- ============================================================================

create table if not exists public.staff_roster (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "order" int not null default 999,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

alter table public.staff_roster enable row level security;

create policy "staff_roster_select" on public.staff_roster for select using (auth.uid() is not null);
create policy "staff_roster_write" on public.staff_roster for all
  using (auth.uid() is not null) with check (auth.uid() is not null);

alter publication supabase_realtime add table public.staff_roster;
