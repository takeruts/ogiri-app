// シェア画像（1080x1920）のレイアウト確認用プレビュー（resvgでSVG→PNG）
// src/utils/shareImage.ts の座標を反映。アプリ本体はブラウザのCanvasで生成。
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const F = 'Meiryo';
const W = 1080, H = 1920, cx = W / 2;

const d = {
  deviation: 66, topPercent: 12, type: '天才ひらめき型',
  axes: [['創造力', 5], ['毒舌力', 3], ['シュール力', 4], ['共感力', 3]],
  analysis: '予測不能度MAX',
  topic: 'バスケットボールで一番カッコ悪いプレーとは？',
  answer: '味方にパスしようとして観客席に投げ込む',
};

const stars = (n) => `<tspan fill="#FBBF24">${'★'.repeat(n)}</tspan><tspan fill="#3A3350">${'☆'.repeat(5 - n)}</tspan>`;
const axisRows = d.axes.map(([label, val], i) => {
  const ay = 1290 + i * 64;
  return `<text x="200" y="${ay}" font-family="${F}" font-size="34" font-weight="bold" fill="#B9AEDB">${label}</text>
  <text x="880" y="${ay}" font-family="${F}" font-size="40" text-anchor="end">${stars(val)}</text>`;
}).join('\n');

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1A4A"/><stop offset="1" stop-color="#0E0A1F"/></linearGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="22" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="${cx}" y="130" font-family="${F}" font-size="44" font-weight="bold" fill="#F472B6" text-anchor="middle">お笑い偏差値診断</text>

  <rect x="80" y="190" width="${W - 160}" height="230" rx="28" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
  <text x="${cx}" y="240" font-family="${F}" font-size="28" font-weight="bold" fill="#B9AEDB" text-anchor="middle">お題</text>
  <text x="${cx}" y="296" font-family="${F}" font-size="38" font-weight="bold" fill="#F5F3FF" text-anchor="middle">${d.topic}</text>
  <text x="${cx}" y="392" font-family="${F}" font-size="26" font-weight="bold" fill="#C4B5FD" text-anchor="middle">あなたの回答</text>
  <text x="${cx}" y="480" font-family="${F}" font-size="46" font-weight="bold" fill="#F5F3FF" text-anchor="middle">${d.answer}</text>

  <text x="${cx}" y="700" font-family="${F}" font-size="36" font-weight="bold" fill="#B9AEDB" text-anchor="middle">お笑い偏差値</text>
  <text x="${cx}" y="920" font-family="${F}" font-size="240" font-weight="900" fill="#F472B6" text-anchor="middle" filter="url(#glow)">${d.deviation}</text>

  <rect x="${cx - 170}" y="968" width="340" height="70" rx="35" fill="rgba(168,85,247,0.22)" stroke="#A855F7" stroke-width="2"/>
  <text x="${cx}" y="1014" font-family="${F}" font-size="34" font-weight="bold" fill="#F5F3FF" text-anchor="middle">全国上位 ${d.topPercent}%</text>

  <text x="${cx}" y="1110" font-family="${F}" font-size="28" fill="#B9AEDB" text-anchor="middle">あなたは</text>
  <text x="${cx}" y="1186" font-family="${F}" font-size="60" font-weight="900" fill="#F5F3FF" text-anchor="middle">「${d.type}」</text>

  ${axisRows}

  <rect x="80" y="1580" width="${W - 160}" height="180" rx="24" fill="rgba(255,255,255,0.06)"/>
  <text x="${cx}" y="1640" font-family="${F}" font-size="26" font-weight="bold" fill="#C4B5FD" text-anchor="middle">AI ANALYSIS</text>
  <text x="${cx}" y="1710" font-family="${F}" font-size="50" font-weight="bold" fill="#F5F3FF" text-anchor="middle">あなたの回答は ${d.analysis}</text>

  <text x="${cx}" y="1850" font-family="${F}" font-size="28" fill="#8B7FB0" text-anchor="middle">#お笑い偏差値診断  ogirihub.com</text>
</svg>`;

const png = new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: F } }).render().asPng();
const out = path.resolve(__dirname, '..', 'preview-share.png');
fs.writeFileSync(out, png);
console.log('wrote', out, png.length, 'bytes');
