import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
app.use(cors());

const GNEWS_API_KEY = process.env.VITE_GNEWS_API_KEY;
const GNEWS_API_URL = 'https://gnews.io/api/v4/search';

// Rate limiting setup
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50 // limit each IP to 50 requests per windowMs
});

app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/news/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { lang, q } = req.query;

    console.log(`Fetching news for category: ${category}, query: ${q}`);

    const response = await axios.get(GNEWS_API_URL, {
      params: {
        token: GNEWS_API_KEY,
        lang,
        country: 'ke',
        q,
        max: 10
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Proxy server error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      details: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 