import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { editJob, getSingleJob } from '@/api/apijobs';
import useFetch from '@/hooks/use-fetch';
import { PostJobForm } from '@/components/post-job-form';
import { BarLoader } from "react-spinners";
import { useToast } from "@/components/ui/use-toast";

const EditJobPage = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    loading: loadingJob,
    data: job,
    fn: fetchJob,
    error: jobError
  } = useFetch(getSingleJob);

  useEffect(() => {
    if (isLoaded && id) {
      fetchJob(id);
    }
  }, [isLoaded, id]);

  const handleSubmit = async (data) => {
    try {
      await editJob(id, user.id, {
        ...data,
        application_deadline: new Date(data.application_deadline).toISOString()
      });
      
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      navigate(`/job/${id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update job",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded || loadingJob) {
    return <BarLoader className='mb-4' width={'100%'} color="#36d7b7" />;
  }

  if (!id) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500">No job ID provided</h2>
        <button 
          onClick={() => navigate('/my-jobs')} 
          className="mt-4 text-blue-500 hover:underline"
        >
          Back to My Jobs
        </button>
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500">Error loading job</h2>
        <p className="mt-2">{jobError.message}</p>
        <button 
          onClick={() => navigate('/my-jobs')} 
          className="mt-4 text-blue-500 hover:underline"
        >
          Back to My Jobs
        </button>
      </div>
    );
  }

  if (!job || job.recruiter_id !== user.id) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Job not found or unauthorized</h2>
        <button 
          onClick={() => navigate('/my-jobs')} 
          className="mt-4 text-blue-500 hover:underline"
        >
          Back to My Jobs
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className='gradient-title font-extrabold text-5xl sm:text-7xl text-center pb-8'>
        Edit Job
      </h1>
      <PostJobForm
        defaultValues={{
          title: job.title,
          description: job.description,
          location: job.location,
          company_id: job.company_id,
          requirements: job.requirements,
          application_deadline: job.application_deadline ? 
            new Date(job.application_deadline).toISOString().split('T')[0] : '',
          application_requirements: job.application_requirements || ['Resume']
        }}
        onSubmit={handleSubmit}
        isLoading={loadingJob}
      />
    </div>
  );
};

export default EditJobPage;