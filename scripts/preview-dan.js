// 段位ダッシュボード＋認定証カードの見た目プレビュー（レビュー用）
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const F = 'Meiryo';
const W = 760;

const svg = `<svg width="${W}" height="1180" viewBox="0 0 ${W} 1180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E293B"/><stop offset="1" stop-color="#0F172A"/></linearGradient>
    <filter id="g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${W}" height="1180" fill="url(#bg)"/>

  <!-- 段位ダッシュボード -->
  <text x="${W/2}" y="70" font-family="${F}" font-size="34" font-weight="900" fill="#F8FAFC" text-anchor="middle">オオギリ検定</text>
  <rect x="50" y="110" width="660" height="300" rx="24" fill="#111827" stroke="#F59E0B" stroke-width="2"/>
  <text x="${W/2}" y="158" font-family="${F}" font-size="22" font-weight="700" fill="#FCD34D" text-anchor="middle" letter-spacing="3">あなたの認定段位</text>
  <text x="${W/2}" y="252" font-family="${F}" font-size="86" font-weight="900" fill="#FCD34D" text-anchor="middle" filter="url(#g)">二段</text>
  <text x="180" y="345" font-family="${F}" font-size="34" font-weight="900" fill="#F8FAFC" text-anchor="middle">63</text>
  <text x="180" y="378" font-family="${F}" font-size="18" fill="#94A3B8" text-anchor="middle">偏差値</text>
  <text x="380" y="345" font-family="${F}" font-size="34" font-weight="900" fill="#F8FAFC" text-anchor="middle">248位</text>
  <text x="380" y="378" font-family="${F}" font-size="18" fill="#94A3B8" text-anchor="middle">全国1284人中</text>
  <text x="580" y="345" font-family="${F}" font-size="34" font-weight="900" fill="#F8FAFC" text-anchor="middle">12</text>
  <text x="580" y="378" font-family="${F}" font-size="18" fill="#94A3B8" text-anchor="middle">受験回数</text>

  <rect x="120" y="445" width="520" height="76" rx="38" fill="#7C3AED"/>
  <text x="${W/2}" y="493" font-family="${F}" font-size="28" font-weight="900" fill="#fff" text-anchor="middle">📝 検定を受験する（3問）</text>

  <!-- 認定証カード -->
  <rect x="50" y="570" width="660" height="560" rx="24" fill="#111827" stroke="#F59E0B" stroke-width="2.5"/>
  <text x="${W/2}" y="628" font-family="${F}" font-size="20" font-weight="800" fill="#FCD34D" text-anchor="middle" letter-spacing="6">OOGIRI CERTIFICATE</text>
  <text x="${W/2}" y="672" font-family="${F}" font-size="20" fill="#94A3B8" text-anchor="middle" letter-spacing="2">認定段位</text>
  <text x="${W/2}" y="760" font-family="${F}" font-size="92" font-weight="900" fill="#FCD34D" text-anchor="middle" filter="url(#g)">二段</text>
  <line x1="150" y1="800" x2="610" y2="800" stroke="#F59E0B" stroke-opacity="0.4" stroke-width="1"/>
  <text x="${W/2}" y="848" font-family="${F}" font-size="20" fill="#94A3B8" text-anchor="middle">総合お笑い偏差値</text>
  <text x="${W/2}" y="940" font-family="${F}" font-size="96" font-weight="900" fill="#FCD34D" text-anchor="middle" filter="url(#g)">63</text>
  <rect x="290" y="965" width="180" height="46" rx="23" fill="rgba(124,58,237,0.22)" stroke="#7C3AED"/>
  <text x="${W/2}" y="996" font-family="${F}" font-size="20" fill="#F8FAFC" text-anchor="middle">全国上位 18%</text>
  <text x="${W/2}" y="1058" font-family="${F}" font-size="20" fill="#94A3B8" text-anchor="middle">あなたのお笑いタイプは</text>
  <text x="${W/2}" y="1102" font-family="${F}" font-size="38" font-weight="900" fill="#F8FAFC" text-anchor="middle">「天才ひらめき型」</text>
</svg>`;

const png = new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: F } }).render().asPng();
const out = path.resolve(__dirname, '..', 'preview-dan.png');
fs.writeFileSync(out, png);
console.log('wrote', out, png.length, 'bytes');
