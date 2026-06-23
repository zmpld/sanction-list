const {
  app,
  BrowserWindow,
  dialog,
} = require('electron');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

const PORT = 58392;
let mainWindow = null;
let backendProcess = null;

function getPaths() {
  const isPackaged = app.isPackaged;

  return {
    backend: isPackaged
      ? path.join(process.resourcesPath, 'backend')
      : path.join(__dirname, '..', 'backend'),
    frontendDist: isPackaged
      ? path.join(process.resourcesPath, 'frontend-dist')
      : path.join(__dirname, '..', 'frontend', 'dist'),
    userData: app.getPath('userData'),
  };
}

function ensureUserEnv(paths) {
  const dataDir = path.join(paths.userData, 'data');
  const envPath = path.join(paths.userData, '.env');
  const envExample = path.join(paths.backend, '.env.example');
  const devEnv = path.join(paths.backend, '.env');

  fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(devEnv)) {
      fs.copyFileSync(devEnv, envPath);
    } else if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envPath);
    } else {
      fs.writeFileSync(
        envPath,
        'GEMINI_API_KEY=\nENABLE_CRON=true\nCRON_SCHEDULE=0 6 * * *\n'
      );
    }
  }

  return { dataDir, envPath };
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const paths = getPaths();
    const { dataDir, envPath } = ensureUserEnv(paths);

    if (!fs.existsSync(paths.frontendDist)) {
      reject(
        new Error(
          'Frontend build folder not found. Run: npm run build:frontend'
        )
      );
      return;
    }

    const forkOptions = {
      cwd: paths.backend,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        ELECTRON_APP: 'true',
        ELECTRON_ENV_FILE: envPath,
        PORT: String(PORT),
        SANCTION_DATA_DIR: dataDir,
        FRONTEND_DIST: paths.frontendDist,
      },
      stdio: 'pipe',
    };

    if (app.isPackaged) {
      forkOptions.execPath = process.execPath;
    }

    backendProcess = fork(
      path.join(paths.backend, 'start-electron.js'),
      [],
      forkOptions
    );

    backendProcess.stdout?.on('data', (chunk) => {
      console.log(`[backend-stdout] ${chunk.toString().trim()}`);
    });

    backendProcess.stderr?.on('data', (chunk) => {
      console.error(`[backend-stderr] ${chunk.toString().trim()}`);
    });

    backendProcess.on('error', (err) => {
      console.error('[backend-error]', err);
      reject(err);
    });

    backendProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Backend structural process collapsed with exit code: ${code}`);
        reject(new Error(`Backend application process closed unexpectedly with code ${code}`));
      }
    });

    waitForBackend(resolve, reject);
  });
}

async function waitForBackend(resolve, reject) {
  const url = `http://127.0.0.1:${PORT}/api/automation/status`;

  // Retries checking health endpoint 40 times over 20 seconds
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        resolve();
        return;
      }
    } catch {
      // Background worker is still starting up, retry silently...
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  reject(new Error('Backend did not answer status health check within 20 seconds. Open logs to review crashes.'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Sanction List Monitor',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function showStartupError(error) {
  await dialog.showMessageBox({
    type: 'error',
    title: 'Startup Error',
    message: 'Sanction List Monitor failed to start',
    detail: error.message,
  });
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (error) {
    await showStartupError(error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});