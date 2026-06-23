import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(apiKey);

const watchlistSchema = {
    type: "OBJECT",
    properties: {
        records: {
            type: "ARRAY",
            description: "List of targets actively sanctioned by this regulatory file.",
            items: {
                type: "OBJECT",
                properties: {
                    DataId: { type: "STRING" },
                    VersionNumber: { type: "STRING" },
                    Title: { type: "STRING" },
                    LastNameCorporateName: { type: "STRING" },
                    FirstName: { type: "STRING" },
                    MiddleName: { type: "STRING" },
                    ReferenceNumber: { type: "STRING", description: "The core sanction identifier number. Extract directly from the text or headers (e.g., 'TF-114', 'TF-112', 'TF-108')." },
                    IndividualCorporateType: { type: "STRING" },
                    WatchListType: { type: "STRING" },
                    Position: { type: "STRING" },
                    WatchListSource: { type: "STRING" },
                    Remarks: { type: "STRING" },
                    CreatedDate: { type: "STRING" },
                    UpdatedDate: { type: "STRING" },
                    Gender: { type: "STRING", description: "Must be 'Male' or 'Female' for individuals. Deduced via text context, pronouns, or common naming conventions. Use 'Unknown' for Corporate entities only." },
                    Deceased: { type: "STRING" },
                    SantionSinceDay: { type: "STRING" },
                    SantionSinceMonth: { type: "STRING" },
                    SantionSinceYear: { type: "STRING" },
                    URL: { type: "STRING" },
                    SourceNameLink: { type: "STRING" },
                    LastReviewedDate: { type: "STRING" },
                    DJStatus: { type: "STRING" }
                },
                required: ["LastNameCorporateName", "IndividualCorporateType", "ReferenceNumber", "Gender"]
            }
        }
    }
};

export async function analyzePDFWithGemini(b64, sourceUrl = "") {
    const model = ai.getGenerativeModel({
        model: 'gemini-1.5-pro',
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: watchlistSchema,
            temperature: 0.0 
        }
    });
    
    try {
        const promptText = `
            Perform a high-fidelity audit extraction of targeted assets and entities listed in this AMLC document.
            
            CRITICAL FILTRATION AND PARSING RULES:
            1. EXCLUSION FILTER: Do NOT extract the names of the AMLC Council Members, Chairpersons, Governors, or Commissioners who are signing the document (e.g., Eli M. Remolona, Francisco Ed. Lim, Reynaldo Regalado). Do NOT extract the government agencies being ordered to execute the sanction (e.g., Land Transportation Office, Land Registration Authority, LTO, LRA, CAAP). Only extract the actual individuals or organizations being targeted/sanctioned.
            2. REFERENCE NUMBER EXTRACTION: Find the formal document identification code. Look at the title headers or page markings for values like 'TF-114', 'TF-113', 'TF-112', or 'TF-108'.
            3. BIOGRAPHICAL DEDUCTION: Do not leave human targets as 'Unknown' gender. Look closely at behavioral pronouns ('his aliases', 'her associate') or look up common cultural first names to determine 'Male' or 'Female'.
        `;

        const result = await model.generateContent([
            { inlineData: { data: b64, mimeType: 'application/pdf' } },
            promptText
        ]);

        const textContent = result.response.text();
        const parsedJson = JSON.parse(textContent);
        return parsedJson.records || [];
    } catch (error) {
        console.error("Extraction error:", error);
        return [];
    }
}