// 診断結果の縦長シェア画像（Instagramストーリー/TikTok比率 1080x1920）を
// Web Canvas で生成する。Web Share API（files対応）があれば共有、無ければダウンロード。
import { Platform } from 'react-native';

export interface ShareAxis {
  label: string;
  value: number; // 1-5
}

export interface ShareImageData {
  deviation: number;
  topPercent: number;
  type: string;
  axes: ShareAxis[];
  analysis: string;
  topic: string;
  answer: string;
  // 総合診断など、ラベルを差し替えたい場合に指定（任意）
  topicLabel?: string;
  answerLabel?: string;
  analysisTitle?: string;
  analysisPrefix?: string;
}

const FONT = '"Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif';

// テキストを最大幅で折り返して行配列にする
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  // はみ出した場合は末尾を…に
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + '…').width > maxWidth && last.length > 1) last = last.slice(0, -1);
    if (text.length > lines.join('').length) lines[maxLines - 1] = last + '…';
  }
  return lines;
}

export async function generateResultImage(d: ShareImageData): Promise<Blob | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;

  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 背景グラデーション
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2A1A4A');
  bg.addColorStop(1, '#0E0A1F');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  ctx.textAlign = 'center';

  // ブランド
  ctx.fillStyle = '#F472B6';
  ctx.font = `bold 44px ${FONT}`;
  ctx.fillText('お笑い偏差値診断', cx, 130);

  // お題カード
  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(80, 190, W - 160, 230, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  roundRect(80, 190, W - 160, 230, 28);
  ctx.stroke();

  ctx.fillStyle = '#B9AEDB';
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillText(d.topicLabel || 'お題', cx, 240);
  ctx.fillStyle = '#F5F3FF';
  ctx.font = `bold 38px ${FONT}`;
  wrapLines(ctx, d.topic, W - 240, 2).forEach((l, i) => ctx.fillText(l, cx, 296 + i * 50));

  ctx.fillStyle = '#C4B5FD';
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillText(d.answerLabel || 'あなたの回答', cx, 392);

  // 回答（大きく）
  ctx.fillStyle = '#F5F3FF';
  ctx.font = `bold 46px ${FONT}`;
  wrapLines(ctx, d.answer, W - 200, 2).forEach((l, i) => ctx.fillText(l, cx, 480 + i * 58));

  // お笑い偏差値
  ctx.fillStyle = '#B9AEDB';
  ctx.font = `bold 36px ${FONT}`;
  ctx.fillText('お笑い偏差値', cx, 700);

  ctx.save();
  ctx.shadowColor = '#EC4899';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#F472B6';
  ctx.font = `900 240px ${FONT}`;
  ctx.fillText(String(d.deviation), cx, 920);
  ctx.restore();

  // 全国上位ピル
  ctx.font = `bold 34px ${FONT}`;
  const pillText = `全国上位 ${d.topPercent}%`;
  const pillW = ctx.measureText(pillText).width + 80;
  ctx.fillStyle = 'rgba(168,85,247,0.22)';
  roundRect(cx - pillW / 2, 968, pillW, 70, 35);
  ctx.fill();
  ctx.strokeStyle = '#A855F7';
  ctx.lineWidth = 2;
  roundRect(cx - pillW / 2, 968, pillW, 70, 35);
  ctx.stroke();
  ctx.fillStyle = '#F5F3FF';
  ctx.fillText(pillText, cx, 1014);

  // タイプ
  ctx.fillStyle = '#B9AEDB';
  ctx.font = `28px ${FONT}`;
  ctx.fillText('あなたは', cx, 1110);
  ctx.fillStyle = '#F5F3FF';
  ctx.font = `900 60px ${FONT}`;
  ctx.fillText(`「${d.type}」`, cx, 1186);

  // 4軸スター
  const axisX = 200, axisRight = W - 200;
  let ay = 1290;
  ctx.font = `bold 34px ${FONT}`;
  d.axes.forEach((a) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#B9AEDB';
    ctx.fillText(a.label, axisX, ay);
    ctx.textAlign = 'right';
    const on = '★'.repeat(a.value);
    const off = '☆'.repeat(5 - a.value);
    ctx.font = `40px ${FONT}`;
    const offW = ctx.measureText(off).width;
    ctx.fillStyle = '#3A3350';
    ctx.fillText(off, axisRight, ay);
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(on, axisRight - offW, ay);
    ctx.font = `bold 34px ${FONT}`;
    ay += 64;
  });
  ctx.textAlign = 'center';

  // AI分析
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(80, 1580, W - 160, 180, 24);
  ctx.fill();
  ctx.fillStyle = '#C4B5FD';
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillText(d.analysisTitle || 'AI ANALYSIS', cx, 1640);
  ctx.fillStyle = '#F5F3FF';
  ctx.font = `bold 50px ${FONT}`;
  const prefix = d.analysisPrefix ?? 'あなたの回答は';
  ctx.fillText(prefix ? `${prefix} ${d.analysis}` : d.analysis, cx, 1710);

  // フッター
  ctx.fillStyle = '#8B7FB0';
  ctx.font = `28px ${FONT}`;
  ctx.fillText('#お笑い偏差値診断  ogirihub.com', cx, 1850);

  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

// 生成したBlobを共有（対応端末）またはダウンロード
export async function shareOrDownloadImage(blob: Blob, filename: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const nav: any = typeof navigator !== 'undefined' ? navigator : {};
  try {
    const file = new File([blob], filename, { type: 'image/png' });
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], title: 'お笑い偏差値診断', text: 'お笑い偏差値を診断したよ！ #お笑い偏差値診断' });
      return 'shared';
    }
  } catch (e) {
    // 共有キャンセル等はダウンロードにフォールバックしない
    return 'cancelled';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
