const fetch = require('node-fetch');

// ВАЖНО: ХРАНИТЕ ВАШ API КЛЮЧ В ПЕРЕМЕННЫХ ОКРУЖЕНИЯ!
// Например, в Netlify это можно сделать в Settings > Build & deploy > Environment variables.
// Замените YOUR_API_KEY на ваш реальный ключ, когда будете настраивать.
const API_KEY = process.env.GEMINI_API_KEY;

// Модель, которую мы используем. Её можно оставить здесь, так как она не секретная.
const API_MODEL = "gemini-2.5-flash-preview-05-20";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent?key=${API_KEY}`;

// Функция-обработчик для бессерверной функции.
// Здесь мы получаем запрос от вашего сайта, вызываем API Gemini
// и возвращаем результат обратно.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { userPrompt, systemPrompt } = JSON.parse(event.body);

    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Возвращаем ошибку, если запрос к API не удался
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `API error: ${response.statusText}` }),
      };
    }

    const result = await response.json();
    const candidate = result.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No content returned from Gemini API.' }),
      };
    }
    
    // Возвращаем только сгенерированный текст.
    return {
      statusCode: 200,
      body: JSON.stringify({ text: text.replace(/\*/g, '').trim() }),
    };
  } catch (error) {
    console.error('Proxy function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process request.' }),
    };
  }
};
