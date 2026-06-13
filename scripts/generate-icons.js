// 大喜利AI検定 ブランドロゴ／アイコン生成スクリプト
// SVG をその場で定義し、@resvg/resvg-js で各サイズの PNG にラスタライズする。
// 日本語は Windows 標準フォント（Meiryo）をシステムフォントとして読み込んで描画。
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..');
const FONT = 'Meiryo';

// ブランドカラー（テーマの #007AFF 系）
const C = { top: '#4DA6FF', bottom: '#0057D8', accent: '#FFD63A', white: '#ffffff' };

// 正方形バッジ（icon / favicon 用）
function iconSVG() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.top}"/>
      <stop offset="1" stop-color="${C.bottom}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="225" fill="url(#bg)"/>
  <circle cx="512" cy="512" r="392" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-width="10"/>
  <text x="512" y="372" font-family="${FONT}" font-weight="700" font-size="270" fill="${C.white}" text-anchor="middle" dominant-baseline="central">大喜利</text>
  <text x="512" y="556" font-family="${FONT}" font-weight="700" font-size="120" fill="${C.accent}" text-anchor="middle" dominant-baseline="central" letter-spacing="8">AI</text>
  <rect x="247" y="636" width="530" height="180" rx="90" fill="${C.white}"/>
  <text x="512" y="726" font-family="${FONT}" font-weight="700" font-size="130" fill="${C.bottom}" text-anchor="middle" dominant-baseline="central" letter-spacing="10">検定</text>
</svg>`;
}

// Android アダプティブアイコン前景（透過・セーフエリア内に収める円バッジ）
function adaptiveSVG() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.top}"/>
      <stop offset="1" stop-color="${C.bottom}"/>
    </linearGradient>
  </defs>
  <circle cx="512" cy="512" r="330" fill="url(#bg)"/>
  <text x="512" y="436" font-family="${FONT}" font-weight="700" font-size="150" fill="${C.white}" text-anchor="middle" dominant-baseline="central">大喜利</text>
  <rect x="347" y="520" width="330" height="112" rx="56" fill="${C.white}"/>
  <text x="512" y="576" font-family="${FONT}" font-weight="700" font-size="74" fill="${C.bottom}" text-anchor="middle" dominant-baseline="central" letter-spacing="4">AI検定</text>
</svg>`;
}

// 左に正方形バッジを縮小配置するための共通パーツ
function badgeGroup(tx, ty, scale) {
  return `<g transform="translate(${tx},${ty}) scale(${scale})">
    <rect width="1024" height="1024" rx="225" fill="url(#bg)"/>
    <circle cx="512" cy="512" r="392" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-width="10"/>
    <text x="512" y="372" font-family="${FONT}" font-weight="700" font-size="270" fill="${C.white}" text-anchor="middle" dominant-baseline="central">大喜利</text>
    <text x="512" y="556" font-family="${FONT}" font-weight="700" font-size="120" fill="${C.accent}" text-anchor="middle" dominant-baseline="central" letter-spacing="8">AI</text>
    <rect x="247" y="636" width="530" height="180" rx="90" fill="${C.white}"/>
    <text x="512" y="726" font-family="${FONT}" font-weight="700" font-size="130" fill="${C.bottom}" text-anchor="middle" dominant-baseline="central" letter-spacing="10">検定</text>
  </g>`;
}

// OGP / Twitter カード（1200x630）
function ogSVG() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.top}"/>
      <stop offset="1" stop-color="${C.bottom}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${badgeGroup(80, 151, 0.32)}
  <text x="455" y="244" font-family="${FONT}" font-weight="700" font-size="100" fill="${C.white}" dominant-baseline="central">大喜利AI検定</text>
  <text x="457" y="344" font-family="${FONT}" font-weight="700" font-size="42" fill="#EAF3FF" dominant-baseline="central">AIがあなたの大喜利を採点・判定！</text>
  <text x="457" y="422" font-family="${FONT}" font-weight="400" font-size="28" fill="#CFE2FF" dominant-baseline="central">意外性・笑い・関連性・表現力の4観点でAI採点</text>
  <text x="457" y="478" font-family="${FONT}" font-weight="400" font-size="28" fill="#CFE2FF" dominant-baseline="central">ログイン不要・無料で今すぐ挑戦</text>
</svg>`;
}

// スプラッシュ（白背景・中央にバッジ＋ブランド名）
function splashSVG() {
  return `<svg width="1242" height="1334" viewBox="0 0 1242 1334" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.top}"/>
      <stop offset="1" stop-color="${C.bottom}"/>
    </linearGradient>
  </defs>
  <rect width="1242" height="1334" fill="#ffffff"/>
  ${badgeGroup(341, 250, 0.547)}
  <text x="621" y="980" font-family="${FONT}" font-weight="700" font-size="96" fill="${C.bottom}" text-anchor="middle" dominant-baseline="central">大喜利AI検定</text>
  <text x="621" y="1062" font-family="${FONT}" font-weight="400" font-size="40" fill="#5B6B7B" text-anchor="middle" dominant-baseline="central">AIがあなたの大喜利を採点・判定！</text>
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
console.log('done');
