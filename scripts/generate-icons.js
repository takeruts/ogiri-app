// お笑い偏差値診断 ブランドロゴ／アイコン生成スクリプト
// SVG をその場で定義し、@resvg/resvg-js で各サイズの PNG にラスタライズする。
// 世界観: ダーク × 紫→ピンクのネオン／ガラスモーフィズム。日本語は Meiryo で描画。
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..');
const FONT = 'Meiryo';

// ブランドカラー
const C = {
  d1: '#2A1A4A', // 背景グラデ上（ダークパープル）
  d2: '#0E0A1F', // 背景グラデ下（ほぼ黒紫）
  white: '#F5F3FF',
  pink: '#F472B6',
  pinkDeep: '#EC4899',
  purple: '#A855F7',
  sub: '#C4B5FD',
};

const defs = `
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.d1}"/>
    <stop offset="1" stop-color="${C.d2}"/>
  </linearGradient>
  <linearGradient id="pill" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.purple}"/>
    <stop offset="1" stop-color="${C.pinkDeep}"/>
  </linearGradient>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="16" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;

// 正方形バッジ本体（座標は 1024 系）。透過・背景込みの2バージョンを作る。
function badgeBody(withBg) {
  return `
    ${withBg ? `<rect width="1024" height="1024" rx="225" fill="url(#bg)"/>` : ''}
    <circle cx="512" cy="512" r="392" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="10"/>
    <text x="512" y="300" font-family="${FONT}" font-weight="700" font-size="116" fill="${C.white}" text-anchor="middle" dominant-baseline="central" letter-spacing="10">お笑い</text>
    <text x="512" y="522" font-family="${FONT}" font-weight="900" font-size="208" fill="${C.pink}" text-anchor="middle" dominant-baseline="central" filter="url(#glow)">偏差値</text>
    <rect x="252" y="690" width="520" height="158" rx="79" fill="url(#pill)" filter="url(#glow)"/>
    <text x="512" y="769" font-family="${FONT}" font-weight="900" font-size="118" fill="#ffffff" text-anchor="middle" dominant-baseline="central" letter-spacing="14">診断</text>`;
}

function iconSVG() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  ${badgeBody(true)}
</svg>`;
}

// Android アダプティブ前景（透過・セーフエリア内の円バッジ）
function adaptiveSVG() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <circle cx="512" cy="512" r="334" fill="url(#bg)"/>
  <text x="512" y="430" font-family="${FONT}" font-weight="700" font-size="74" fill="${C.white}" text-anchor="middle" dominant-baseline="central" letter-spacing="6">お笑い</text>
  <text x="512" y="520" font-family="${FONT}" font-weight="900" font-size="132" fill="${C.pink}" text-anchor="middle" dominant-baseline="central" filter="url(#glow)">偏差値</text>
  <rect x="386" y="600" width="252" height="92" rx="46" fill="url(#pill)"/>
  <text x="512" y="647" font-family="${FONT}" font-weight="900" font-size="64" fill="#ffffff" text-anchor="middle" dominant-baseline="central" letter-spacing="8">診断</text>
</svg>`;
}

// 縮小バッジ配置用
function badgeGroup(tx, ty, scale) {
  return `<g transform="translate(${tx},${ty}) scale(${scale})">${badgeBody(true)}</g>`;
}

// OGP / Twitter カード（1200x630）
function ogSVG() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${badgeGroup(86, 151, 0.32)}
  <text x="455" y="232" font-family="${FONT}" font-weight="900" font-size="84" fill="${C.white}">お笑い偏差値診断</text>
  <text x="457" y="330" font-family="${FONT}" font-weight="700" font-size="40" fill="${C.pink}">あなたの笑いの才能、AIが本気で診断。</text>
  <text x="457" y="408" font-family="${FONT}" font-weight="400" font-size="30" fill="${C.sub}">3分でわかる、お笑い偏差値。タイプ診断＆SNSシェア</text>
  <text x="457" y="466" font-family="${FONT}" font-weight="400" font-size="28" fill="${C.sub}">ログイン不要・無料で今すぐ診断</text>
</svg>`;
}

// スプラッシュ（ダーク背景・中央にバッジ＋ブランド名）
function splashSVG() {
  return `<svg width="1242" height="1334" viewBox="0 0 1242 1334" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <rect width="1242" height="1334" fill="${C.d2}"/>
  ${badgeGroup(341, 250, 0.547)}
  <text x="621" y="980" font-family="${FONT}" font-weight="900" font-size="92" fill="${C.white}" text-anchor="middle" dominant-baseline="central">お笑い偏差値診断</text>
  <text x="621" y="1060" font-family="${FONT}" font-weight="400" font-size="38" fill="${C.sub}" text-anchor="middle" dominant-baseline="central">あなたの笑いの才能、AIが本気で診断。</text>
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
