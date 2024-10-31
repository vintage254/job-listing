import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { applyToJob } from '@/api/apiApplication';

export const ApplicationForm = ({ job, user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = {
        ...data,
        job_id: job.id,
        candidate_id: user.id,
        status: 'pending'
      };
      
      await applyToJob(formData);
      onSuccess();
    } catch (error) {
      console.error('Error applying:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {job.application_requirements.map((requirement) => (
        <div key={requirement} className="space-y-2">
          <label className="text-sm font-medium">{requirement}</label>
          {requirement === 'Resume' && (
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              {...register(requirement.toLowerCase(), { required: true })}
            />
          )}
          {requirement === 'Cover Letter' && (
            <Textarea
              {...register(requirement.toLowerCase(), { required: true })}
              placeholder="Write your cover letter here..."
            />
          )}
          {errors[requirement.toLowerCase()] && (
            <p className="text-red-500">{requirement} is required</p>
          )}
        </div>
      ))}
      
      <Button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Application'}
      </Button>
    </form>
  );
}; 