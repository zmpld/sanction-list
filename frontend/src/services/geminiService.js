export async function analyzePDFWithGemini(
  b64
) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType:
                    "application/pdf",
                  data: b64,
                },
              },
              {
                text: `
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
  "Issuing Authority": "",
//   "File Source": ""
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
`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType:
            "application/json",
        },
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error(data);

    throw new Error(
      data.error?.message ||
        "Gemini API Error"
    );
  }

  return data;
}