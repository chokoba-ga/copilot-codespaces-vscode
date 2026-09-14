export function formatYen(value: number): string {
  return `¥${Math.round(value).toLocaleString('ja-JP')}`;
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '-';
  return `${value.toFixed(digits)}%`;
}

export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mi}`;
}

export function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDateJp(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const week = ['日', '月', '火', '水', '木', '金', '土'][new Date(y, m - 1, d).getDay()];
  return `${m}月${d}日（${week}）`;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 今日の日付を 'YYYY-MM-DD' で取得（端末のローカル時刻基準） */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function toDateStr(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' 形式同士は文字列比較がそのまま日付の前後関係になる（ISO形式のため） */
export function compareDateStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export { default as cx } from 'clsx';
