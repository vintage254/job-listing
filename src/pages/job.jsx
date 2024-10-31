import { useEffect } from "react";
import { BarLoader } from "react-spinners";
import MDEditor from "@uiw/react-md-editor";
import { useParams, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Briefcase, MapPinIcon, CalendarIcon, ClipboardListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useFetch from "@/hooks/use-fetch";
import { getSingleJob } from "@/api/apijobs";
import { ApplyJobButton } from "@/components/ApplyJobButton";

const JobPage = () => {
  const params = useParams();
  const { isLoaded, user } = useUser();

  const {
    loading: loadingJob,
    data: job,
    fn: fetchJob,
  } = useFetch(getSingleJob);

  useEffect(() => {
    if (isLoaded && params?.id) {
      console.log('Fetching job with ID:', params.id);
      fetchJob(params.id);
    }
  }, [isLoaded, params?.id]);

  if (!isLoaded || loadingJob) {
    return <BarLoader className='mb-4' width={'100%'} color="#36d7b7" />;
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Job not found</h2>
        <Link to="/job-listing" className="text-blue-500 hover:underline">
          Back to Jobs
        </Link>
      </div>
    );
  }

  // Format deadline date
  const formattedDeadline = job.application_deadline 
    ? new Date(job.application_deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  // Check if job has expired
  const hasExpired = job.application_deadline 
    ? new Date(job.application_deadline) < new Date() 
    : false;

  return (
    <div className="flex flex-col gap-8 mt-5">
      <div className="flex flex-col-reverse gap-6 md:flex-row justify-between items-center">
        <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-6xl">
          {job.title}
        </h1>
        {job.company_logo && (
          <img src={job.company_logo} className="h-12" alt={job.company_name} />
        )}
      </div>

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          <MapPinIcon /> {job.location}
        </div>
        <div className="flex gap-2">
          <Briefcase /> {job.applications?.length || 0} Applicants
        </div>
        {formattedDeadline && (
          <div className="flex gap-2">
            <CalendarIcon />
            <span className={hasExpired ? "text-red-500" : ""}>
              Deadline: {formattedDeadline}
              {hasExpired && " (Expired)"}
            </span>
          </div>
        )}
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold">About the job</h2>
      <p className="sm:text-lg">{job.description}</p>

      {job.requirements && (
        <>
          <h2 className="text-2xl sm:text-3xl font-bold">
            What we are looking for
          </h2>
          <MDEditor.Markdown
            source={job.requirements}
            className="bg-transparent sm:text-lg"
          />
        </>
      )}

      {/* Application Requirements Section */}
      {job.application_requirements?.length > 0 && (
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
            <ClipboardListIcon /> Application Requirements
          </h2>
          <ul className="list-disc list-inside space-y-2">
            {job.application_requirements.map((req, index) => (
              <li key={index} className="text-lg">
                {req.type}
                {req.allowMultiple && " (Multiple files allowed)"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add the apply button for candidates */}
      {user?.unsafeMetadata?.role === "candidate" && !hasExpired && (
        <div className="mt-4">
          <ApplyJobButton 
            job={job} 
            onSuccess={() => {
              // Refresh job data after successful application
              fetchJob(params.id);
            }}
          />
        </div>
      )}

      {/* Show expired message if applicable */}
      {hasExpired && (
        <div className="mt-4 text-red-500 font-semibold text-center">
          This job posting has expired
        </div>
      )}
    </div>
  );
};

export default JobPage;