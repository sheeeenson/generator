// ВАЖНО: ХРАНИТЕ ВАШ API КЛЮЧ В ПЕРЕМЕННЫХ ОКРУЖЕНИЯ!
// На Vercel это можно сделать в Settings > Environment Variables.
// Ключ будет доступен в переменной окружения VERCEL_GEMINI_API_KEY.
const API_KEY = process.env.VERCEL_GEMINI_API_KEY;

// Модель, которую мы используем.
const API_MODEL = "gemini-2.5-flash-preview-05-20";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${API_KEY}`;

// Функция-обработчик для Vercel.
// Здесь мы получаем запрос от вашего сайта, вызываем API Gemini
// и возвращаем результат обратно.
export default async function (request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userPrompt, systemPrompt } = request.body;

    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      return response.status(apiResponse.status).json({ error: `API error: ${apiResponse.statusText}` });
    }

    const result = await apiResponse.json();
    const candidate = result.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      return response.status(500).json({ error: 'No content returned from Gemini API.' });
    }
    
    // Возвращаем только сгенерированный текст.
    return response.status(200).json({ text: text.replace(/\*/g, '').trim() });
  } catch (error) {
    console.error('Proxy function error:', error);
    return response.status(500).json({ error: 'Failed to process request.' });
  }
};
