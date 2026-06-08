const {
  runAutomation,
  getAutomationStatus,
  cancelAutomation,
} = require('../services/automationService');

const {
  readSanctionsCsv,
} = require('../services/csvService');

async function triggerAutomation(req, res) {
  const { force = false, limit = null } =
    req.body || {};

  if (getAutomationStatus().isRunning) {
    return res.status(409).json({
      success: false,
      error: 'Automation is already running',
    });
  }

  res.status(202).json({
    success: true,
    message: 'Automation started',
  });

  runAutomation({
    force: Boolean(force),
    limit:
      limit != null ? Number(limit) : null,
  }).catch((error) => {
    console.error('Background automation failed:', error.message);
  });
}

function getStatus(req, res) {
  res.json(getAutomationStatus());
}

function stopAutomation(req, res) {
  const cancelled = cancelAutomation();

  if (!cancelled) {
    return res.status(409).json({
      success: false,
      error: 'No automation is currently running',
    });
  }

  res.json({
    success: true,
    message: 'Cancellation requested',
  });
}

async function getSanctionsData(req, res) {
  try {
    const records = await readSanctionsCsv();
    res.json({ records });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
}

module.exports = {
  triggerAutomation,
  getStatus,
  stopAutomation,
  getSanctionsData,
};
