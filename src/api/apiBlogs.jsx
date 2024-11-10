import axios from 'axios';

const CACHE_KEY_PREFIX = 'news_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const NEWSDATA_API = {
  key: import.meta.env.VITE_NEWSDATA_API_KEY,
  baseUrl: 'https://newsdata.io/api/1/latest',
  country: 'ke', // Kenya country code
  articlesPerPage: 10
};

export const fetchNewsArticles = async (language = 'english', category = 'all') => {
  try {
    // Check cache first
    const cachedData = getCachedData(language, category);
    if (cachedData) {
      console.log(`Serving cached ${language} ${category} news`);
      return cachedData;
    }

    console.log(`Fetching fresh ${language} ${category} news...`);

    // Map our categories to NewsData.io categories
    const apiCategory = mapCategory(category);
    
    const response = await axios.get(NEWSDATA_API.baseUrl, {
      params: {
        apikey: NEWSDATA_API.key,
        country: NEWSDATA_API.country,
        category: apiCategory,
        language: language === 'english' ? 'en' : 'sw'
      }
    });

    if (response.data && response.data.results) {
      const articles = processArticles(response.data.results, language, category);
      if (articles.length > 0) {
        setCacheData(articles, language, category);
        return articles;
      }
    }

    return [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return getCachedData(language, category, true) || [];
  }
};

const mapCategory = (category) => {
  const categoryMap = {
    'business': 'business',
    'entertainment': 'entertainment',
    'general': 'top',
    'all': 'top'
  };
  return categoryMap[category.toLowerCase()] || 'top';
};

const processArticles = (articles, language, category) => {
  return articles.map((article, index) => ({
    id: `${language}_${category}_${index}`,
    title: article.title,
    category: getCategoryFromContent(article.title, category),
    url: article.link,
    image: article.image_url || getDefaultImage(category),
    source: article.source_name || 'Kenyan News',
    publishedAt: new Date(article.pubDate).toLocaleString(),
    language: language,
    description: article.description || article.content || ''
  })).slice(0, NEWSDATA_API.articlesPerPage);
};

const getCategoryFromContent = (title = '', defaultCategory = 'general') => {
  const content = title.toLowerCase();
  
  if (content.match(/business|economy|market|trade|finance|stock|investment|company|startup/)) {
    return 'Business News';
  }
  
  if (content.match(/entertainment|music|movie|celebrity|art|culture|fashion|sport|game/)) {
    return 'Entertainment';
  }
  
  return 'General News';
};

const getDefaultImage = (category) => {
  const images = {
    'Business News': 'https://images.unsplash.com/photo-1541873676-a18131494184?w=500',
    'Entertainment': 'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=500',
    'General News': 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=500',
    'default': 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=500'
  };
  return images[category] || images.default;
};

const getCachedData = (language, category, ignoreExpiry = false) => {
  try {
    const key = `${CACHE_KEY_PREFIX}_${language}_${category}`;
    const cache = JSON.parse(localStorage.getItem(key) || '{}');
    if (ignoreExpiry || cache.expiry > Date.now()) {
      return cache.data;
    }
    return null;
  } catch {
    return null;
  }
};

const setCacheData = (data, language, category) => {
  try {
    const key = `${CACHE_KEY_PREFIX}_${language}_${category}`;
    localStorage.setItem(key, JSON.stringify({
      data,
      expiry: Date.now() + CACHE_DURATION,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error caching news:', error);
  }
};

export const getNewsCategories = () => [
  'All News',
  'Business News',
  'Entertainment',
  'General News'
];
