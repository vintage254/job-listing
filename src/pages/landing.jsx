import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import companies from "../data/companies.json";
import faqs from "../data/faq.json";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import LogoSvg from "@/components/LogoSvg";
import HeroBanner from "@/components/banner";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { fetchNewsArticles } from "@/api/apiBlogs";

const LandingPage = () => {
  const { theme } = useTheme();
  const [newsArticles, setNewsArticles] = useState([]);

  useEffect(() => {
    const loadPreviewArticles = async () => {
      try {
        const articles = await fetchNewsArticles('english', 'business');
        setNewsArticles(articles.slice(0, 3)); // Only show first 3 articles
      } catch (error) {
        console.error('Error loading preview articles:', error);
      }
    };

    loadPreviewArticles();
  }, []);

  return (
    <main className="flex flex-col gap-10 sm:gap-20 py-10 sm:py-20">
      <section className="text-center ">
        <h1 className={`flex flex-col items-center justify-center gradient-title font-extrabold text-4xl sm:text-6xl lg:text-8xl tracking-tighter py-4 ${
          theme === 'light' ? 'text-black-800' : 'text-white'
        }`}>
          Your Dream Job is
          <span className="flex items-center gap-2 sm:gap-6">
            one click away
            <LogoSvg className="h-12 sm:h-24 lg:h-32" />
          </span>
        </h1>
        <p className="text-gray-300 sm:mt-4 text-xs sm:text-xl">
          Explore thousands of job listings or find the perfect candidate
        </p>
      </section>
      <div className="flex gap-6 justify-center">
        <Link to={"/job-listing"}>
          <Button variant="blue" size="xl">
            Find Jobs
          </Button>
        </Link>
      </div>
      <Carousel
        plugins={[
          Autoplay({
            delay: 2000,
          }),
        ]}
        className="w-full py-10"
      >
        <CarouselContent className="flex gap-5 sm:gap-20 items-center">
          {companies.map(({ name, id, path }) => (
            <CarouselItem key={id} className="basis-1/3 lg:basis-1/6 ">
              <img
                src={path}
                alt={name}
                className="h-9 sm:h-14 object-contain"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <HeroBanner className="w-full" />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">Discover Career Insights for Job Seekers in Today's Market</CardTitle>
          </CardHeader>
          <CardContent >
            Explore industry trends, skill-building tips, and success stories
            to help you stand out in your job search. From crafting a winning
            resume to mastering interviews, we've got you covered!
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-bold"> Search and Apply</CardTitle>
          </CardHeader>
          <CardContent>
            Find the perfect role by browsing job listings tailored to your
            skills. Apply directly, track your applications, and stay one step
            ahead in your career journey!
          </CardContent>
        </Card>
      </section>

      <Accordion type="multiple" className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index + 1}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* News Articles Preview Section */}
      <section className="flex flex-col gap-6 px-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Latest Career Insights
          </h2>
          <Link 
            to="/blog" 
            className="group flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
          >
            View All Articles 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsArticles.map((article, index) => (
            <Link to="/blog" key={index}>
              <Card className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <div className="relative">
                  <img 
                    src={article.image || getDefaultImage(article.category)} 
                    alt={article.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
                      {article.category}
                    </span>
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{article.source}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {article.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Additional Article Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link to="https://www.grammarly.com/blog/resumes-cover-letters/resume-writing-tips">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <svg 
                    className="w-6 h-6 text-blue-600 dark:text-blue-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-blue-500 transition-colors">
                    Resume Writing Tips →
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Learn how to craft a winning resume that stands out
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="https://blog.coursera.org/how-to-prepare-for-job-interviews/">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <svg 
                    className="w-6 h-6 text-purple-600 dark:text-purple-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-purple-500 transition-colors">
                    Interview Preparation →
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Master your interview skills with expert tips
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;