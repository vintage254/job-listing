import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateApplicationStatus } from '@/api/apiApplication';
import { useToast } from "@/components/ui/use-toast";

const ApplicationDetails = ({ application, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      await updateApplicationStatus(application.id, newStatus);
      onStatusUpdate();
      toast({
        title: "Success",
        description: "Application status updated successfully",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'reviewing': return 'bg-blue-500';
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">Application from {application.candidate_name}</h3>
          <p className="text-sm text-gray-500">
            Applied on {new Date(application.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge className={getStatusColor(application.status)}>
          {application.status}
        </Badge>
      </div>

      {application.resume_url && (
        <div>
          <h4 className="font-medium mb-2">Resume</h4>
          <a 
            href={application.resume_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View Resume
          </a>
        </div>
      )}

      {application.cover_letter && (
        <div>
          <h4 className="font-medium mb-2">Cover Letter</h4>
          <p className="text-gray-700 dark:text-gray-300">{application.cover_letter}</p>
        </div>
      )}

      {application.portfolio_url && (
        <div>
          <h4 className="font-medium mb-2">Portfolio</h4>
          <a 
            href={application.portfolio_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View Portfolio
          </a>
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <Select
          value={application.status}
          onValueChange={handleStatusChange}
          disabled={loading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Update Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => window.location.href = `mailto:${application.candidate_email}`}
        >
          Contact Candidate
        </Button>
      </div>
    </Card>
  );
};

export default ApplicationDetails; 