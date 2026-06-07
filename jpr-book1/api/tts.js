// Vercel Edge Function — TypeCast TTS Proxy
// Edge Runtime 沒有 allowlist 限制，可以自由呼叫外部 API

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.TYPECAST_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
  }

  try {
    const { text, emotion, tempo } = await req.json();

    const response = await fetch('https://api.typecast.ai/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({
        voice_id: 'tc_67d3b089782cabcc61569530',
        text: text || 'bat',
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
      return new Response(JSON.stringify({ error: err }), { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
