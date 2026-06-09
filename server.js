// 로컬 개발용 서버 (npm start). 프로덕션은 Vercel 의 api/chat.js 가 처리한다.
import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;
const ALLOWED_MODELS = ['gpt-4o', 'gpt-5.5'];

app.post('/api/chat', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: '.env 에 API_KEY 가 설정되지 않았습니다.' });
  }

  const { messages, model } = req.body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages 배열이 필요합니다.' });
  }

  const chosen = ALLOWED_MODELS.includes(model)
    ? model
    : process.env.MODEL || 'gpt-4o';

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

    res.json({ reply: data.choices?.[0]?.message?.content ?? '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ 로컬 서버 → http://localhost:${PORT}\n`);
});
