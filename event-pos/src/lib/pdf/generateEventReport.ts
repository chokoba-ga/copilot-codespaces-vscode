import type { jsPDF as JsPdfType } from 'jspdf';
import type { EventDoc, ExpenseDoc, ProductDoc, SaleDoc } from '@/types';
import { registerJapaneseFont } from './registerFont';
import { formatDateJp, formatDateTime, formatPercent, formatYen, toDateStr } from '@/lib/utils';

const MARGIN = 14;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const FONT = 'NotoSansJP';

interface ReportInput {
  event: EventDoc;
  products: ProductDoc[];
  sales: SaleDoc[];
  expenses: ExpenseDoc[];
  dayFilter: string;
  generatedByName: string;
}

export async function generateEventReport(input: ReportInput): Promise<JsPdfType> {
  const { event, products, sales, expenses, dayFilter } = input;
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await registerJapaneseFont(doc);

  const validSales = sales.filter((s) => !s.isCancelled && (dayFilter === 'all' || s.dayId === dayFilter));
  const saleOnly = validSales.filter((s) => s.kind === 'sale');
  const relevantExpenses = expenses.filter((e) => dayFilter === 'all' || e.dayId === dayFilter || e.dayId === null);
  const days = dayFilter === 'all' ? event.days : event.days.filter((d) => d.id === dayFilter);

  const totalSales = saleOnly.reduce((s, x) => s + x.total, 0);
  const totalExpense = relevantExpenses.reduce((s, x) => s + x.amount, 0);
  const subsidyAmount = event.settings.subsidyAmount ?? 0;
  const productMap = new Map(products.map((p) => [p.id, p]));
  let costOfGoods = 0;
  for (const sale of saleOnly) {
    for (const item of sale.items) {
      const p = productMap.get(item.productId);
      if (p) costOfGoods += p.cost * item.quantity;
    }
  }
  const profit = totalSales - totalExpense - costOfGoods;
  const profitRate = totalSales > 0 ? (profit / totalSales) * 100 : 0;
  const cashBalance = subsidyAmount + totalSales - totalExpense;

  let y = drawCoverInfo(doc, event, days, input.generatedByName);
  y = drawSummaryBox(doc, y, { totalSales, totalExpense, profit, profitRate, subsidyAmount, cashBalance });

  y = drawSectionTable(doc, autoTable, y, '商品別売上・利益', buildProductSalesTable(saleOnly, products));
  y = drawSectionTable(doc, autoTable, y, '日別売上', buildDailySalesTable(event.days, saleOnly));
  y = drawSectionTable(doc, autoTable, y, '支出一覧', buildExpenseTable(relevantExpenses));
  y = drawSectionTable(
    doc,
    autoTable,
    y,
    '売上履歴',
    buildSalesHistoryTable(event.days, sales.filter((s) => dayFilter === 'all' || s.dayId === dayFilter)),
  );
  y = drawSectionTable(doc, autoTable, y, '在庫一覧', buildStockTable(products));
  void y;

  addPageNumbers(doc);
  return doc;
}

export async function downloadEventReport(input: ReportInput): Promise<void> {
  const doc = await generateEventReport(input);
  const filename = `${input.event.name}_会計報告書_${toDateStr(Date.now())}.pdf`;
  doc.save(filename);
}

function drawCoverInfo(doc: JsPdfType, event: EventDoc, days: EventDoc['days'], generatedByName: string): number {
  let y = 20;
  doc.setFont(FONT, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(event.settings.organizationName || ' ', MARGIN, y);
  y += 10;

  doc.setFontSize(20);
  doc.setTextColor(20);
  doc.text(`${event.name} 会計報告書`, MARGIN, y);
  y += 9;

  doc.setFontSize(10.5);
  doc.setTextColor(90);
  const period =
    days.length > 0
      ? `${formatDateJp(days[0].date)}${days.length > 1 ? ` 〜 ${formatDateJp(days[days.length - 1].date)}` : ''}`
      : '日程未設定';
  doc.text(`開催日: ${period}`, MARGIN, y);
  y += 6;
  doc.text(`会計責任者: ${event.settings.representativeName || '（未設定）'}`, MARGIN, y);
  y += 6;
  doc.text(`作成日: ${formatDateJp(toDateStr(Date.now()))}　作成者: ${generatedByName}`, MARGIN, y);
  y += 10;

  return y;
}

function drawSummaryBox(
  doc: JsPdfType,
  y: number,
  stats: {
    totalSales: number;
    totalExpense: number;
    profit: number;
    profitRate: number;
    subsidyAmount: number;
    cashBalance: number;
  },
): number {
  const row1: [string, string][] = [
    ['売上合計', formatYen(stats.totalSales)],
    ['支出合計', formatYen(stats.totalExpense)],
    ['利益', formatYen(stats.profit)],
    ['利益率', formatPercent(stats.profitRate)],
  ];
  y = drawStatRow(doc, y, row1);

  if (stats.subsidyAmount !== 0) {
    const row2: [string, string][] = [
      ['補助費・初期資金', formatYen(stats.subsidyAmount)],
      ['手元資金の目安', formatYen(stats.cashBalance)],
    ];
    y = drawStatRow(doc, y, row2, 2);
  }

  return y + 4;
}

function drawStatRow(doc: JsPdfType, y: number, items: [string, string][], columns = 4): number {
  const boxW = (PAGE_WIDTH - MARGIN * 2 - (columns - 1) * 3) / columns;
  const boxH = 20;

  items.forEach(([label, value], i) => {
    const x = MARGIN + i * (boxW + 3);
    doc.setDrawColor(225);
    doc.setFillColor(247, 249, 248);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, 'FD');
    doc.setFont(FONT, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(130);
    doc.text(label, x + 3, y + 7);
    doc.setFontSize(12.5);
    doc.setTextColor(20);
    doc.text(value, x + 3, y + 15);
  });

  return y + boxH + 6;
}

function drawSectionTable(
  doc: JsPdfType,
  autoTable: typeof import('jspdf-autotable')['default'],
  y: number,
  title: string,
  table: { head: string[][]; body: string[][] },
): number {
  if (table.body.length === 0) return y;

  if (y + 14 > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFont(FONT, 'normal');
  doc.setFontSize(12.5);
  doc.setTextColor(20);
  doc.text(title, MARGIN, y + 5);
  y += 9;

  autoTable(doc, {
    head: table.head,
    body: table.body,
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    styles: { font: FONT, fontStyle: 'normal', fontSize: 8.5, cellPadding: 2.2, textColor: [40, 40, 40] },
    headStyles: { font: FONT, fontStyle: 'bold', fillColor: [21, 135, 83], textColor: 255, fontSize: 8.5 },
    alternateRowStyles: { fillColor: [247, 249, 248] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (doc as any).lastAutoTable.finalY + 10;
}

function buildProductSalesTable(saleOnly: SaleDoc[], products: ProductDoc[]) {
  const map = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();
  for (const sale of saleOnly) {
    for (const item of sale.items) {
      const p = products.find((x) => x.id === item.productId);
      const row = map.get(item.productId) ?? { name: item.productName, qty: 0, revenue: 0, cost: 0 };
      row.qty += item.quantity;
      row.revenue += item.subtotal;
      row.cost += (p?.cost ?? 0) * item.quantity;
      map.set(item.productId, row);
    }
  }
  const rows = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  return {
    head: [['商品名', '販売数', '売上', '原価計', '利益']],
    body: rows.map((r) => [r.name, `${r.qty}`, formatYen(r.revenue), formatYen(r.cost), formatYen(r.revenue - r.cost)]),
  };
}

function buildDailySalesTable(days: EventDoc['days'], saleOnly: SaleDoc[]) {
  const sorted = [...days].sort((a, b) => a.order - b.order);
  return {
    head: [['日程', '日付', '売上']],
    body: sorted.map((d) => [
      d.label,
      formatDateJp(d.date),
      formatYen(saleOnly.filter((s) => s.dayId === d.id).reduce((s, x) => s + x.total, 0)),
    ]),
  };
}

function buildExpenseTable(expenses: ExpenseDoc[]) {
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  return {
    head: [['日付', 'カテゴリ', '内容', '金額', '担当者']],
    body: sorted.map((e) => [formatDateJp(e.date), e.category, e.description, formatYen(e.amount), e.staffName]),
  };
}

function buildSalesHistoryTable(days: EventDoc['days'], sales: SaleDoc[]) {
  const dayLabel = (dayId: string) => days.find((d) => d.id === dayId)?.label ?? '-';
  const sorted = [...sales].sort((a, b) => a.createdAt - b.createdAt);
  return {
    head: [['日時', '日程', '内容', '金額', '担当者', '状態']],
    body: sorted.map((s) => [
      formatDateTime(s.createdAt),
      dayLabel(s.dayId),
      s.items.map((i) => `${i.productName}×${i.quantity}`).join('、'),
      formatYen(s.total),
      s.staffName,
      s.isCancelled ? '取消' : s.isRefunded ? '返金' : s.kind === 'loss' ? 'ロス・試食' : '通常',
    ]),
  };
}

function buildStockTable(products: ProductDoc[]) {
  const sorted = [...products].sort((a, b) => a.order - b.order);
  return {
    head: [['商品名', '初期在庫', '現在在庫', '販売済み数']],
    body: sorted.map((p) => [p.name, `${p.initialStock}`, `${p.currentStock}`, `${p.initialStock - p.currentStock}`]),
  };
}

function addPageNumbers(doc: JsPdfType) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont(FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(`${i} / ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, { align: 'right' });
  }
}
