import CreatedJobs from '@/components/created-jobs';

const MyJobsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Posted Jobs</h1>
      <CreatedJobs />
    </div>
  );
};

export default MyJobsPage;
