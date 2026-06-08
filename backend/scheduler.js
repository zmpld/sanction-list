const cron = require('node-cron');

const {
  runAutomation,
} = require('./services/automationService');

const { CRON_SCHEDULE } = require('./config/constants');

function startScheduler() {
  if (process.env.ENABLE_CRON === 'false') {
    console.log('Cron scheduler disabled');
    return;
  }

  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(
      `Invalid CRON_SCHEDULE: ${CRON_SCHEDULE}`
    );
    return;
  }

  cron.schedule(CRON_SCHEDULE, async () => {
    console.log('Scheduled AMLC automation started');

    try {
      await runAutomation();
    } catch (error) {
      console.error(
        'Scheduled automation failed:',
        error.message
      );
    }
  });

  console.log(
    `Cron scheduler active (${CRON_SCHEDULE})`
  );
}

module.exports = {
  startScheduler,
};
