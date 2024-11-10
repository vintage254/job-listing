import React, { useEffect, useState } from 'react'
import { useUser, useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import jobsApi, { getJobs, toggleSaveJob } from '@/api/apijobs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { BookmarkIcon, MapPinIcon, BriefcaseIcon } from "lucide-react";
import SaveJobButton from '@/components/SaveJobButton';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

// Add image error handling component
const CompanyLogo = ({ src, alt, className }) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <img 
      src={imgError ? '/default-company-logo.svg' : src}
      alt={alt}
      className={className}
      onError={() => setImgError(true)}
    />
  );
};

const JobListingPage = () => {
  const { user, isSignedIn } = useUser();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    company_id: '',
    searchQuery: ''
  });
  const { getToken } = useAuth();
  const [externalJobsStatus, setExternalJobsStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const jobsPerPage = 3; // Changed from 10 to 3 jobs per page
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        let token = null;

        if (isSignedIn) {
          try {
            token = await getToken({ template: "supabase" });
          } catch (error) {
            console.error('Failed to get auth token:', error);
          }
        }

        const result = await getJobs({
          page: currentPage,
          limit: jobsPerPage,
          searchQuery: filters.searchQuery,
          location: filters.location
        }, token);

        setJobs(result.jobs || []);
        setTotalPages(Math.ceil((result.total || 0) / jobsPerPage));
      } catch (err) {
        console.error('Error loading jobs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [isSignedIn, getToken, currentPage, filters, jobsPerPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({
      ...prev,
      searchQuery: searchQuery,
      location: location
    }));
  };

  const handleSaveJob = async (jobId, alreadySaved) => {
    try {
      await toggleSaveJob(user.id, jobId, alreadySaved);
      // Refresh jobs to update saved status
      loadJobs();
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const JobCard = ({ job }) => {
    const isSaved = job.saved_jobs?.some(saved => saved.user_id === user.id);

    return (
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
              <CompanyLogo 
                src={job.company_logo || job.company?.logo_url}
                alt={job.company_name || job.company?.name}
                className="w-14 h-14 object-contain"
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{job.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {job.company_name || job.company?.name}
              </p>
              
              <div className="flex gap-4 mt-2">
                <span className="flex items-center text-sm text-gray-500">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {job.location}
                </span>
                <span className="flex items-center text-sm text-gray-500">
                  <BriefcaseIcon className="w-4 h-4 mr-1" />
                  {job.job_type}
                </span>
              </div>
              
              {job.salary_range && (
                <p className="mt-2 text-green-600 dark:text-green-400 font-medium">
                  {job.salary_range}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <SaveJobButton 
              jobId={job.id} 
              initialSaved={isSaved}
              jobData={{
                title: job.title,
                company_name: job.company_name,
                company_logo: job.company_logo,
                location: job.location,
                description: job.description,
                salary_range: job.salary_range,
                job_type: job.job_type,
                source: job.source
              }} 
            />
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <Button>Apply Now</Button>
            </a>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
            {job.description}
          </p>
        </div>

        {job.source && (
          <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
            {job.is_external && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">External</span>}
            Source: {job.source}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Section */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <Input
            type="search"
            placeholder="Search jobs by title or keywords"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full md:w-auto"
          />
          <Button type="submit">Search</Button>
        </form>
      </div>

      {/* External Jobs Status Message */}
      {externalJobsStatus && externalJobsStatus !== 'success' && (
        <div className="mb-4 p-4 rounded-lg bg-blue-50 text-blue-800">
          {externalJobsStatus === 'subscription_required' && (
            <p>Currently showing local jobs only. External job listings require API subscription.</p>
          )}
          {externalJobsStatus === 'error' && (
            <p>Unable to fetch external jobs. Showing local jobs only.</p>
          )}
          {externalJobsStatus === 'disabled' && (
            <p>External job listings are currently disabled.</p>
          )}
        </div>
      )}

      {/* Results Section */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold">No jobs found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {jobs.slice(0, 3).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <p className="text-sm text-gray-500 mb-4 text-center">
                    Showing page {currentPage} of {totalPages}
                  </p>
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === 1 || 
                                 page === totalPages || 
                                 Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <PaginationItem>
                                <PaginationLink disabled>...</PaginationLink>
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className={currentPage === page ? "bg-blue-500 text-white" : ""}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        ))}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default JobListingPage;
