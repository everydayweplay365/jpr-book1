// Vercel Serverless Function — TypeCast TTS Proxy
// 解決瀏覽器 CORS 問題，API Key 安全存在伺服器端

export default async function handler(req, res) {
  // 允許跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.TYPECAST_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { text, emotion, tempo } = req.body;

    const response = await fetch('https://api.typecast.ai/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({
        voice_id: 'tc_67d3b089782cabcc61569530', // Ella
        text: text,
        model: 'ssfm-v30',
        language: 'eng',
        prompt: {
          emotion_type: 'preset',
          emotion_preset: emotion || 'happy',
          emotion_intensity: 1.2
        },
        output: {
          audio_format: 'mp3',
          audio_tempo: tempo || 0.85,
          volume: 100
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 快取一天
    res.status(200).send(Buffer.from(audioBuffer));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
