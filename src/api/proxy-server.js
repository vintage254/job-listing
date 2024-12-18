import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());

const GNEWS_API_KEY = process.env.VITE_GNEWS_API_KEY;
const GNEWS_API_URL = 'https://gnews.io/api/v4/search';

app.get('/api/news/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { lang, q } = req.query;

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
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 