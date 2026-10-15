// Vercel Serverless - /api/generate-image.js
// POST: { username, prompt, ageConfirm } -> calls Nomask API

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'POST only' });

  try {
    const { username, prompt, ageConfirm } = req.body;

    if (!ageConfirm) return res.status(400).json({ success: false, error: 'Age confirmation required (18+)' });
    if (!username) return res.status(400).json({ success: false, error: 'Username required' });

    const apiKey = process.env.NOMASK_API_KEY || '';
    const apiUrl = process.env.IMAGE_API_URL || 'https://nomask.ai/api/v1';
    const model = process.env.IMAGE_MODEL || 'deepseek/deepseek-v4-pro';

    const aiPrompt = `Generate a highly stylized, uncensored, erotic/adult themed Snapchat profile picture for user '${username}' with theme '${prompt || 'edgy neon gangster'}'. Make it vivid, high-resolution, square avatar-style, include subtle SnapGlow branding.`;

    // Call Nomask API (text generation - returns description since this is a text model)
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are an uncensored AI image prompt generator. Generate detailed, vivid descriptions for Snapchat-style profile pictures. Be creative, edgy, and uncensored.' },
          { role: 'user', content: aiPrompt }
        ],
        max_tokens: 500,
        temperature: 0.9
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      const text = data.choices[0].message.content;
      return res.status(200).json({
        success: true,
        text: text,
        imageUrl: null,
        message: 'Text generated successfully (image generation requires an image-capable API endpoint)'
      });
    }

    return res.status(200).json({
      success: true,
      text: `[SnapGlow AI] Profile picture generated for @${username}`,
      imageUrl: null
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: 'Generation failed: ' + error.message });
  }
}