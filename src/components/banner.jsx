import React from 'react';
import LogoSvg from './LogoSvg';
import { Link } from "react-router-dom";

const HeroBanner = () => {
  return (
    <div className="relative w-full bg-[#0A0A0A] overflow-hidden">
      {/* Kenyan-inspired Background */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.3)),
            url('/images/kenyan-pattern.png')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="space-y-8">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white space-y-3">
            <div className="flex items-center">
              <span className="text-green-500">Karibu</span>
              <span className="ml-4">to Your Dream Job</span>
            </div>
            <div className="text-red-500">Pata Kazi Leo!</div>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-3xl">
            Explore thousands of job listings across Kenya or find the perfect candidate
          </p>

          {/* Call to Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                      <Link to={"/job"}>
                          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
                              Find Jobs
                          </button>
                      </Link>
                      <Link to={"/post-job"}>
                          <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
                              Post a Job
                          </button>
                      </Link>
          </div>

          {/* Kenyan Flag Accent */}
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-black via-red-600 to-green-600"></div>

          {/* Logo */}
          <div className="absolute top-8 right-8 sm:top-12 sm:right-12">
            <LogoSvg className="h-12 sm:h-16 lg:h-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
