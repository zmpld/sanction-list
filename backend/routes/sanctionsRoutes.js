const express = require('express');

const router = express.Router();

const {
  checkSanctions,
} = require('../controllers/sanctionsController');

router.post(
  '/check-sanctions',
  checkSanctions
);

module.exports = router;