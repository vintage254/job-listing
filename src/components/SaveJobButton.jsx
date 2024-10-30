import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { BookmarkIcon } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { toggleSaveJob } from '@/api/apijobs';
import { useToast } from "@/components/ui/use-toast";

const SaveJobButton = ({ jobId, initialSaved = false, jobData }) => {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isSignedIn } = useUser();
  const { toast } = useToast();

  const handleSaveJob = async () => {
    if (!isSignedIn || !user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save jobs",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await toggleSaveJob(user.id, jobId, isSaved, jobData);
      setIsSaved(!isSaved);
      
      toast({
        title: isSaved ? "Job unsaved" : "Job saved",
        description: isSaved ? "Job removed from saved jobs" : "Job added to saved jobs",
      });
    } catch (error) {
      console.error('Error toggling job save:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save/unsave job",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSaveJob}
      disabled={isLoading}
      className={`${isSaved ? 'text-blue-500' : 'text-gray-500'} transition-colors`}
    >
      <BookmarkIcon className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
    </Button>
  );
};

export default SaveJobButton; 