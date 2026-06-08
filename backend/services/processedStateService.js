const fs = require('fs/promises');

const {
  PROCESSED_STATE_PATH,
  DATA_DIR,
} = require('../config/constants');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readProcessedState() {
  try {
    const content = await fs.readFile(
      PROCESSED_STATE_PATH,
      'utf8'
    );
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { processedUrls: [] };
    }

    throw error;
  }
}

async function writeProcessedState(state) {
  await ensureDataDir();
  await fs.writeFile(
    PROCESSED_STATE_PATH,
    JSON.stringify(state, null, 2),
    'utf8'
  );
}

async function markUrlProcessed(url) {
  const state = await readProcessedState();
  const processedUrls = new Set(state.processedUrls || []);

  processedUrls.add(url);

  await writeProcessedState({
    ...state,
    processedUrls: Array.from(processedUrls),
    lastUpdated: new Date().toISOString(),
  });
}

function isUrlProcessed(state, url) {
  return (state.processedUrls || []).includes(url);
}

module.exports = {
  readProcessedState,
  writeProcessedState,
  markUrlProcessed,
  isUrlProcessed,
};
