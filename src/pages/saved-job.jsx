import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { getSavedJobs } from "@/api/apijobs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SaveJobButton from "@/components/SaveJobButton";
import { BarLoader } from "react-spinners";

const SavedJobPage = () => {
  const { user } = useUser();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedJobs = async () => {
      if (user) {
        try {
          setLoading(true);
          const jobs = await getSavedJobs(user.id);
          setSavedJobs(jobs);
        } catch (error) {
          console.error('Error loading saved jobs:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadSavedJobs();
  }, [user]);

  if (loading) {
    return <BarLoader width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Saved Jobs</h1>
      
      {savedJobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No saved jobs yet</p>
          <Link to="/job-listing">
            <Button className="mt-4">Browse Jobs</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedJobs.map((savedJob) => (
            <Card key={savedJob.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{savedJob.job.title}</h2>
                  <p className="text-gray-500">{savedJob.job.company_name}</p>
                </div>
                <div className="flex gap-2">
                  <SaveJobButton jobId={savedJob.job_id} initialSaved={true} />
                  <Link to={`/job/${savedJob.job_id}`}>
                    <Button>View Details</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobPage;