const express = require('express');

const router = express.Router();

const {
  triggerAutomation,
  getStatus,
  stopAutomation,
  getSanctionsData,
} = require('../controllers/automationController');

router.post('/run', triggerAutomation);
router.post('/cancel', stopAutomation);
router.get('/status', getStatus);
router.get('/sanctions', getSanctionsData);

module.exports = router;
