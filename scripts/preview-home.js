// ホーム（今日の検定＋4カテゴリ）の見た目プレビュー（レビュー用）
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const F = 'Meiryo';
const W = 760;
const card = (x, y, w, h, fill, stroke, sw) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const cat = (x, y, emoji, title, sub, primary) => `
  ${card(x, y, 322, 150, primary ? 'rgba(245,158,11,0.16)' : '#111827', primary ? '#F59E0B' : 'rgba(255,255,255,0.12)', primary ? 2 : 1)}
  <text x="${x+161}" y="${y+50}" font-family="${F}" font-size="40" text-anchor="middle">${emoji}</text>
  <text x="${x+161}" y="${y+95}" font-family="${F}" font-size="24" font-weight="800" fill="#F8FAFC" text-anchor="middle">${title}</text>
  <text x="${x+161}" y="${y+126}" font-family="${F}" font-size="16" fill="#94A3B8" text-anchor="middle">${sub}</text>`;

const svg = `<svg width="${W}" height="980" viewBox="0 0 ${W} 980" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="980" fill="#0F172A"/>
  <text x="${W/2}" y="56" font-family="${F}" font-size="32" font-weight="900" fill="#F8FAFC" text-anchor="middle">オオギリ検定</text>

  <!-- 今日の検定 -->
  ${card(40, 86, 680, 150, '#111827', 'rgba(255,255,255,0.12)', 1)}
  <text x="66" y="124" font-family="${F}" font-size="20" font-weight="800" fill="#FCD34D">📅 本日の検定</text>
  <text x="694" y="124" font-family="${F}" font-size="17" fill="#94A3B8" text-anchor="end">受験者 1,284人</text>
  <text x="66" y="166" font-family="${F}" font-size="24" font-weight="700" fill="#F8FAFC">バスケットボールで一番カッコ悪いプレーとは？</text>
  <text x="694" y="212" font-family="${F}" font-size="16" font-weight="700" fill="#8B5CF6" text-anchor="end">タップして受験 →</text>

  <text x="40" y="285" font-family="${F}" font-size="18" font-weight="800" fill="#94A3B8" letter-spacing="1">検定カテゴリ</text>
  ${cat(40, 305, '📝', '文章大喜利検定', '総合3問・段位認定', true)}
  ${cat(398, 305, '⚡', '瞬発力検定', '制限時間60秒・1問', false)}
  ${cat(40, 475, '💡', '発想力検定', '1問・じっくり', false)}
  ${cat(398, 475, '📷', '写真で一言検定', '画像にボケる', false)}

  <!-- 瞬発力タイマー例 -->
  ${card(40, 660, 680, 80, 'rgba(251,113,133,0.12)', '#FB7185', 1)}
  <text x="66" y="708" font-family="${F}" font-size="20" font-weight="700" fill="#94A3B8">⚡ 瞬発力検定・制限時間</text>
  <text x="694" y="712" font-family="${F}" font-size="34" font-weight="900" fill="#FB7185" text-anchor="end">8秒</text>

  <!-- 受験ボタン -->
  ${card(120, 780, 520, 76, '#7C3AED', '#7C3AED', 0)}
  <text x="${W/2}" y="828" font-family="${F}" font-size="26" font-weight="900" fill="#fff" text-anchor="middle">📝 検定を受験する（3問）</text>
</svg>`;

const png = new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: F } }).render().asPng();
const out = path.resolve(__dirname, '..', 'preview-home.png');
fs.writeFileSync(out, png);
console.log('wrote', out, png.length, 'bytes');
