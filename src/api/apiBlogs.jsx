import axios from 'axios';

const CACHE_KEY_PREFIX = 'news_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const BACKGROUND_REFRESH_THRESHOLD = 12 * 60 * 60 * 1000; // 12 hours - refresh when cache is half expired

const NEWSDATA_API = {
  key: import.meta.env.VITE_NEWSDATA_API_KEY,
  baseUrl: 'https://newsdata.io/api/1/latest',
  country: 'ke',
  articlesPerPage: 10,
  maxRequestsPerDay: 200
};

// Track API calls
const apiCallTracker = {
  calls: 0,
  lastReset: Date.now(),
  
  increment() {
    if (Date.now() - this.lastReset > 24 * 60 * 60 * 1000) {
      this.calls = 0;
      this.lastReset = Date.now();
    }
    this.calls++;
  },
  
  canMakeCall() {
    return this.calls < NEWSDATA_API.maxRequestsPerDay;
  }
};

export const fetchNewsArticles = async (language = 'english', category = 'all') => {
  try {
    // Check cache first
    const cachedData = await getCachedData(language, category);
    
    // If we have cached data
    if (cachedData) {
      // Check if we should refresh in background
      const cacheAge = Date.now() - cachedData.timestamp;
      if (cacheAge > BACKGROUND_REFRESH_THRESHOLD && apiCallTracker.canMakeCall()) {
        console.log('Triggering background refresh of news cache');
        refreshCacheInBackground(language, category);
      }
      return cachedData.data;
    }

    // No cache, fetch fresh data
    return await fetchFreshNewsData(language, category);
  } catch (error) {
    console.error('Error in fetchNewsArticles:', error);
    // Return expired cache as fallback
    const expiredCache = await getCachedData(language, category, true);
    return expiredCache?.data || [];
  }
};

const fetchFreshNewsData = async (language, category) => {
  if (!apiCallTracker.canMakeCall()) {
    throw new Error('API daily limit reached');
  }

  console.log(`Fetching fresh ${language} ${category} news...`);
  
  const apiCategory = mapCategory(category);
  
  apiCallTracker.increment();
  
  const response = await axios.get(NEWSDATA_API.baseUrl, {
    params: {
      apikey: NEWSDATA_API.key,
      country: NEWSDATA_API.country,
      category: apiCategory,
      language: language === 'english' ? 'en' : 'sw'
    }
  });

  if (response.data?.results) {
    const articles = processArticles(response.data.results, language, category);
    if (articles.length > 0) {
      await setCacheData(articles, language, category);
      return articles;
    }
  }

  return [];
};

const refreshCacheInBackground = async (language, category) => {
  try {
    await fetchFreshNewsData(language, category);
  } catch (error) {
    console.error('Background refresh failed:', error);
  }
};

// Update cache functions to properly use IndexedDB
const getCachedData = async (language, category, ignoreExpiry = false) => {
  try {
    const db = await openCache();
    const key = `${CACHE_KEY_PREFIX}_${language}_${category}`;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['news'], 'readonly');
      const store = transaction.objectStore('news');
      const request = store.get(key);

      request.onsuccess = () => {
        const cache = request.result;
        if (!cache) {
          resolve(null);
          return;
        }
        
        if (ignoreExpiry || cache.expiry > Date.now()) {
          resolve(cache);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Cache read error:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

const setCacheData = async (data, language, category) => {
  try {
    const db = await openCache();
    const key = `${CACHE_KEY_PREFIX}_${language}_${category}`;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['news'], 'readwrite');
      const store = transaction.objectStore('news');
      const request = store.put({
        data,
        expiry: Date.now() + CACHE_DURATION,
        timestamp: Date.now(),
        key
      });

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Cache write error:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// Update openCache to properly handle database opening
const openCache = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NewsCache', 1);
    
    request.onerror = () => {
      console.error('Failed to open cache:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('news')) {
        db.createObjectStore('news', { keyPath: 'key' });
      }
    };
  });
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

export const getNewsCategories = () => [
  'All News',
  'Business News',
  'Entertainment',
  'General News'
];
