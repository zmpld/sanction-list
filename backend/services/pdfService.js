const pdfParse = require('pdf-parse');

async function downloadPdf(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; SanctionListBot/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download PDF: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return buffer;
}

async function extractTextFromPdf(buffer) {
  const result = await pdfParse(buffer);
  return (result.text || '').trim();
}

function bufferToBase64(buffer) {
  return buffer.toString('base64');
}

module.exports = {
  downloadPdf,
  extractTextFromPdf,
  bufferToBase64,
};
