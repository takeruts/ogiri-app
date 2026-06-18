// 診断結果カードの見た目プレビュー（レビュー用・アプリ本体とは別物）
// 実装した GameScreen の diagCard スタイルを SVG で再現して PNG 化する。
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const F = 'Meiryo';

// サンプル診断データ
const dev = 66, top = 12, dtype = '天才ひらめき型';
const axes = [['創造力', 5], ['毒舌力', 3], ['シュール力', 4], ['共感力', 3]];
const analysis = '予測不能度MAX';
const judge = { name: 'ラナ', tag: '天才系AI', color: '#A855F7' };
const comment = 'その発想、ちょっと悔しいくらい面白い。';
const hint = '王道から一歩ズラすと、さらに高得点を狙えます！';

const stars = (n) =>
  `<tspan fill="#FBBF24">${'★'.repeat(n)}</tspan><tspan fill="#3A3350">${'☆'.repeat(5 - n)}</tspan>`;

const W = 760, cardX = 40, cardW = 680, padX = cardX + 44;
let y = 110;
const axisRows = axes.map(([label, val], i) => {
  const ry = 470 + i * 46;
  return `<text x="${padX}" y="${ry}" font-family="${F}" font-size="22" fill="#B9AEDB" font-weight="600">${label}</text>
  <text x="${cardX + cardW - 44}" y="${ry}" font-family="${F}" font-size="28" text-anchor="end" letter-spacing="3">${stars(val)}</text>`;
}).join('\n');

const svg = `<svg width="${W}" height="1200" viewBox="0 0 ${W} 1200" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="1200" fill="#F8FAFB"/>
  <!-- glow -->
  <rect x="${cardX - 6}" y="60" width="${cardW + 12}" height="1080" rx="34" fill="#A855F7" opacity="0.18"/>
  <!-- card -->
  <rect x="${cardX}" y="66" width="${cardW}" height="1068" rx="28" fill="#181030" stroke="rgba(255,255,255,0.14)" stroke-width="1"/>

  <text x="${W / 2}" y="130" font-family="${F}" font-size="22" fill="#B9AEDB" font-weight="700" letter-spacing="6" text-anchor="middle">お笑い偏差値</text>
  <text x="${W / 2}" y="246" font-family="${F}" font-size="120" fill="#F472B6" font-weight="900" text-anchor="middle">${dev}</text>

  <rect x="${W / 2 - 110}" y="276" width="220" height="48" rx="24" fill="rgba(168,85,247,0.18)" stroke="#A855F7" stroke-width="1.5"/>
  <text x="${W / 2}" y="308" font-family="${F}" font-size="22" fill="#F5F3FF" font-weight="700" text-anchor="middle">全国上位 ${top}%</text>

  <text x="${W / 2}" y="372" font-family="${F}" font-size="22" fill="#B9AEDB" text-anchor="middle">あなたは</text>
  <text x="${W / 2}" y="424" font-family="${F}" font-size="44" fill="#F5F3FF" font-weight="900" text-anchor="middle">「${dtype}」</text>

  ${axisRows}

  <!-- wrapped card -->
  <rect x="${padX - 12}" y="680" width="${cardW - 64}" height="150" rx="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" stroke-width="1"/>
  <text x="${W / 2}" y="724" font-family="${F}" font-size="18" fill="#C4B5FD" font-weight="800" letter-spacing="4" text-anchor="middle">AI ANALYSIS</text>
  <text x="${W / 2}" y="766" font-family="${F}" font-size="30" fill="#F5F3FF" font-weight="800" text-anchor="middle">あなたの回答は</text>
  <text x="${W / 2}" y="806" font-family="${F}" font-size="30" fill="#F5F3FF" font-weight="800" text-anchor="middle">${analysis}</text>

  <!-- judge -->
  <circle cx="${padX + 22}" cy="912" r="30" fill="${judge.color}"/>
  <text x="${padX + 22}" y="924" font-family="${F}" font-size="30" fill="#fff" font-weight="900" text-anchor="middle">${judge.name.charAt(0)}</text>
  <rect x="${padX + 70}" y="876" width="${cardW - 64 - 70 - 30}" height="120" rx="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" stroke-width="1"/>
  <text x="${padX + 96}" y="912" font-family="${F}" font-size="20" fill="${judge.color}" font-weight="800">${judge.name}・${judge.tag}</text>
  <text x="${padX + 96}" y="950" font-family="${F}" font-size="22" fill="#F5F3FF">${comment}</text>

  <!-- hint -->
  <rect x="${padX - 12}" y="1020" width="${cardW - 64}" height="64" rx="14" fill="rgba(251,191,36,0.10)" stroke="rgba(251,191,36,0.25)" stroke-width="1"/>
  <text x="${padX + 14}" y="1060" font-family="${F}" font-size="21" fill="#FDE68A">💡 ${hint}</text>

  <!-- neon share button -->
  <rect x="${cardX}" y="1156" width="${cardW}" height="0" />
</svg>`;

const png = new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: F } }).render().asPng();
const out = path.resolve(__dirname, '..', 'preview-diag-card.png');
fs.writeFileSync(out, png);
console.log('wrote', out, png.length, 'bytes');
