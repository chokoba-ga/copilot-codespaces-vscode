/**
 * Event POS ドメイン型定義
 * バックエンドは Supabase (PostgreSQL + Auth + Realtime)。supabase/schema.sql 参照。
 */

export type UserRole = 'admin' | 'staff' | 'viewer';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
}

/** 事前登録しておく「よく使う名前」の一覧。タップするだけで名乗れるようにするための一覧。 */
export interface StaffRosterMember {
  id: string;
  name: string;
  order: number;
  createdAt: number;
}

export type EventStatus = 'planning' | 'active' | 'archived';

export interface EventDay {
  id: string;
  label: string;
  date: string; // 'YYYY-MM-DD'
  order: number;
}

export interface EventSettings {
  taxIncluded: boolean;
  organizationName: string;
  representativeName: string;
  lowStockThreshold: number;
  themeColor: string;
  /** 学校からの補助費・初期資金（円）。売上とは別に管理し、収支の把握に使う。 */
  subsidyAmount: number;
}

export interface EventDoc {
  id: string;
  name: string;
  description: string;
  status: EventStatus;
  days: EventDay[];
  settings: EventSettings;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  archived: boolean;
}

export type ProductCategoryDoc = {
  id: string;
  name: string;
  order: number;
  color: string;
  createdAt: number;
};

export interface ProductDoc {
  id: string;
  name: string;
  categoryId: string | null;
  price: number;
  cost: number;
  initialStock: number;
  currentStock: number;
  description: string;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  categoryId: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export type SaleKind = 'sale' | 'loss';

export interface SaleDoc {
  id: string;
  eventId: string;
  dayId: string;
  kind: SaleKind;
  items: SaleItem[];
  total: number;
  receivedAmount: number | null;
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

export const EXPENSE_CATEGORIES = ['材料', '装飾', '印刷', '文房具', '交通費', 'その他'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface ExpenseDoc {
  id: string;
  eventId: string;
  dayId: string | null;
  date: string;
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
  | 'settings.update' | 'member.role_change'
  | 'roster.create' | 'roster.delete';

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

export interface CartLine {
  product: ProductDoc;
  quantity: number;
}

export type DayFilter = 'all' | string;

export interface DashboardStats {
  todaySales: number;
  totalSales: number;
  totalExpense: number;
  subsidyAmount: number;
  profit: number;
  profitRate: number;
  /** 手元に残る資金の目安 = 補助費 + 売上 - 支出（原価は含まない、実際の入出金ベース） */
  cashBalance: number;
  itemsSold: number;
  ranking: { productId: string; name: string; qty: number; revenue: number }[];
  byCategory: { categoryId: string; name: string; revenue: number }[];
  byHour: { hour: number; revenue: number }[];
  byDay: { dayId: string; label: string; revenue: number }[];
  lowStock: ProductDoc[];
  soldOut: ProductDoc[];
}
