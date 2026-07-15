// Vercel サーバーレス関数：Gemini 採点のプロキシ
// APIキーはサーバー専用の環境変数 GEMINI_API_KEY に置き、クライアントには露出しない。
// クライアント（/src/services/geminiService.ts）は /api/gemini に {contents, generationConfig} をPOSTする。
const MODEL = 'gemini-3.5-flash';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  // 簡易オリジン制限（キー流出はしないが、プロキシの無断利用を軽減）
  const origin = req.headers.origin || '';
  if (origin) {
    let host = '';
    try {
      host = new URL(origin).hostname;
    } catch (e) {
      host = '';
    }
    const ok = host.endsWith('ogirihub.com') || host.endsWith('vercel.app') || host === 'localhost';
    if (!ok) {
      res.status(403).json({ error: { message: 'Forbidden origin' } });
      return;
    }
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(500).json({ error: { message: 'GEMINI_API_KEY is not configured on the server' } });
    return;
  }

  // req.body は Vercel が JSON をパース済み。念のため文字列も許容。
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  const contents = body.contents;
  if (!contents) {
    res.status(400).json({ error: { message: 'contents is required' } });
    return;
  }

  // 生成設定はサーバー側で上限を制限（プロキシ悪用の抑制）
  const gc = body.generationConfig || {};
  const generationConfig = {
    temperature: typeof gc.temperature === 'number' ? gc.temperature : 0.7,
    maxOutputTokens: Math.min(Number(gc.maxOutputTokens) || 1000, 1200),
    thinkingConfig: gc.thinkingConfig || { thinkingLevel: 'minimal' },
  };

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig }),
      }
    );
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: { message: 'Upstream request failed' } });
  }
};
