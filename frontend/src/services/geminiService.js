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

  let data;
  try {
    data = await res.json();
  } catch (error) {
    throw new Error(
      `Failed to parse Gemini response: ${error.message}`
    );
  }

  if (!res.ok) {
    console.error("Gemini API error:", data);
    throw new Error(
      data.error?.message ||
        `Gemini API Error: ${res.status}`
    );
  }

  // Extract the text content from Gemini response
  if (
    !data.candidates ||
    !data.candidates[0] ||
    !data.candidates[0].content ||
    !data.candidates[0].content.parts ||
    !data.candidates[0].content.parts[0]
  ) {
    console.error("Invalid Gemini response structure:", data);
    throw new Error("Invalid response structure from Gemini");
  }

  const textContent = 
    data.candidates[0].content.parts[0].text;

  if (!textContent) {
    throw new Error("Gemini returned empty content");
  }

  // Parse and return the JSON array
  try {
    const parsed = JSON.parse(textContent);
    return parsed;
  } catch (error) {
    console.error(
      "Failed to parse Gemini JSON:",
      textContent.substring(0, 500)
    );
    throw new Error(
      `Failed to parse Gemini JSON: ${error.message}`
    );
  }
}