import { useEffect, useState } from 'react';
import { useUser } from "@clerk/clerk-react";
import { getMyJobs, deleteJob } from '@/api/apijobs';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarLoader } from "react-spinners";
import { Trash2Icon, PencilIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CreatedJobs = () => {
  const { user } = useUser();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadJobs = async () => {
    try {
      setLoading(true);
      const jobsData = await getMyJobs(user.id);
      setJobs(jobsData);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob(jobId, user.id);
        loadJobs(); // Reload jobs after deletion
        toast({
          title: "Success",
          description: "Job deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting job:', error);
        toast({
          title: "Error",
          description: "Failed to delete job",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return <BarLoader width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="space-y-6">
      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold">No jobs created yet</h3>
          <Link to="/post-job">
            <Button className="mt-4">Post a Job</Button>
          </Link>
        </div>
      ) : (
        jobs.map((job) => (
          <Card key={job.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-4">
                  {job.company_logo && (
                    <img 
                      src={job.company_logo} 
                      alt={job.company_name} 
                      className="h-12 w-12 object-contain"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <p className="text-gray-500">{job.company_name}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    {job.location} • {job.job_type}
                  </p>
                  <p className="text-green-600 dark:text-green-400 mt-2">
                    {job.salary_range}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link to={`/edit-job/${job.id}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-500"
                  >
                    <PencilIcon />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteJob(job.id)}
                  className="text-red-500"
                >
                  <Trash2Icon />
                </Button>
                <Link to={`/job/${job.id}`}>
                  <Button>View Details</Button>
                </Link>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Applications: {job.applications?.length || 0}
              </p>
              {job.application_deadline && (
                <p className="text-sm text-gray-500">
                  Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default CreatedJobs;