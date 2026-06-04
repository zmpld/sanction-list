const {
  extractEntities,
} = require('../services/entityExtractor');

const {
  checkEntitySanctions,
} = require('../services/sanctionsService');

async function checkSanctions(req, res) {
  try {
    console.log('Incoming Request');

    const { text } = req.body;

    console.log('PDF Text Length:', text.length);

    const entities =
      await extractEntities(text);

    console.log('Extracted Entities:', entities);

    const results = [];

    for (const entity of entities) {
      console.log(
        'Checking Entity:',
        entity
      );

      const sanctionResult =
        await checkEntitySanctions(entity);

      results.push(sanctionResult);
    }

    console.log('Final Results:', results);

    res.json({
      results,
    });
  } catch (error) {
    console.error(
      'SERVER ERROR:',
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
}

module.exports = {
  checkSanctions,
};