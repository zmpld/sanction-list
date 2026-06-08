require('dotenv').config();

const {
  runAutomation,
} = require('../services/automationService');

async function main() {
  const force = process.argv.includes('--force');
  const limitArg = process.argv.find((arg) =>
    arg.startsWith('--limit=')
  );
  const limit = limitArg
    ? Number(limitArg.split('=')[1])
    : null;

  try {
    const summary = await runAutomation({
      force,
      limit,
    });

    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
