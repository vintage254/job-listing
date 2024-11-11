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

const LandingPage = () => {
  const { theme } = useTheme();

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
    </main>
  );
};

export default LandingPage;