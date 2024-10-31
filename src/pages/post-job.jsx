import { addNewJob } from '@/api/apijobs';
import { getCompanies } from '@/api/apiCompanies';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/use-fetch';
import { useUser } from '@clerk/clerk-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MDEditor from '@uiw/react-md-editor';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, Navigate } from 'react-router-dom';
import { BarLoader } from 'react-spinners';
import { z } from 'zod';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import AddCompanyDrawer from "@/components/ui/add-company-drawer";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, XCircle } from "lucide-react";

// Define the schema
const schema = z.object({
  title: z.string().min(1, {message: 'Title is required'}),
  description: z.string().min(1, {message: 'Description is required'}),
  location: z.string().min(1, { message: 'Location is required' }),
  company_id: z.string().min(1, { message: 'Select or Add a company' }),
  requirements: z.string().min(1, {message: "Requirements are required"}),
  application_deadline: z.string().min(1, {message: "Application deadline is required"})
});

// Define default requirements
const defaultRequirements = [
  { type: 'Resume', allowMultiple: false, isCustom: false },
  { type: 'Cover Letter', allowMultiple: false, isCustom: false },
  { type: 'Portfolio', allowMultiple: true, isCustom: false },
  { type: 'References', allowMultiple: true, isCustom: false },
  { type: 'Work Samples', allowMultiple: true, isCustom: false }
];

const PostJobPage = () => {
  const { isLoaded, user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customRequirement, setCustomRequirement] = useState('');
  const [selectedRequirements, setSelectedRequirements] = useState([
    { type: 'Resume', allowMultiple: false, isCustom: false }
  ]);

  const { register, control, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      company_id: '',
      requirements: '',
      application_deadline: ''
    }
  });

  const { fn: fncompanies, data: companies, loading: loadingCompanies } = useFetch(getCompanies);

  useEffect(() => {
    if (isLoaded) fncompanies();
  }, [isLoaded]);

  const {
    loading: LoadingCreateJob,
    fn: fnCreateJob,
  } = useFetch(addNewJob);

  const onSubmit = async (data) => {
    try {
      console.log('Form data:', data); // Debug log

      const jobData = {
        ...data,
        recruiter_id: user?.id,
        application_requirements: selectedRequirements,
        is_open: true
      };

      console.log('Submitting job data:', jobData); // Debug log

      const result = await fnCreateJob(jobData);
      console.log('Job creation result:', result); // Debug log

      toast({
        title: "Success",
        description: "Job posted successfully",
      });

      navigate('/my-jobs');
    } catch (error) {
      console.error('Error creating job:', error); // Debug log
      toast({
        title: "Error",
        description: error.message || "Failed to post job",
        variant: "destructive",
      });
    }
  };

  // Add the missing handler functions
  const handleAddCustomRequirement = () => {
    if (customRequirement.trim()) {
      setSelectedRequirements(prev => [
        ...prev,
        { 
          type: customRequirement.trim(), 
          allowMultiple: true, 
          isCustom: true 
        }
      ]);
      setCustomRequirement('');
    }
  };

  const handleRemoveRequirement = (index) => {
    setSelectedRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleMultiple = (index) => {
    setSelectedRequirements(prev => prev.map((req, i) => 
      i === index ? { ...req, allowMultiple: !req.allowMultiple } : req
    ));
  };

  if (!isLoaded || loadingCompanies) {
    return <BarLoader className='mb-4' width={'100%'} color="#36d7b7" />;
  }

  if (user?.unsafeMetadata?.role !== "recruiter") {
    return <Navigate to="/job-listing" />;
  }

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h1 className='gradient-title font-extrabold text-5xl sm:text-7xl text-center pb-8'>
        Post a Job
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-4 pb-0'>
        <Input 
          placeholder='Job Title' 
          {...register('title')} 
          className="text-black dark:text-white text-lg p-3"
        />
        {errors.title && <p className='text-red-500'>{errors.title.message}</p>}

        <Textarea 
          placeholder='Job Description' 
          {...register('description')} 
          className="text-black dark:text-white min-h-[150px]"
        />
        {errors.description && <p className='text-red-500'>{errors.description.message}</p>}

        <div className='flex gap-4 items-center'>
          <div className="flex-1">
            <Input
              placeholder="Job Location"
              {...register('location')}
              className="text-black dark:text-white"
            />
          </div>
          
          <div className="flex-1">
            <Controller 
              control={control} 
              name='company_id' 
              render={({ field }) => (
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {companies?.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          
          <AddCompanyDrawer fetchCompanies={fncompanies} />
        </div>
        {errors.location && (<p className='text-red-500'>{errors.location.message}</p>)}
        {errors.company_id && (<p className='text-red-500'>{errors.company_id.message}</p>)}
        
        <Controller 
          control={control} 
          name='requirements' 
          render={({ field }) => (
            <MDEditor 
              value={field.value} 
              onChange={field.onChange}
              preview="edit"
              className="min-h-[200px]"
            />
          )}
        />
        {errors.requirements && (<p className='text-red-500'>{errors.requirements.message}</p>)}

        <Input
          type="date"
          {...register('application_deadline')}
          className="text-black dark:text-white"
        />
        {errors.application_deadline && (
          <p className='text-red-500'>{errors.application_deadline.message}</p>
        )}

        {/* Application Requirements Section */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Application Requirements</label>
          
          {/* Default Requirements Dropdown */}
          <Select
            onValueChange={(value) => {
              const requirement = defaultRequirements.find(r => r.type === value);
              if (requirement && !selectedRequirements.find(r => r.type === value)) {
                setSelectedRequirements(prev => [...prev, { ...requirement }]);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add Requirement" />
            </SelectTrigger>
            <SelectContent>
              {defaultRequirements.map((req) => (
                <SelectItem 
                  key={req.type} 
                  value={req.type}
                  disabled={selectedRequirements.some(r => r.type === req.type)}
                >
                  {req.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom Requirement Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom requirement"
              value={customRequirement}
              onChange={(e) => setCustomRequirement(e.target.value)}
              className="flex-1"
            />
            <Button 
              type="button"
              onClick={handleAddCustomRequirement}
              disabled={!customRequirement.trim()}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Selected Requirements List */}
          <div className="space-y-2 mt-2">
            {selectedRequirements.map((req, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <span>{req.type}</span>
                  {req.isCustom && <span className="text-xs text-blue-500">(Custom)</span>}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">
                    <input
                      type="checkbox"
                      checked={req.allowMultiple}
                      onChange={() => handleToggleMultiple(index)}
                      className="mr-2"
                    />
                    Allow Multiple
                  </label>
                  {(req.isCustom || index > 0) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRequirement(index)}
                    >
                      <XCircle className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {LoadingCreateJob && <BarLoader className='mb-4' width={'100%'} color="#36d7b7" />}
        <Button type="submit" variant="blue" size="lg" className="mt-2">
          Post Job
        </Button>
      </form>
    </div>
  );
};

export default PostJobPage;