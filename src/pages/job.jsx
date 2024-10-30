import { useEffect } from "react";
import { BarLoader } from "react-spinners";
import MDEditor from "@uiw/react-md-editor";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Briefcase, DoorClosed, DoorOpen, MapPinIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApplyJobDrawer } from "@/components/apply-job";
import ApplicationCard from "@/components/application-card";

import useFetch from "@/hooks/use-fetch";
import { getSingleJob, updateHiringStatus } from "@/api/apijobs";

const JobPage = () => {
  const { id } = useParams();
  const { isLoaded, user } = useUser();

  const {
    loading: loadingJob,
    data: job,
    fn: fnJob,
  } = useFetch(getSingleJob, {
    job_id: id?.toString(),
  });

  useEffect(() => {
    if (isLoaded && id) {
      fnJob(id.toString());
    }
  }, [isLoaded, id]);

  const { loading: loadingHiringStatus, fn: fnHiringStatus } = useFetch(
    updateHiringStatus,
    {
      job_id: id,
    }
  );

  const handleStatusChange = (value) => {
    // Only allow status change for internal jobs
    if (!job?.source) {
      const isOpen = value === "open";
      fnHiringStatus(isOpen).then(() => fnJob());
    }
  };

  if (!isLoaded || loadingJob) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  // Check if this is an external job
  const isExternalJob = job?.source && ['adzuna', 'findwork', 'reed', 'arbeitnow'].includes(job.source);

  return (
    <div className="flex flex-col gap-8 mt-5">
      <div className="flex flex-col-reverse gap-6 md:flex-row justify-between items-center">
        <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-6xl">
          {job?.title}
        </h1>
        {job?.company_logo && (
          <img src={job.company_logo} className="h-12" alt={job?.company_name} />
        )}
      </div>

      <div className="flex justify-between">
        <div className="flex gap-2">
          <MapPinIcon /> {job?.location}
        </div>
        {!isExternalJob && (
          <div className="flex gap-2">
            <Briefcase /> {job?.applications?.length} Applicants
          </div>
        )}
        {!isExternalJob && (
          <div className="flex gap-2">
            {job?.isOpen ? (
              <>
                <DoorOpen /> Open
              </>
            ) : (
              <>
                <DoorClosed /> Closed
              </>
            )}
          </div>
        )}
      </div>

      {!isExternalJob && job?.recruiter_id === user?.id && (
        <Select onValueChange={handleStatusChange}>
          <SelectTrigger
            className={`w-full ${job?.isOpen ? "bg-green-950" : "bg-red-950"}`}
          >
            <SelectValue
              placeholder={
                "Hiring Status " + (job?.isOpen ? "( Open )" : "( Closed )")
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      )}

      <h2 className="text-2xl sm:text-3xl font-bold">About the job</h2>
      <p className="sm:text-lg">{job?.description}</p>

      {job?.requirements && (
        <>
          <h2 className="text-2xl sm:text-3xl font-bold">
            What we are looking for
          </h2>
          <MDEditor.Markdown
            source={job?.requirements}
            className="bg-transparent sm:text-lg"
          />
        </>
      )}

      {!isExternalJob && job?.recruiter_id !== user?.id && (
        <ApplyJobDrawer
          job={job}
          user={user}
          fetchJob={fnJob}
          applied={job?.applications?.find((ap) => ap.candidate_id === user.id)}
        />
      )}

      {isExternalJob && (
        <a 
          href={job.external_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center"
        >
          Apply on {job.source}
        </a>
      )}

      {loadingHiringStatus && <BarLoader width={"100%"} color="#36d7b7" />}
      
      {!isExternalJob && job?.applications?.length > 0 && job?.recruiter_id === user?.id && (
        <div className="flex flex-col gap-2">
          <h2 className="font-bold mb-4 text-xl ml-1">Applications</h2>
          {job?.applications.map((application) => {
            return (
              <ApplicationCard key={application.id} application={application} />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobPage;