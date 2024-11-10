import { useState, useEffect } from 'react';
import { useUser, useAuth } from "@clerk/clerk-react";
import { getSavedJobs, deleteSavedJob } from '@/api/apijobs';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const SavedJobPage = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedJobs();
  }, [user]);

  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      const token = await getToken({ template: "supabase" });
      
      if (!token) {
        throw new Error("Authentication required");
      }

      const jobs = await getSavedJobs(user.id, token);
      setSavedJobs(jobs);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load saved jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJob = async (jobId) => {
    try {
      const token = await getToken({ template: "supabase" });
      
      if (!token) {
        throw new Error("Authentication required");
      }

      await deleteSavedJob(jobId, user.id, token);
      await loadSavedJobs(); // Reload the list
      
      toast({
        title: "Success",
        description: "Job removed from saved list",
      });
    } catch (error) {
      console.error('Error removing job:', error);
      toast({
        title: "Error",
        description: "Failed to remove job",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading saved jobs...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Saved Jobs</h1>
      {savedJobs.length === 0 ? (
        <p>No saved jobs found.</p>
      ) : (
        <div className="grid gap-4">
          {savedJobs.map((savedJob) => (
            <Card key={savedJob.id} className="shadow-md">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{savedJob.job_data.title}</h2>
                    <p className="text-gray-600">{savedJob.job_data.company_name}</p>
                    <p className="text-gray-500">{savedJob.job_data.location}</p>
                    <p className="mt-2">{savedJob.job_data.description?.slice(0, 200)}...</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(savedJob.job_data.url, '_blank')}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveJob(savedJob.job_id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobPage;