import type { EventDay, ProductCategoryDoc } from '@/types';
import { SelectField } from '@/components/common';

export type HistorySort = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';
export type HistoryStatusFilter = 'all' | 'normal' | 'cancelled' | 'refunded' | 'loss';

export interface HistoryFilterState {
  dayId: string;
  categoryId: string;
  status: HistoryStatusFilter;
  sort: HistorySort;
}

export function HistoryFilters({
  days,
  categories,
  value,
  onChange,
}: {
  days: EventDay[];
  categories: ProductCategoryDoc[];
  value: HistoryFilterState;
  onChange: (v: HistoryFilterState) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <SelectField label="イベント日" value={value.dayId} onChange={(e) => onChange({ ...value, dayId: e.target.value })}>
        <option value="all">全日程</option>
        {[...days]
          .sort((a, b) => a.order - b.order)
          .map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
      </SelectField>
      <SelectField label="カテゴリー" value={value.categoryId} onChange={(e) => onChange({ ...value, categoryId: e.target.value })}>
        <option value="all">すべて</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>
      <SelectField label="状態" value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value as HistoryStatusFilter })}>
        <option value="all">すべて</option>
        <option value="normal">通常</option>
        <option value="loss">ロス・試食</option>
        <option value="cancelled">取消済み</option>
        <option value="refunded">返金済み</option>
      </SelectField>
      <SelectField label="並び替え" value={value.sort} onChange={(e) => onChange({ ...value, sort: e.target.value as HistorySort })}>
        <option value="newest">新しい順</option>
        <option value="oldest">古い順</option>
        <option value="amount_desc">金額が高い順</option>
        <option value="amount_asc">金額が低い順</option>
      </SelectField>
    </div>
  );
}
