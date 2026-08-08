import type jsPDF from 'jspdf';

let registered = false;

/**
 * jsPDF は標準でCJKフォントを持たないため、埋め込みフォントを登録する。
 * base64データは重い（約4.8MB）ため、PDF生成時のみ動的importして
 * 通常のアプリ起動バンドルサイズに影響しないようにしている。
 */
export async function registerJapaneseFont(doc: jsPDF): Promise<void> {
  const { notoSansJpBase64 } = await import('./notoSansJpBase64');
  if (!registered) {
    doc.addFileToVFS('NotoSansJP-Regular.ttf', notoSansJpBase64);
    doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
    registered = true;
  } else {
    // 2回目以降のPDF生成でも新しいjsPDFインスタンスにはVFS登録が必要
    doc.addFileToVFS('NotoSansJP-Regular.ttf', notoSansJpBase64);
    doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
  }
  doc.setFont('NotoSansJP', 'normal');
}
