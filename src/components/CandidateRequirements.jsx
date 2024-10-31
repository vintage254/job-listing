import { useState } from 'react';
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { addCandidateRequirements } from '@/api/apiApplication';

export function CandidateRequirements({ jobId, job, onSuccess }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState({
    experience: '',
    skills: '',
    portfolio_url: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addCandidateRequirements({
        job_id: jobId,
        candidate_id: user.id,
        candidate_name: user.fullName,
        candidate_email: user.primaryEmailAddress.emailAddress,
        ...requirements
      });

      toast({
        title: "Success",
        description: "Your requirements have been submitted",
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting requirements:', error);
      toast({
        title: "Error",
        description: "Failed to submit requirements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Submit Requirements</Button>
      </DrawerTrigger>
      <DrawerContent>
        <form onSubmit={handleSubmit}>
          <DrawerHeader>
            <DrawerTitle>Submit Your Requirements</DrawerTitle>
            <DrawerDescription>
              Help recruiters understand your qualifications better
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Years of Experience</label>
              <Input
                type="number"
                value={requirements.experience}
                onChange={(e) => setRequirements(prev => ({
                  ...prev,
                  experience: e.target.value
                }))}
                placeholder="Years of experience"
                min="0"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Skills</label>
              <Textarea
                value={requirements.skills}
                onChange={(e) => setRequirements(prev => ({
                  ...prev,
                  skills: e.target.value
                }))}
                placeholder="List your relevant skills"
              />
            </div>

            {job?.application_requirements?.includes('Portfolio') && (
              <div>
                <label className="text-sm font-medium">Portfolio URL</label>
                <Input
                  type="url"
                  value={requirements.portfolio_url}
                  onChange={(e) => setRequirements(prev => ({
                    ...prev,
                    portfolio_url: e.target.value
                  }))}
                  placeholder="Link to your portfolio"
                  required
                />
              </div>
            )}

            {job?.application_requirements?.includes('Resume') && (
              <div>
                <label className="text-sm font-medium">Resume</label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setRequirements(prev => ({
                    ...prev,
                    resume: e.target.files[0]
                  }))}
                  required
                />
              </div>
            )}
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Requirements"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
} 