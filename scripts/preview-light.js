// ライトテーマ（女性向け）の見た目プレビュー（レビュー用）
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const F = 'Meiryo';
const W = 760;
const card = (x, y, w, h, r, fill, stroke, sw) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ''}/>`;

// ヘッダーの可愛いふきだしロゴ（白ふきだし＋ピンク枠、文字は濃色＋ピンク）
function banner(x, y) {
  const cx = x + 30, cy = y, r = 26, e = r * 0.1;
  return `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" stroke="#D3A6AF" stroke-width="3"/>
  <circle cx="${cx - r * 0.34}" cy="${cy - r * 0.06}" r="${e}" fill="#6E4B57"/>
  <circle cx="${cx + r * 0.34}" cy="${cy - r * 0.06}" r="${e}" fill="#6E4B57"/>
  <path d="M ${cx - r * 0.3} ${cy + r * 0.1} Q ${cx} ${cy + r * 0.5} ${cx + r * 0.3} ${cy + r * 0.1}" stroke="#6E4B57" stroke-width="${r * 0.08}" fill="none" stroke-linecap="round"/>
  <text x="${x + 74}" y="${y}" font-family="${F}" font-size="30" font-weight="900" fill="#6E4B57" dominant-baseline="central">オオギリ<tspan fill="#B0798B">検定</tspan></text>`;
}

const svg = `<svg width="${W}" height="1180" viewBox="0 0 ${W} 1180" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="1180" fill="#F6F1EE"/>

  <!-- header -->
  <rect x="0" y="0" width="${W}" height="96" fill="#FFFFFF"/>
  <line x1="0" y1="96" x2="${W}" y2="96" stroke="rgba(74,64,63,0.10)" stroke-width="1"/>
  ${banner(280, 48)}

  <!-- 段位ダッシュボード -->
  ${card(40, 128, 680, 290, 24, '#FFFFFF', '#B8945F', 2)}
  <text x="${W / 2}" y="176" font-family="${F}" font-size="20" font-weight="700" fill="#8C6B3A" text-anchor="middle" letter-spacing="2">あなたの認定段位</text>
  <text x="${W / 2}" y="264" font-family="${F}" font-size="84" font-weight="900" fill="#8C6B3A" text-anchor="middle">二段</text>
  <text x="180" y="352" font-family="${F}" font-size="32" font-weight="900" fill="#47403E" text-anchor="middle">63</text>
  <text x="180" y="384" font-family="${F}" font-size="17" fill="#8A7E79" text-anchor="middle">偏差値</text>
  <text x="380" y="352" font-family="${F}" font-size="32" font-weight="900" fill="#47403E" text-anchor="middle">248位</text>
  <text x="380" y="384" font-family="${F}" font-size="17" fill="#8A7E79" text-anchor="middle">全国1284人中</text>
  <text x="580" y="352" font-family="${F}" font-size="32" font-weight="900" fill="#47403E" text-anchor="middle">12</text>
  <text x="580" y="384" font-family="${F}" font-size="17" fill="#8A7E79" text-anchor="middle">受験回数</text>

  <!-- カテゴリ（例） -->
  ${card(40, 446, 335, 150, 18, 'rgba(184,148,95,0.14)', '#B8945F', 2)}
  <text x="207" y="500" font-family="${F}" font-size="34" text-anchor="middle">📝</text>
  <text x="207" y="545" font-family="${F}" font-size="23" font-weight="800" fill="#47403E" text-anchor="middle">大喜利検定</text>
  <text x="207" y="574" font-family="${F}" font-size="15" fill="#8A7E79" text-anchor="middle">総合3問・段位認定</text>
  ${card(385, 446, 335, 150, 18, '#FFFFFF', 'rgba(74,64,63,0.10)', 1)}
  <text x="552" y="500" font-family="${F}" font-size="34" text-anchor="middle">📷</text>
  <text x="552" y="545" font-family="${F}" font-size="23" font-weight="800" fill="#47403E" text-anchor="middle">写真で一言</text>
  <text x="552" y="574" font-family="${F}" font-size="15" fill="#8A7E79" text-anchor="middle">画像にボケる</text>

  <!-- 受験ボタン -->
  ${card(120, 626, 520, 74, 37, '#B0798B', '', 0)}
  <text x="${W / 2}" y="672" font-family="${F}" font-size="25" font-weight="900" fill="#FFFFFF" text-anchor="middle">📝 検定を受験する（3問）</text>

  <!-- 認定証カード -->
  ${card(40, 736, 680, 400, 24, '#FFFFFF', '#B8945F', 2.5)}
  <text x="${W / 2}" y="788" font-family="${F}" font-size="19" font-weight="800" fill="#8C6B3A" text-anchor="middle" letter-spacing="5">OOGIRI CERTIFICATE</text>
  <text x="${W / 2}" y="830" font-family="${F}" font-size="18" fill="#8A7E79" text-anchor="middle">認定段位</text>
  <text x="${W / 2}" y="906" font-family="${F}" font-size="78" font-weight="900" fill="#8C6B3A" text-anchor="middle">二段</text>
  <line x1="150" y1="946" x2="610" y2="946" stroke="#B8945F" stroke-opacity="0.4" stroke-width="1"/>
  <text x="${W / 2}" y="990" font-family="${F}" font-size="18" fill="#8A7E79" text-anchor="middle">総合お笑い偏差値</text>
  <text x="${W / 2}" y="1068" font-family="${F}" font-size="80" font-weight="900" fill="#8F6274" text-anchor="middle">63</text>
  <text x="${W / 2}" y="1116" font-family="${F}" font-size="30" font-weight="900" fill="#47403E" text-anchor="middle">「天才ひらめき型」</text>
</svg>`;

const png = new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: F } }).render().asPng();
const out = path.resolve(__dirname, '..', 'preview-light.png');
fs.writeFileSync(out, png);
console.log('wrote', out, png.length, 'bytes');
