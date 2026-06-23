const path = require('path');
const dotenv = require('dotenv');

if (process.env.ELECTRON_ENV_FILE) {
  dotenv.config({ path: process.env.ELECTRON_ENV_FILE });
} else {
  dotenv.config();
}

const express = require('express');
const cors = require('cors');

const sanctionsRoutes = require('./routes/sanctionsRoutes');
const automationRoutes = require('./routes/automationRoutes');
const { startScheduler } = require('./scheduler');

const app = express();
const isElectron = process.env.ELECTRON_APP === 'true';
const apiPrefix = isElectron ? '/api' : '';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  if (isElectron) {
    return res.redirect('/index.html');
  }
  res.send('Backend Working');
});

app.use(`${apiPrefix}/automation`, automationRoutes);
app.use(apiPrefix || '/', sanctionsRoutes);

if (isElectron && process.env.FRONTEND_DIST) {
  const frontendDist = process.env.FRONTEND_DIST;
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

function startServer(port = process.env.PORT || 5000) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, '127.0.0.1', (err) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('==============================');
      console.log('Backend Server is RUNNING');
      console.log(`Server URL: http://127.0.0.1:${port}`);
      console.log('Gemini API Key Loaded:', !!process.env.GEMINI_API_KEY);
      if (isElectron) {
        console.log('Electron mode: serving UI + API');
      }
      console.log('==============================');

      startScheduler();
      resolve(server);
    });

    server.on('error', reject);
  });
}

module.exports = { app, startServer };

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
