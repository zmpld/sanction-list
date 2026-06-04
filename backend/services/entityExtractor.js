const {
  askGemini,
} = require('./geminiService');

async function extractEntities(text) {
  const prompt = `
Extract all people, companies,
organizations, banks, and countries
from this text.

Return ONLY a JSON array.

Text:
${text}
`;

  const response = await askGemini(prompt);

  try {
    return JSON.parse(response);
  } catch (error) {
    return [];
  }
}

module.exports = {
  extractEntities,
};