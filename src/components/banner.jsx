import React from 'react';
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import LogoSvg from './LogoSvg';
import { Button } from "@/components/ui/button";

const HeroBanner = () => {
  const { user } = useUser();

  return (
    <div className="relative w-full overflow-hidden py-20">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1a1a] to-[#0A0A0A]"
      />

      {/* Decorative Elements - Kenyan-inspired patterns */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-green-500/10 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-red-500/10 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/5 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Left Content */}
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
              <span className="text-green-500">Karibu</span>
              <br />
              <span className="text-white">to Kenya's Premier</span>
              <br />
              <span className="text-red-500">Job Platform</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl">
              Connect with top employers across Kenya and find opportunities that match your skills and aspirations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/job-listing">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full text-lg shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/40"
                >
                  Find Jobs
                </Button>
              </Link>
              {user?.unsafeMetadata?.role === "recruiter" && (
                <Link to="/post-job">
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full text-lg shadow-lg shadow-red-500/20 transition-all hover:shadow-red-500/40"
                  >
                    Post a Job
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Right Content - Logo */}
          <div className="flex-1 flex justify-center items-center relative">
            {/* Logo Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-transparent to-red-500/20 blur-2xl" />
            <LogoSvg className="w-64 h-64 lg:w-80 lg:h-80 transform hover:scale-105 transition-transform duration-300 relative z-10" />
          </div>
        </div>

        {/* Kenyan Flag Accent */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-black via-red-600 to-green-600"></div>
      </div>
    </div>
  );
};

export default HeroBanner;