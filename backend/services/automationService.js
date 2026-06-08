const { fetchPdfLinks } = require('./scraperService');
const {
  downloadPdf,
  extractTextFromPdf,
  bufferToBase64,
} = require('./pdfService');
const {
  extractSanctionEntitiesFromPdf,
} = require('./sanctionExtractor');
const fs = require('fs/promises');
const {
  readSanctionsCsv,
  appendSanctions,
} = require('./csvService');
const { CSV_PATH } = require('../config/constants');
const {
  readProcessedState,
  markUrlProcessed,
  isUrlProcessed,
} = require('./processedStateService');
const {
  isGithubConfigured,
  uploadCsvToGithub,
} = require('./githubService');
const {
  RATE_LIMIT_DELAY_MS,
} = require('../config/constants');

const automationState = {
  isRunning: false,
  cancelRequested: false,
  lastRun: null,
  logs: [],
};

function isCancelled() {
  return automationState.cancelRequested;
}

async function cancellableSleep(ms) {
  const intervalMs = 250;
  let elapsed = 0;

  while (elapsed < ms) {
    if (isCancelled()) {
      return;
    }

    const wait = Math.min(intervalMs, ms - elapsed);
    await new Promise((resolve) => setTimeout(resolve, wait));
    elapsed += wait;
  }
}

function throwIfCancelled() {
  if (isCancelled()) {
    throw new Error('CANCELLED');
  }
}

function addLog(message) {
  const entry = {
    timestamp: new Date().toISOString(),
    message,
  };

  automationState.logs.unshift(entry);

  if (automationState.logs.length > 200) {
    automationState.logs.length = 200;
  }

  console.log(`[automation] ${message}`);
}

function getAutomationStatus() {
  return {
    isRunning: automationState.isRunning,
    cancelRequested: automationState.cancelRequested,
    lastRun: automationState.lastRun,
    logs: automationState.logs,
    githubConfigured: isGithubConfigured(),
  };
}

function cancelAutomation() {
  if (!automationState.isRunning) {
    return false;
  }

  automationState.cancelRequested = true;
  addLog('Cancellation requested — stopping after current PDF...');
  return true;
}

async function finalizeRun(summary, newEntities, cancelled) {
  if (newEntities.length > 0) {
    addLog('Merging results into sanctions CSV...');
    const merged = await appendSanctions(newEntities);
    summary.totalRecords = merged.length;
  } else {
    const existing = await readSanctionsCsv();
    summary.totalRecords = existing.length;
  }

  if (!cancelled && isGithubConfigured()) {
    addLog('Uploading CSV to GitHub...');
    const csvContent = await fs.readFile(CSV_PATH, 'utf8');

    summary.github = await uploadCsvToGithub(
      csvContent,
      `Automated AMLC sanctions update (${newEntities.length} new entities)`
    );

    addLog('GitHub CSV updated successfully');
  }

  summary.finishedAt = new Date().toISOString();
  summary.cancelled = cancelled;
  automationState.lastRun = summary;

  if (cancelled) {
    addLog(
      `Automation cancelled. Saved ${summary.entitiesExtracted} entities from ${summary.pdfsProcessed} PDF(s).`
    );
  } else {
    addLog(
      `Automation complete. ${summary.entitiesExtracted} entities from ${summary.pdfsProcessed} PDF(s).`
    );
  }

  return summary;
}

async function runAutomation(options = {}) {
  const { force = false, limit = null } = options;

  if (automationState.isRunning) {
    throw new Error('Automation is already running');
  }

  automationState.isRunning = true;
  automationState.cancelRequested = false;
  automationState.logs = [];

  const summary = {
    startedAt: new Date().toISOString(),
    pdfLinksFound: 0,
    pdfsProcessed: 0,
    pdfsSkipped: 0,
    pdfsFailed: 0,
    entitiesExtracted: 0,
    totalRecords: 0,
    github: null,
    errors: [],
  };

  const newEntities = [];

  try {
    addLog('Fetching AMLC page for PDF links...');
    const pdfLinks = await fetchPdfLinks();
    summary.pdfLinksFound = pdfLinks.length;
    addLog(`Found ${pdfLinks.length} AMLC Resolution TF PDF links`);

    const processedState = await readProcessedState();
    const linksToProcess = pdfLinks.filter((link) => {
      if (force) return true;
      return !isUrlProcessed(processedState, link.url);
    });

    const limitedLinks =
      typeof limit === 'number' && limit > 0
        ? linksToProcess.slice(0, limit)
        : linksToProcess;

    summary.pdfsSkipped =
      pdfLinks.length - linksToProcess.length;

    if (limitedLinks.length === 0) {
      addLog('No new PDFs to process');
      const existing = await readSanctionsCsv();
      summary.totalRecords = existing.length;
      summary.finishedAt = new Date().toISOString();
      automationState.lastRun = summary;
      return summary;
    }

    addLog(
      `Processing ${limitedLinks.length} PDF(s)...`
    );

    for (const link of limitedLinks) {
      throwIfCancelled();

      try {
        addLog(`Downloading: ${link.title}`);
        const buffer = await downloadPdf(link.url);
        const text = await extractTextFromPdf(buffer);

        if (!text) {
          addLog(
            `Skipping empty PDF: ${link.title}`
          );
          summary.pdfsSkipped++;
          continue;
        }

        addLog(
          `Extracting entities via Gemini: ${link.title}`
        );

        const pdfBase64 = bufferToBase64(buffer);
        const entities =
          await extractSanctionEntitiesFromPdf(
            pdfBase64
          );

        const enriched = entities.map((entity) => ({
          ...entity,
          'Source File': link.title,
          'Source URL': link.url,
        }));

        newEntities.push(...enriched);
        summary.pdfsProcessed++;
        summary.entitiesExtracted += enriched.length;

        await markUrlProcessed(link.url);

        addLog(
          `Extracted ${enriched.length} entities from ${link.title}`
        );
      } catch (error) {
        summary.pdfsFailed++;
        summary.errors.push({
          source: link.title,
          url: link.url,
          message: error.message,
        });

        addLog(
          `Failed ${link.title}: ${error.message}`
        );
      }

      await cancellableSleep(RATE_LIMIT_DELAY_MS);
    }

    return await finalizeRun(summary, newEntities, false);
  } catch (error) {
    if (error.message === 'CANCELLED') {
      return await finalizeRun(
        summary,
        newEntities,
        true
      );
    }

    summary.errors.push({
      source: 'automation',
      message: error.message,
    });

    addLog(`Automation failed: ${error.message}`);
    summary.finishedAt = new Date().toISOString();
    automationState.lastRun = summary;

    throw error;
  } finally {
    automationState.isRunning = false;
    automationState.cancelRequested = false;
  }
}

module.exports = {
  runAutomation,
  getAutomationStatus,
  cancelAutomation,
};
