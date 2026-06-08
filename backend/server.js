const dotenv = require('dotenv');

dotenv.config();

const express = require('express');
const cors = require('cors');

const sanctionsRoutes = require('./routes/sanctionsRoutes');
const automationRoutes = require('./routes/automationRoutes');
const { startScheduler } = require('./scheduler');



const app = express();



app.use(cors());

app.use(express.json());



app.get('/', (req, res) => {

  res.send('Backend Working');

});



app.use('/api', sanctionsRoutes);

app.use('/api/automation', automationRoutes);



const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {

  console.log('==============================');

  console.log('Backend Server is RUNNING');

  console.log(`Server URL: http://localhost:${PORT}`);

  console.log('Gemini API Key Loaded:', !!process.env.GEMINI_API_KEY);

  console.log('==============================');



  startScheduler();

});

