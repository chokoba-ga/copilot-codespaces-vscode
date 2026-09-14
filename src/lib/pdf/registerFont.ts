import type jsPDF from 'jspdf';

let registered = false;

/**
 * jsPDF は標準でCJKフォントを持たないため、埋め込みフォントを登録する。
 *
 * 重要: jspdf-autotable は見出し行などでデフォルトで "bold" スタイルの
 * フォントを要求する。normal スタイルしか登録していないと、bold の
 * フォントが見つからずデフォルトフォント（日本語非対応）へ静かに
 * フォールバックし、その部分だけ文字化けする（実際に発生した不具合）。
 * これを防ぐため、同じ実体を normal / bold の両方に登録する
 * （見た目上の太字表現はできないが、文字化けよりずっと良い）。
 */
export async function registerJapaneseFont(doc: jsPDF): Promise<void> {
  const { notoSansJpBase64 } = await import('./notoSansJpBase64');
  doc.addFileToVFS('NotoSansJP-Regular.ttf', notoSansJpBase64);
  doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
  doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'bold');
  doc.setFont('NotoSansJP', 'normal');
  registered = true;
}

export function isFontRegistered(): boolean {
  return registered;
}
