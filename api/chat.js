// Vercel 서버리스 함수: POST /api/chat
// 프론트가 보낸 messages + model 을 OpenAI 로 프록시한다.

const ALLOWED_MODELS = ['gpt-4.1', 'gpt-5.4'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 만 허용됩니다.' });
  }

  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: '환경변수 API_KEY 가 설정되지 않았습니다.' });
  }

  const { messages, model } = req.body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages 배열이 필요합니다.' });
  }

  // 허용된 모델만 사용, 그 외엔 기본값(env MODEL 또는 gpt-4o)
  const chosen = ALLOWED_MODELS.includes(model)
    ? model
    : process.env.MODEL || 'gpt-4.1';

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model: chosen, messages, temperature: 0.9 }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || 'OpenAI API 오류' });
    }

    res.status(200).json({ reply: data.choices?.[0]?.message?.content ?? '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
