import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarLoader } from "react-spinners";
import { fetchNewsArticles, getNewsCategories } from '@/api/apiBlogs';
import { CalendarIcon, Languages, ExternalLink, Globe, Newspaper, Building2, Music2, FileText, NewspaperIcon, ArrowRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import LogoSvg from '@/components/LogoSvg';

const NewsPage = () => {
  const [articles, setArticles] = useState([]);
  const [previewArticles, setPreviewArticles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [language, setLanguage] = useState('english');
  const { toast } = useToast();

  // Category cards data
  const categoryCards = [
    { 
      id: 'business',
      title: 'Business News',
      icon: <Building2 className="h-12 w-12" />,
      description: 'Latest business and economic news from Kenya',
      color: 'bg-blue-100'
    },
    {
      id: 'entertainment',
      title: 'Entertainment',
      icon: <Music2 className="h-12 w-12" />,
      description: 'Entertainment, sports, and cultural updates',
      color: 'bg-purple-100'
    },
    {
      id: 'general',
      title: 'General News',
      icon: <FileText className="h-12 w-12" />,
      description: 'General news and current affairs',
      color: 'bg-green-100'
    },
    {
      id: 'all',
      title: 'All News',
      icon: <NewspaperIcon className="h-12 w-12" />,
      description: 'All news categories in one place',
      color: 'bg-orange-100'
    }
  ];

  // Load preview articles for each category
  useEffect(() => {
    const loadPreviews = async () => {
      const previews = {};
      for (const category of categoryCards) {
        try {
          const data = await fetchNewsArticles(language, category.id);
          if (data && data.length > 0) {
            previews[category.id] = data[0]; // Get the first article for preview
          }
        } catch (error) {
          console.error(`Error loading preview for ${category.id}:`, error);
        }
      }
      setPreviewArticles(previews);
    };

    loadPreviews();
  }, [language]);

  // Load full category articles when selected
  useEffect(() => {
    const loadArticles = async () => {
      if (!selectedCategory) return;
      
      try {
        setLoading(true);
        const data = await fetchNewsArticles(language, selectedCategory);
        setArticles(data);
      } catch (err) {
        console.error('Error loading articles:', err);
        setError(err.message);
        toast({
          title: "Error",
          description: "Failed to load news articles. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [language, selectedCategory, toast]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setArticles([]);
  };

  const handleReadArticle = (article) => {
    if (!article.url) {
      toast({
        title: "Error",
        description: "Article link not available.",
        variant: "destructive",
      });
      return;
    }
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BarLoader color="#36d7b7" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          <span className="flex items-center justify-center gap-2">
            <Newspaper className="h-8 w-8" />
            <LogoSvg className="h-12 sm:h-24 lg:h-32" />
          </span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Latest news from trusted Kenyan sources
        </p>
      </div>

      {/* Language Selection */}
      <div className="flex justify-center gap-4 mb-8">
        <Button
          variant={language === 'english' ? "default" : "outline"}
          onClick={() => setLanguage('english')}
          className="flex items-center gap-2"
        >
          <Languages className="w-4 h-4" />
          English
        </Button>
        <Button
          variant={language === 'swahili' ? "default" : "outline"}
          onClick={() => setLanguage('swahili')}
          className="flex items-center gap-2"
        >
          <Languages className="w-4 h-4" />
          Kiswahili
        </Button>
      </div>

      {selectedCategory ? (
        <>
          {/* Back Button */}
          <Button 
            onClick={handleBack}
            variant="outline"
            className="mb-6"
          >
            ← Back to Categories
          </Button>

          {/* Articles Grid */}
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Card 
                  key={article.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleReadArticle(article)}
                >
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=500';
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {article.category}
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-semibold mb-4 hover:text-blue-600 transition-colors line-clamp-3">
                      {article.title}
                    </h2>
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {article.publishedAt}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Globe className="w-4 h-4 mr-1" />
                        {article.source}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold">No articles found</h3>
              <p className="text-gray-600 mt-2">
                {error || "Try selecting a different category or language"}
              </p>
            </div>
          )}
        </>
      ) : (
        // Updated Category Selection Cards with Previews
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryCards.map((category) => (
            <div key={category.id} className="space-y-4">
              <Card 
                className={`${category.color} hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => handleCategorySelect(category.id)}
              >
                <div className="p-6 flex flex-col items-center text-center">
                  {category.icon}
                  <h2 className="text-2xl font-bold mt-4 mb-2">{category.title}</h2>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              </Card>

              {/* Preview Article Card */}
              {previewArticles[category.id] && (
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={previewArticles[category.id].image}
                      alt={previewArticles[category.id].title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=500';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {previewArticles[category.id].title}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {previewArticles[category.id].source}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategorySelect(category.id);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Read More <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsPage;