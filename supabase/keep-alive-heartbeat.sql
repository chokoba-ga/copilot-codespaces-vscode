-- ============================================================================
-- Event POS - 自動一時停止(Pause)防止用ハートビート設定
-- ------------------------------------------------------------------------
-- Supabaseの無料プランは「7日間データベースへの操作がない」と自動的に
-- 一時停止（Paused）されます。このSQLは、毎日決まった時刻に
-- データベース自身へ軽い書き込みを行う「ハートビート」の仕組みを作り、
-- 一時停止のカウントをリセットし続けます。
--
-- 事前に、Supabaseダッシュボードの「Database」→「Extensions」で
-- 「pg_cron」を有効化してから、このSQLをSQL Editorで実行してください。
-- ============================================================================

create table if not exists public._heartbeat (
  id bigserial primary key,
  pinged_at timestamptz not null default now()
);

alter table public._heartbeat enable row level security;

select cron.schedule(
  'event-pos-keep-alive',
  '0 3 * * *',
  $$
    insert into public._heartbeat default values;
    delete from public._heartbeat where pinged_at < now() - interval '14 days';
  $$
);

-- 確認用（実行は不要）:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 10;
-- 停止したくなった場合:
--   select cron.unschedule('event-pos-keep-alive');
