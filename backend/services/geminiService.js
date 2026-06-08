const {
  GoogleGenerativeAI,
} = require('@google/generative-ai');

let model;

function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY is not set in backend/.env'
    );
  }

  if (!model) {
    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

    model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
    });
  }

  return model;
}

async function askGemini(prompt) {
  try {
    const result =
      await getModel().generateContent(prompt);

    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error(
      'Gemini API Error:',
      error
    );

    throw error;
  }
}

module.exports = {
  askGemini,
};