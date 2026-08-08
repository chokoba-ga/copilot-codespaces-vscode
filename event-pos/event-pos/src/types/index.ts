/**
 * Event POS ドメイン型定義
 * ------------------------------------------------------------------
 * Supabase (PostgreSQL) のテーブル構成（詳細は supabase/schema.sql）:
 *
 *  profiles        （auth.users と1対1、id = auth.users.id）
 *  events
 *  categories      （event_id で紐づく）
 *  products        （event_id で紐づく）
 *  sales           （event_id で紐づく）
 *  expenses        （event_id で紐づく）
 *  audit_logs      （event_id で紐づく）
 *
 * すべてのイベント配下データは event_id 単位で完全に分離される（RLSで強制）。
 */

/** 権限ロール。将来「複数店舗」「複数学校」に拡張する場合も
 *  event_members テーブルなどを追加して role を持たせる形で拡張可能。 */
export type UserRole = 'admin' | 'staff' | 'viewer';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
}

/** イベントのステータス */
export type EventStatus = 'planning' | 'active' | 'archived';

/** イベント内の「日程」（Day1, Day2, ...）。自由な日数に対応する */
export interface EventDay {
  id: string; // 'day1' 'day2' ...
  label: string; // '1日目' '10/24（土）' など任意表示名
  date: string; // 'YYYY-MM-DD'
  order: number;
}

export interface EventSettings {
  /** 消費税・手数料などレシート表示に関わる将来拡張用（現状は税込一律） */
  taxIncluded: boolean;
  /** PDFに載せる正式名称（学校名など） */
  organizationName: string;
  /** 会計責任者名（PDF表紙に表示） */
  representativeName: string;
  /** 在庫不足とみなす残数のしきい値 */
  lowStockThreshold: number;
  /** テーマカラー（将来イベントごとのブランディング用） */
  themeColor: string;
}

export interface EventDoc {
  id: string;
  name: string; // '第75回工業祭'
  description: string;
  status: EventStatus;
  days: EventDay[];
  settings: EventSettings;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  /** ソフトデリート用。削除確認済みのイベントのみ true */
  archived: boolean;
}

/** 複製時にコピーする対象を明示する型 */
export interface EventDuplicatePayload {
  name: string;
  days: EventDay[];
}

export type ProductCategoryDoc = {
  id: string;
  name: string;
  order: number;
  color: string; // Tailwindのアクセントカラー名 or HEX
  createdAt: number;
};

export interface ProductDoc {
  id: string;
  name: string;
  categoryId: string | null;
  price: number; // 販売価格
  cost: number; // 原価（1個あたり）
  initialStock: number; // 初期在庫（Day横断の総数）
  currentStock: number; // 現在在庫（販売・ロスで自動減算）
  description: string;
  imageUrl: string | null;
  order: number;
  isActive: boolean; // false の場合レジ画面に表示しない（廃番）
  createdAt: number;
  updatedAt: number;
}

/** 販売明細1行 */
export interface SaleItem {
  productId: string;
  productName: string; // 削除後も履歴で名前が分かるようスナップショットを保持
  categoryId: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export type SaleKind = 'sale' | 'loss'; // loss = ロス・試食（売上0円で在庫のみ減算）

export interface SaleDoc {
  id: string;
  eventId: string;
  dayId: string; // どのイベント日の売上か
  kind: SaleKind;
  items: SaleItem[];
  total: number;
  receivedAmount: number | null; // 預かり金額（現金の場合）
  changeAmount: number | null;
  staffUid: string;
  staffName: string;
  isCancelled: boolean;
  cancelledAt: number | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  isRefunded: boolean;
  refundedAt: number | null;
  refundedBy: string | null;
  refundReason: string | null;
  note: string;
  createdAt: number;
}

export const EXPENSE_CATEGORIES = [
  '材料',
  '装飾',
  '印刷',
  '文房具',
  '交通費',
  'その他',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface ExpenseDoc {
  id: string;
  eventId: string;
  dayId: string | null;
  date: string; // 'YYYY-MM-DD'
  amount: number;
  category: ExpenseCategory;
  description: string;
  staffUid: string;
  staffName: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export type AuditAction =
  | 'event.create' | 'event.update' | 'event.delete' | 'event.duplicate'
  | 'product.create' | 'product.update' | 'product.delete'
  | 'sale.create' | 'sale.cancel' | 'sale.refund'
  | 'expense.create' | 'expense.update' | 'expense.delete'
  | 'settings.update' | 'member.role_change';

export interface AuditLogDoc {
  id: string;
  eventId: string;
  action: AuditAction;
  targetId: string | null;
  actorUid: string;
  actorName: string;
  detail: string;
  createdAt: number;
}

/** レジ画面のカート行 */
export interface CartLine {
  product: ProductDoc;
  quantity: number;
}

/** ダッシュボード集計期間フィルタ */
export type DayFilter = 'all' | string; // 'all' または dayId

export interface DashboardStats {
  todaySales: number;
  totalSales: number;
  totalExpense: number;
  profit: number;
  profitRate: number;
  itemsSold: number;
  ranking: { productId: string; name: string; qty: number; revenue: number }[];
  byCategory: { categoryId: string; name: string; revenue: number }[];
  byHour: { hour: number; revenue: number }[];
  byDay: { dayId: string; label: string; revenue: number }[];
  lowStock: ProductDoc[];
  soldOut: ProductDoc[];
}
