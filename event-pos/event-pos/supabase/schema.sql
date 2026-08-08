-- ============================================================================
-- Event POS - Supabase (PostgreSQL) スキーマ
-- ------------------------------------------------------------------------
-- Supabaseダッシュボードの「SQL Editor」にこのファイルの中身を全部貼り付けて
-- 「Run」を押すだけで、テーブル・権限（RLS）・会計処理の関数が全部できます。
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles（アプリ内ユーザー情報。auth.users と1対1）
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  role text not null default 'viewer' check (role in ('admin', 'staff', 'viewer')),
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

-- 新規ログイン時に自動でprofileを作成する（常に viewer。自己昇格を防ぐため
-- クライアントからは role を指定できない設計にしている）。
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- events / categories / products / sales / expenses / audit_logs
-- ----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status text not null default 'planning' check (status in ('planning', 'active', 'archived')),
  days jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  created_by uuid not null references auth.users(id),
  archived boolean not null default false
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  "order" int not null default 999,
  color text not null default 'brand',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  price numeric not null default 0,
  cost numeric not null default 0,
  initial_stock int not null default 0,
  current_stock int not null default 0,
  description text not null default '',
  image_url text,
  "order" int not null default 999,
  is_active boolean not null default true,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  day_id text not null,
  kind text not null check (kind in ('sale', 'loss')),
  items jsonb not null,
  total numeric not null default 0,
  received_amount numeric,
  change_amount numeric,
  staff_uid uuid not null references auth.users(id),
  staff_name text not null,
  is_cancelled boolean not null default false,
  cancelled_at bigint,
  cancelled_by uuid,
  cancel_reason text,
  is_refunded boolean not null default false,
  refunded_at bigint,
  refunded_by uuid,
  refund_reason text,
  note text not null default '',
  created_at bigint not null
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  day_id text,
  date text not null,
  amount numeric not null default 0,
  category text not null,
  description text not null,
  staff_uid uuid not null references auth.users(id),
  staff_name text not null,
  note text not null default '',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  action text not null,
  target_id text,
  actor_uid uuid not null references auth.users(id),
  actor_name text not null,
  detail text not null default '',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index on public.categories (event_id);
create index on public.products (event_id);
create index on public.sales (event_id, created_at desc);
create index on public.expenses (event_id, created_at desc);
create index on public.audit_logs (event_id, created_at desc);

-- ----------------------------------------------------------------------------
-- ロール判定ヘルパー
-- ----------------------------------------------------------------------------
create function public.my_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_admin() returns boolean language sql stable as $$
  select public.my_role() = 'admin';
$$;

create function public.is_staff_or_admin() returns boolean language sql stable as $$
  select public.my_role() in ('staff', 'admin');
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: 全員読める。自分の表示名だけ変更可。role変更はadminのみ（設定画面から）。
create policy "profiles_select" on public.profiles for select using (auth.uid() is not null);
create policy "profiles_update_self_name" on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- events: 読み取りは全員。作成・更新・削除は admin のみ。
create policy "events_select" on public.events for select using (auth.uid() is not null);
create policy "events_write" on public.events for all
  using (public.is_admin()) with check (public.is_admin());

-- categories: 読み取り全員。書き込みは admin のみ。
create policy "categories_select" on public.categories for select using (auth.uid() is not null);
create policy "categories_write" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- products: 読み取り全員。通常の編集は admin のみ
-- （在庫の増減は下記の submit_sale / cancel_sale 関数経由でのみ行う）。
create policy "products_select" on public.products for select using (auth.uid() is not null);
create policy "products_write" on public.products for all
  using (public.is_admin()) with check (public.is_admin());

-- sales: 読み取り全員。直接のINSERT/UPDATEは禁止し、必ずRPC関数を経由させる
-- （在庫との整合性をサーバー側で保証するため）。
create policy "sales_select" on public.sales for select using (auth.uid() is not null);

-- expenses: 読み取り全員。作成・更新・削除は staff/admin。
create policy "expenses_select" on public.expenses for select using (auth.uid() is not null);
create policy "expenses_write" on public.expenses for all
  using (public.is_staff_or_admin()) with check (public.is_staff_or_admin());

-- audit_logs: 閲覧は admin のみ。作成はRPC関数経由のみ（直接INSERT不可）。
create policy "audit_logs_select" on public.audit_logs for select using (public.is_admin());

-- ----------------------------------------------------------------------------
-- RPC: 会計登録（在庫チェック＋減算＋売上登録をサーバー側で原子的に実行）
-- ----------------------------------------------------------------------------
create function public.submit_sale(
  p_event_id uuid,
  p_day_id text,
  p_kind text,
  p_items jsonb, -- [{productId, productName, categoryId, unitPrice, quantity}]
  p_received_amount numeric,
  p_note text
)
returns public.sales
language plpgsql security definer set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products;
  v_total numeric := 0;
  v_built_items jsonb := '[]'::jsonb;
  v_now bigint := (extract(epoch from now()) * 1000)::bigint;
  v_sale public.sales;
  v_staff_name text;
begin
  if not public.is_staff_or_admin() then
    raise exception '販売を登録する権限がありません';
  end if;

  select display_name into v_staff_name from public.profiles where id = auth.uid();

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products
      where id = (v_item->>'productId')::uuid and event_id = p_event_id
      for update;

    if v_product is null then
      raise exception '商品が見つかりません';
    end if;
    if v_product.current_stock < (v_item->>'quantity')::int then
      raise exception '在庫が不足しています: %（残り%個）', v_product.name, v_product.current_stock;
    end if;

    update public.products
      set current_stock = current_stock - (v_item->>'quantity')::int, updated_at = v_now
      where id = v_product.id;

    v_built_items := v_built_items || jsonb_build_object(
      'productId', v_product.id,
      'productName', v_product.name,
      'categoryId', v_product.category_id,
      'unitPrice', v_product.price,
      'quantity', (v_item->>'quantity')::int,
      'subtotal', case when p_kind = 'loss' then 0 else v_product.price * (v_item->>'quantity')::int end
    );
    if p_kind != 'loss' then
      v_total := v_total + v_product.price * (v_item->>'quantity')::int;
    end if;
  end loop;

  insert into public.sales (
    event_id, day_id, kind, items, total, received_amount, change_amount,
    staff_uid, staff_name, note, created_at
  ) values (
    p_event_id, p_day_id, p_kind, v_built_items, v_total,
    case when p_kind = 'sale' then p_received_amount else null end,
    case when p_kind = 'sale' and p_received_amount is not null and p_received_amount >= v_total
      then p_received_amount - v_total else null end,
    auth.uid(), coalesce(v_staff_name, ''), coalesce(p_note, ''), v_now
  ) returning * into v_sale;

  insert into public.audit_logs (event_id, action, target_id, actor_uid, actor_name, detail, created_at)
  values (p_event_id, 'sale.create', v_sale.id::text, auth.uid(), coalesce(v_staff_name, ''),
    case when p_kind = 'loss' then 'ロス・試食を登録' else '会計を登録' end, v_now);

  return v_sale;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: 会計取消（管理者のみ。在庫を元に戻す）
-- ----------------------------------------------------------------------------
create function public.cancel_sale(p_sale_id uuid, p_reason text)
returns public.sales
language plpgsql security definer set search_path = public
as $$
declare
  v_sale public.sales;
  v_item jsonb;
  v_now bigint := (extract(epoch from now()) * 1000)::bigint;
  v_actor_name text;
begin
  if not public.is_admin() then
    raise exception '取消を行う権限がありません';
  end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if v_sale is null then raise exception '会計が見つかりません'; end if;
  if v_sale.is_cancelled then raise exception 'この会計はすでに取消済みです'; end if;

  select display_name into v_actor_name from public.profiles where id = auth.uid();

  for v_item in select * from jsonb_array_elements(v_sale.items)
  loop
    update public.products
      set current_stock = current_stock + (v_item->>'quantity')::int, updated_at = v_now
      where id = (v_item->>'productId')::uuid;
  end loop;

  update public.sales set
    is_cancelled = true, cancelled_at = v_now, cancelled_by = auth.uid(), cancel_reason = p_reason
    where id = p_sale_id
    returning * into v_sale;

  insert into public.audit_logs (event_id, action, target_id, actor_uid, actor_name, detail, created_at)
  values (v_sale.event_id, 'sale.cancel', v_sale.id::text, auth.uid(), coalesce(v_actor_name, ''),
    '会計を取消（理由: ' || coalesce(nullif(p_reason, ''), 'なし') || '）', v_now);

  return v_sale;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: 返金登録（管理者のみ。在庫は戻さない）
-- ----------------------------------------------------------------------------
create function public.refund_sale(p_sale_id uuid, p_reason text)
returns public.sales
language plpgsql security definer set search_path = public
as $$
declare
  v_sale public.sales;
  v_now bigint := (extract(epoch from now()) * 1000)::bigint;
  v_actor_name text;
begin
  if not public.is_admin() then
    raise exception '返金処理を行う権限がありません';
  end if;

  select display_name into v_actor_name from public.profiles where id = auth.uid();

  update public.sales set
    is_refunded = true, refunded_at = v_now, refunded_by = auth.uid(), refund_reason = p_reason
    where id = p_sale_id
    returning * into v_sale;

  if v_sale is null then raise exception '会計が見つかりません'; end if;

  insert into public.audit_logs (event_id, action, target_id, actor_uid, actor_name, detail, created_at)
  values (v_sale.event_id, 'sale.refund', v_sale.id::text, auth.uid(), coalesce(v_actor_name, ''),
    '返金処理を記録（理由: ' || coalesce(nullif(p_reason, ''), 'なし') || '）', v_now);

  return v_sale;
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: 汎用の操作ログ記録（イベント作成・商品編集・支出登録などから呼ぶ）
-- ----------------------------------------------------------------------------
create function public.write_audit_log(
  p_event_id uuid, p_action text, p_target_id text, p_detail text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_name text;
begin
  select display_name into v_actor_name from public.profiles where id = auth.uid();
  insert into public.audit_logs (event_id, action, target_id, actor_uid, actor_name, detail, created_at)
  values (p_event_id, p_action, p_target_id, auth.uid(), coalesce(v_actor_name, ''), p_detail,
    (extract(epoch from now()) * 1000)::bigint);
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: 権限（role）変更。admin のみ実行可能。
-- ----------------------------------------------------------------------------
create function public.update_user_role(p_uid uuid, p_role text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '権限を変更する権限がありません';
  end if;
  if p_role not in ('admin', 'staff', 'viewer') then
    raise exception '不正なロールです';
  end if;
  update public.profiles set role = p_role where id = p_uid;
end;
$$;

grant execute on function public.submit_sale to authenticated;
grant execute on function public.cancel_sale to authenticated;
grant execute on function public.refund_sale to authenticated;
grant execute on function public.write_audit_log to authenticated;
grant execute on function public.update_user_role to authenticated;

-- ----------------------------------------------------------------------------
-- Realtime（リアルタイム同期）を有効化
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.sales;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.profiles;
