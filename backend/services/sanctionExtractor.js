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
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });
  }

  return model;
}

const EXTRACTION_PROMPT = `
Extract ALL persons and entities mentioned in sanctions-related actions.

Return ONLY valid JSON array.

Each object must contain exactly these keys:

{
  "FullName": "",
  "FirstName": "",
  "MiddleName": "",
  "LastName": "",
  "EntityType": "",
  "Nationality": "",
  "Country": "",
  "WatchListType": "",
  "SanctionDate": "",
  "Position": "",
  "Remarks": ""
}

Rules:

- "WatchListType" must be exactly one of:
  - "Sanctioned"
  - "Lifted"
  - "Maintained"

- "EntityType" must be exactly one of:
  - "Individual"
  - "Organization"
  - "Vessel"
  - "Aircraft"

- "FullName" is the complete name/entity name
- "FirstName", "MiddleName", "LastName" are parsed components (leave empty if not applicable)
- "Nationality" and "Country" are the same for this context
- "SanctionDate" is in YYYY-MM-DD format
- Extract ALL available aliases in "Remarks"
- Preserve exact spelling of names
- Return ALL entities found in the PDF
- Use empty string if unavailable
- No markdown
- No explanations
- No extra text
- Ensure JSON is complete and properly closed
- Do not truncate output
`;

function parseEntitiesResponse(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Gemini returned empty response');
  }

  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  if (!cleaned || cleaned.length === 0) {
    throw new Error('Gemini response is empty after cleanup');
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parse error. Response text:', cleaned.substring(0, 500));
    throw new Error(`Failed to parse Gemini response: ${error.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini response is not a JSON array');
  }

  return parsed;
}

async function extractSanctionEntitiesFromPdf(
  pdfBase64
) {
  const result = await getModel().generateContent({
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const response = await result.response;
  const text = await response.text();

  return parseEntitiesResponse(text);
}

module.exports = {
  extractSanctionEntitiesFromPdf,
};
