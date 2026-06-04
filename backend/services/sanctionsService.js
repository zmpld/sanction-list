const {
  askGemini,
} = require('./geminiService');

async function checkEntitySanctions(entity) {
  const prompt = `
Search whether this entity appears
in sanctions databases.

Entity: ${entity}

Check:
- OFAC SDN List
- United Nations Sanctions List
- EU Consolidated Financial Sanctions List

Return ONLY valid JSON:

{
  "entity": "",
  "sanctioned": true,
  "source": "",
  "reason": ""
}
`;

  const response = await askGemini(prompt);

  try {
    return JSON.parse(response);
  } catch (error) {
    return {
      entity,
      sanctioned: false,
      source: 'Unknown',
      reason: 'Parsing error',
    };
  }
}

module.exports = {
  checkEntitySanctions,
};