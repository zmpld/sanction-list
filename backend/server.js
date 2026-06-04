const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const sanctionsRoutes = require('./routes/sanctionsRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', sanctionsRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log('==============================');
  console.log('Backend Server is RUNNING');
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log('Gemini API Key Loaded:', !!process.env.GEMINI_API_KEY);
  console.log('==============================');
});

app.get('/', (req, res) => {
  res.send('Backend Working');
});