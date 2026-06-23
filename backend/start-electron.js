const { startServer } = require('./server');

const PORT = Number(process.env.PORT) || 58392;

// Fire up the structural server
startServer(PORT)
  .then(() => {
    console.log(`[start-electron] Backend service listening successfully on port ${PORT}`);
  })
  .catch((err) => {
    console.error('[start-electron] Production backend engine failed to spin up:', err);
    process.exit(1);
  });





// // const { startServer } = require('./server');

// // const PORT = Number(process.env.PORT) || 58392;

// // startServer(PORT).catch((err) => {
// //   console.error('Electron backend failed:', err);
// //   process.exit(1);
// // });


// const { startServer } = require('./server');
// const path = require('path');
// const express = require('express'); // Make sure express is required if you use it here

// const PORT = Number(process.env.PORT) || 58392;

// // 1. Determine where the React frontend assets live
// // In production, Electron passes the path via process.env.FRONTEND_DIST
// // In development, it falls back to the local relative path
// const FRONTEND_PATH = process.env.FRONTEND_DIST || path.join(__dirname, '../frontend/dist');

// // 2. Start the server
// startServer(PORT)
//   .then((app) => {
//     console.log(`Backend server successfully running on port ${PORT}`);
//     console.log(`Serving static frontend files from: ${FRONTEND_PATH}`);
    
//     // 3. Tell Express to serve the built React app static files
//     app.use(express.static(FRONTEND_PATH));

//     // 4. Handle client-side routing fallback (SPA support)
//     // If a user refreshes on a sub-route, serve the index.html file
//     app.get('*', (req, res) => {
//       res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
//     });
//   })
//   .catch((err) => {
//     console.error('Electron backend failed to initialize:', err);
//     process.exit(1);
//   });