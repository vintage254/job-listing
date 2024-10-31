import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { BarLoader } from "react-spinners";
import supabaseClient from '@/utils/supabase';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Mail } from "lucide-react";
import useFetch from "@/hooks/use-fetch";

const ApplicantsPage = () => {
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();

  const {
    loading,
    data: applications,
    fn: fetchApplications,
    error
  } = useFetch(async () => {
    const token = await getToken({ template: "supabase" });
    const supabase = await supabaseClient(token);

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          company_name,
          recruiter_id,
          application_requirements
        )
      `)
      .eq('jobs.recruiter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('Full application data:', JSON.stringify(data, null, 2));
    if (data && data.length > 0) {
      console.log('First application files:', data[0].files);
    }
    
    return data;
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchApplications();
    }
  }, [isLoaded, user]);

  // Protected route check
  if (!isLoaded) {
    return <BarLoader className='mb-4' width={'100%'} color="#36d7b7" />;
  }

  // Redirect non-recruiters
  if (user?.unsafeMetadata?.role !== "recruiter") {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <BarLoader className='mb-4' width={'100%'} color="#36d7b7" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500">Error loading applications</h2>
        <p className="mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Job Applications</h1>

      {applications?.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">No applications yet</h2>
          <p className="text-gray-500 mt-2">When candidates apply to your jobs, they'll appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {applications?.map((application) => (
            <Card key={application.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">
                    {application.jobs?.title}
                  </h3>
                  <p className="text-gray-500">{application.jobs?.company_name}</p>
                </div>
                <div className="text-sm text-gray-500">
                  Applied on: {new Date(application.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Candidate Details</h4>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {application.candidate_name}</p>
                    <p><strong>Email:</strong> {application.candidate_email}</p>
                    <p><strong>Status:</strong> <span className="capitalize">{application.status}</span></p>
                  </div>
                </div>

                {/* Updated Documents section with better visibility */}
                <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Submitted Documents</h4>
                  {application.files && Object.keys(application.files).length > 0 ? (
                    <div className="grid gap-3">
                      {Object.entries(application.files).map(([type, url]) => (
                        <div key={type} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{type}</span>
                            {/* Add file type indicator */}
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {url.split('.').pop().toUpperCase()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {/* Preview button for PDFs */}
                            {url.toLowerCase().endsWith('.pdf') && (
                              <a 
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Button variant="outline" size="sm">
                                  Preview
                                </Button>
                              </a>
                            )}
                            {/* Download button */}
                            <a 
                              href={url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No documents submitted</p>
                  )}
                </div>

                {/* Contact section */}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = `mailto:${application.candidate_email}`}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Candidate
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicantsPage;
