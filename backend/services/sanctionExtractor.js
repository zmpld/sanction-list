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
  "Entity Type": "",
  "Full Name": "",
  "Alias/AKA": "",
  "Nationality": "",
  "Country": "",
  "Sanctioned Date": "",
  "Maintained Date": "",
  "Lifted Date": "",
  "Current Status": "",
  "Issuing Authority": ""
}

Rules:

- "Current Status" must be exactly one of:
  - "Sanctioned"
  - "Lifted"
  - "Maintained"

- "Entity Type" must be exactly one of:
  - "Individual"
  - "Organization"
  - "Vessel"
  - "Aircraft"

- For Nationality:
  - If country is "Philippines"
  - nationality MUST be "Filipino"

- Populate ONLY the relevant event date field.
  Examples:
  - If document is about sanction issuance:
    fill ONLY "Sanctioned Date"

  - If document is about sanction maintenance:
    fill ONLY "Maintained Date"

  - If document is about sanction lifting/removal:
    fill ONLY "Lifted Date"

- Leave unrelated date fields empty

- Extract ALL available aliases

- Extract ALL issuing authorities if available

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
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const parsed = JSON.parse(cleaned);

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
  const text = response.text();

  return parseEntitiesResponse(text);
}

module.exports = {
  extractSanctionEntitiesFromPdf,
};
