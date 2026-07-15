// オオギリ検定 ブランドロゴ／アイコン生成スクリプト
// 世界観: やわらかく可愛い（女性向け）。パステルのピーチ×ピンク＋にこちゃん＋キラキラ。
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..');
const FONT = 'Meiryo';

const C = {
  peach: '#E7D3C7', // くすみグレージュ〜ピーチ
  pink: '#D3A6AF', // くすみダスティローズ
  pinkSoft: '#E5CBD1',
  white: '#FFFFFF',
  face: '#6E4B57', // 目・口（くすみプラム）
  cheek: '#C98B9E',
  gold: '#C9A971', // くすみゴールド
  name: '#6E4B57',
  navy: '#0F172A',
  sub: '#8A7E79',
};

const defs = `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.peach}"/>
    <stop offset="1" stop-color="${C.pink}"/>
  </linearGradient>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#9D174D" flood-opacity="0.15"/>
  </filter>`;

// キラキラ（4ポイントの星）
function sparkle(cx, cy, s, color) {
  return `<path d="M ${cx} ${cy - s} Q ${cx + s * 0.2} ${cy - s * 0.2} ${cx + s} ${cy}
    Q ${cx + s * 0.2} ${cy + s * 0.2} ${cx} ${cy + s}
    Q ${cx - s * 0.2} ${cy + s * 0.2} ${cx - s} ${cy}
    Q ${cx - s * 0.2} ${cy - s * 0.2} ${cx} ${cy - s} Z" fill="${color}"/>`;
}

// ふきだし風の可愛いにこちゃん（大喜利＝しゃべる/笑うモチーフ）
function smiley(cx, cy, r) {
  const eR = r * 0.1;
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.white}" filter="url(#soft)"/>
    <path d="M ${cx - r * 0.28} ${cy + r * 0.86} L ${cx - r * 0.62} ${cy + r * 1.28} L ${cx - r * 0.02} ${cy + r * 0.98} Z" fill="${C.white}"/>
    <circle cx="${cx - r * 0.34}" cy="${cy - r * 0.06}" r="${eR}" fill="${C.face}"/>
    <circle cx="${cx + r * 0.34}" cy="${cy - r * 0.06}" r="${eR}" fill="${C.face}"/>
    <circle cx="${cx - r * 0.46}" cy="${cy + r * 0.2}" r="${r * 0.11}" fill="${C.cheek}" opacity="0.55"/>
    <circle cx="${cx + r * 0.46}" cy="${cy + r * 0.2}" r="${r * 0.11}" fill="${C.cheek}" opacity="0.55"/>
    <path d="M ${cx - r * 0.3} ${cy + r * 0.1} Q ${cx} ${cy + r * 0.52} ${cx + r * 0.3} ${cy + r * 0.1}"
      stroke="${C.face}" stroke-width="${r * 0.08}" fill="none" stroke-linecap="round"/>`;
}

function iconSVG() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <rect width="1024" height="1024" rx="240" fill="url(#bg)"/>
  ${sparkle(240, 250, 46, C.white)}
  ${sparkle(812, 300, 60, C.gold)}
  ${sparkle(792, 720, 38, C.white)}
  ${smiley(512, 430, 250)}
  <text x="512" y="812" font-family="${FONT}" font-weight="900" font-size="128" fill="${C.name}" text-anchor="middle" dominant-baseline="central" letter-spacing="2">オオギリ検定</text>
</svg>`;
}

// Android アダプティブ前景（透過・セーフエリア内）
function adaptiveSVG() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <circle cx="512" cy="512" r="330" fill="url(#bg)"/>
  ${sparkle(360, 300, 34, C.white)}
  ${sparkle(670, 340, 40, C.gold)}
  ${smiley(512, 500, 200)}
</svg>`;
}

// 横長ロゴ（明るいヘッダー用・透過。白ふきだしにピンク枠、文字は濃色＋ピンク）
function bannerSVG() {
  const cx = 150, cy = 140, r = 104, eR = r * 0.1;
  return `<svg width="1200" height="280" viewBox="0 0 1200 280" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.white}" stroke="${C.pink}" stroke-width="9"/>
  <circle cx="${cx - r * 0.34}" cy="${cy - r * 0.06}" r="${eR}" fill="${C.face}"/>
  <circle cx="${cx + r * 0.34}" cy="${cy - r * 0.06}" r="${eR}" fill="${C.face}"/>
  <circle cx="${cx - r * 0.46}" cy="${cy + r * 0.2}" r="${r * 0.11}" fill="${C.cheek}" opacity="0.55"/>
  <circle cx="${cx + r * 0.46}" cy="${cy + r * 0.2}" r="${r * 0.11}" fill="${C.cheek}" opacity="0.55"/>
  <path d="M ${cx - r * 0.3} ${cy + r * 0.1} Q ${cx} ${cy + r * 0.52} ${cx + r * 0.3} ${cy + r * 0.1}" stroke="${C.face}" stroke-width="${r * 0.08}" fill="none" stroke-linecap="round"/>
  ${sparkle(280, 60, 26, C.gold)}
  <text x="322" y="140" font-family="${FONT}" font-weight="900" font-size="122" fill="${C.name}" dominant-baseline="central">オオギリ<tspan fill="#B0798B">検定</tspan></text>
</svg>`;
}

// OGP / Twitter カード（1200x630・パステル背景）
function ogSVG() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${sparkle(120, 120, 34, C.white)}
  ${sparkle(1080, 130, 46, C.gold)}
  ${sparkle(1120, 520, 30, C.white)}
  ${smiley(250, 315, 175)}
  <text x="470" y="250" font-family="${FONT}" font-weight="900" font-size="92" fill="${C.name}">オオギリ検定</text>
  <text x="472" y="348" font-family="${FONT}" font-weight="700" font-size="40" fill="${C.face}">あなたのお笑いセンスを、AIが認定。</text>
  <text x="472" y="424" font-family="${FONT}" font-weight="400" font-size="30" fill="${C.sub}">偏差値・段位・タイプ診断　ログイン不要で今すぐ受験</text>
</svg>`;
}

// スプラッシュ（パステル背景・中央にロゴ）
function splashSVG() {
  return `<svg width="1242" height="1334" viewBox="0 0 1242 1334" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <rect width="1242" height="1334" fill="url(#bg)"/>
  ${sparkle(300, 430, 44, C.white)}
  ${sparkle(940, 470, 58, C.gold)}
  ${smiley(621, 560, 240)}
  <text x="621" y="900" font-family="${FONT}" font-weight="900" font-size="118" fill="${C.name}" text-anchor="middle" dominant-baseline="central" letter-spacing="2">オオギリ検定</text>
  <text x="621" y="980" font-family="${FONT}" font-weight="400" font-size="40" fill="${C.face}" text-anchor="middle" dominant-baseline="central">あなたのお笑いセンスを、AIが認定。</text>
</svg>`;
}

function render(svg, outPath, width) {
  const opts = {
    font: { loadSystemFonts: true, defaultFontFamily: FONT },
    background: 'rgba(0,0,0,0)',
  };
  if (width) opts.fitTo = { mode: 'width', value: width };
  const png = new Resvg(svg, opts).render().asPng();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, png);
  console.log('wrote', path.relative(ROOT, outPath), `(${png.length} bytes)`);
}

render(iconSVG(), path.join(ROOT, 'assets/icon.png'));
render(adaptiveSVG(), path.join(ROOT, 'assets/adaptive-icon.png'));
render(splashSVG(), path.join(ROOT, 'assets/splash.png'));
render(iconSVG(), path.join(ROOT, 'assets/logo.png'), 512);
render(iconSVG(), path.join(ROOT, 'public/logo.png'), 512);
render(ogSVG(), path.join(ROOT, 'public/og-image.png'));
render(bannerSVG(), path.join(ROOT, 'assets/logo-wide.png'));
render(bannerSVG(), path.join(ROOT, 'public/logo-wide.png'));
console.log('done');
