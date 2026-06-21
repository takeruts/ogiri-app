// オオギリ検定 ブランドロゴ／アイコン生成スクリプト
// 世界観: ダークネイビー × ゴールド（TOEIC/G検定のような「能力検定」トーン）。
// SVG を定義し @resvg/resvg-js で各サイズの PNG にラスタライズ。日本語は Meiryo。
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..');
const FONT = 'Meiryo';

const C = {
  navy1: '#1E293B', // 背景グラデ上
  navy2: '#0F172A', // 背景グラデ下
  gold: '#F59E0B',
  goldLight: '#FCD34D',
  white: '#F8FAFC',
  sub: '#94A3B8',
  purple: '#7C3AED',
};

const defs = `
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.navy1}"/>
    <stop offset="1" stop-color="${C.navy2}"/>
  </linearGradient>
  <linearGradient id="goldg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.goldLight}"/>
    <stop offset="1" stop-color="${C.gold}"/>
  </linearGradient>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="14" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;

// 認定シール（金リング＋オオギリ／検定／★★★）。座標は 1024 系。
function sealBody(withBg) {
  return `
    ${withBg ? `<rect width="1024" height="1024" rx="225" fill="url(#bg)"/>` : ''}
    <circle cx="512" cy="512" r="402" fill="none" stroke="url(#goldg)" stroke-width="14"/>
    <circle cx="512" cy="512" r="372" fill="none" stroke="${C.gold}" stroke-opacity="0.4" stroke-width="3"/>
    <text x="512" y="318" font-family="${FONT}" font-weight="700" font-size="112" fill="${C.white}" text-anchor="middle" dominant-baseline="central" letter-spacing="14">オオギリ</text>
    <text x="512" y="520" font-family="${FONT}" font-weight="900" font-size="240" fill="url(#goldg)" text-anchor="middle" dominant-baseline="central" filter="url(#glow)" letter-spacing="8">検定</text>
    <text x="512" y="712" font-family="${FONT}" font-weight="900" font-size="86" fill="${C.gold}" text-anchor="middle" dominant-baseline="central" letter-spacing="14">★★★</text>`;
}

function iconSVG() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  ${sealBody(true)}
</svg>`;
}

// Android アダプティブ前景（透過・セーフエリア内の円シール）
function adaptiveSVG() {
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <circle cx="512" cy="512" r="332" fill="url(#bg)" stroke="url(#goldg)" stroke-width="10"/>
  <text x="512" y="432" font-family="${FONT}" font-weight="700" font-size="72" fill="${C.white}" text-anchor="middle" dominant-baseline="central" letter-spacing="8">オオギリ</text>
  <text x="512" y="556" font-family="${FONT}" font-weight="900" font-size="150" fill="url(#goldg)" text-anchor="middle" dominant-baseline="central" filter="url(#glow)" letter-spacing="6">検定</text>
  <text x="512" y="650" font-family="${FONT}" font-weight="900" font-size="48" fill="${C.gold}" text-anchor="middle" dominant-baseline="central" letter-spacing="8">★★★</text>
</svg>`;
}

function sealGroup(tx, ty, scale) {
  return `<g transform="translate(${tx},${ty}) scale(${scale})">${sealBody(true)}</g>`;
}

// OGP / Twitter カード（1200x630）
function ogSVG() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  ${sealGroup(86, 151, 0.32)}
  <text x="455" y="232" font-family="${FONT}" font-weight="900" font-size="84" fill="${C.white}">オオギリ検定</text>
  <text x="457" y="328" font-family="${FONT}" font-weight="700" font-size="38" fill="${C.goldLight}">AIがあなたの発想力を測定し、段位を認定。</text>
  <text x="457" y="404" font-family="${FONT}" font-weight="400" font-size="30" fill="${C.sub}">受験 → 採点 → 認定 → 昇段</text>
  <text x="457" y="462" font-family="${FONT}" font-weight="400" font-size="28" fill="${C.sub}">偏差値・全国ランキング・ログイン不要で今すぐ受験</text>
</svg>`;
}

// スプラッシュ（ネイビー背景・中央にシール＋ブランド名）
function splashSVG() {
  return `<svg width="1242" height="1334" viewBox="0 0 1242 1334" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <rect width="1242" height="1334" fill="${C.navy2}"/>
  ${sealGroup(341, 250, 0.547)}
  <text x="621" y="980" font-family="${FONT}" font-weight="900" font-size="92" fill="${C.white}" text-anchor="middle" dominant-baseline="central">オオギリ検定</text>
  <text x="621" y="1060" font-family="${FONT}" font-weight="400" font-size="38" fill="${C.goldLight}" text-anchor="middle" dominant-baseline="central">AIがあなたの発想力を段位で認定。</text>
</svg>`;
}

// 横長ロゴ（ヘッダー／スタート画面でタイトル代わりに使う・透過）
function bannerSVG() {
  return `<svg width="1200" height="280" viewBox="0 0 1200 280" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <g transform="translate(150,140)">
    <circle r="118" fill="none" stroke="url(#goldg)" stroke-width="11"/>
    <circle r="98" fill="none" stroke="${C.gold}" stroke-opacity="0.45" stroke-width="3"/>
    <text x="0" y="6" font-family="${FONT}" font-weight="900" font-size="120" fill="url(#goldg)" text-anchor="middle" dominant-baseline="central" filter="url(#glow)">★</text>
  </g>
  <text x="320" y="140" font-family="${FONT}" font-weight="900" font-size="120" fill="${C.white}" dominant-baseline="central">オオギリ<tspan fill="${C.goldLight}">検定</tspan></text>
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
