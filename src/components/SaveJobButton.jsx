import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookmarkIcon } from "lucide-react";
import { toggleSaveJob } from "@/api/apijobs";
import { useToast } from "@/components/ui/use-toast";
import { useUser, useAuth } from "@clerk/clerk-react";

const SaveJobButton = ({ jobId, initialSaved, jobData }) => {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  const handleSaveJob = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save jobs",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const token = await getToken({ template: "supabase" });
      
      if (!token) {
        throw new Error("Authentication failed");
      }

      const jobDataWithId = {
        ...jobData,
        id: jobId || jobData.id || `job_${Date.now()}`
      };

      const result = await toggleSaveJob(
        user.id, 
        jobDataWithId, 
        token
      );
      
      setIsSaved(result.saved);
      
      toast({
        title: result.saved ? "Job Saved" : "Job Removed",
        description: result.saved 
          ? "Job has been saved to your list" 
          : "Job has been removed from your saved list",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error toggling job save:', error);
      toast({
        title: "Error",
        description: "Failed to save job. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleSaveJob}
      disabled={isLoading}
      className={`transition-colors duration-200 ${
        isSaved 
          ? "text-blue-500 hover:text-blue-600" 
          : "text-gray-500 hover:text-gray-600"
      }`}
      title={isSaved ? "Remove from saved jobs" : "Save job"}
    >
      <BookmarkIcon 
        className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} 
        fill={isSaved ? "currentColor" : "none"}
      />
    </Button>
  );
};

export default SaveJobButton;