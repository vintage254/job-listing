import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useUser } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { applyToJob } from '@/api/apiApplication';
import { BarLoader } from "react-spinners";

export function ApplyJobButton({ job, onSuccess }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken({ template: "supabase" });
      const formData = new FormData();
      formData.append('job_id', job.id);
      formData.append('candidate_id', user.id);
      formData.append('candidate_name', user.fullName);
      formData.append('candidate_email', user.primaryEmailAddress.emailAddress);

      // Append each required file
      job.application_requirements?.forEach(req => {
        if (files[req.type]) {
          formData.append(req.type, files[req.type]);
        }
      });

      await applyToJob(formData, token);

      toast({
        title: "Success",
        description: "Application submitted successfully",
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error applying:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (requirement, e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({
        ...prev,
        [requirement]: file
      }));
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Apply Now</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Apply for {job.title}</DrawerTitle>
          <DrawerDescription>
            Please provide the required documents
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {job.application_requirements?.map((req, index) => (
            <div key={index} className="space-y-2">
              <label className="block text-sm font-medium">
                {req.type}
                {req.allowMultiple && " (Multiple files allowed)"}
              </label>
              <Input
                type="file"
                onChange={(e) => handleFileChange(req.type, e)}
                required
                multiple={req.allowMultiple}
                accept={
                  req.type === 'Resume' ? '.pdf,.doc,.docx' :
                  req.type === 'Portfolio' ? '.pdf,.zip,.rar' :
                  undefined
                }
              />
            </div>
          ))}

          {loading && <BarLoader width={"100%"} color="#36d7b7" />}

          <DrawerFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
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