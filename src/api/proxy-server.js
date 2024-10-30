import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite app's URL
  methods: ['GET', 'POST'],
  credentials: true
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Proxy endpoint for FindWork API
app.get('/api/findwork', async (req, res, next) => {
  try {
    console.log('Fetching from FindWork API...');
    const response = await axios.get('https://findwork.dev/api/jobs/', {
      headers: {
        'Authorization': `Token ${process.env.FINDWORK_API_KEY}`,
        'Accept': 'application/json'
      },
      params: req.query
    });
    console.log('FindWork API response received');
    res.json(response.data);
  } catch (error) {
    console.error('FindWork API Error:', error);
    next(error);
  }
});

// Proxy endpoint for Reed API
app.get('/api/reed', async (req, res, next) => {
  try {
    console.log('Fetching from Reed API...');
    const response = await axios.get('https://www.reed.co.uk/api/1.0/search', {
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.REED_API_KEY + ':').toString('base64')}`,
        'Accept': 'application/json'
      },
      params: req.query
    });
    console.log('Reed API response received');
    res.json(response.data);
  } catch (error) {
    console.error('Reed API Error:', error);
    next(error);
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log('Environment:', {
    FINDWORK_API_KEY: process.env.FINDWORK_API_KEY ? 'Set' : 'Not set',
    REED_API_KEY: process.env.REED_API_KEY ? 'Set' : 'Not set',
    PORT: process.env.PORT
  });
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
}); 