import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MDEditor from '@uiw/react-md-editor';
import { BarLoader } from 'react-spinners';
import AddCompanyDrawer from '@/components/ui/add-company-drawer';
import useFetch from '@/hooks/use-fetch';
import { getCompanies } from '@/api/apiCompanies';

const schema = z.object({
  title: z.string().min(1, {message: 'Title is required'}),
  description: z.string().min(1, {message: 'Description is required'}),
  location: z.string().min(1, { message: 'Location is required' }),
  company_id: z.string().min(1, { message: 'select or Add a new company' }),
  requirements: z.string().min(1, {message: "Requirements are required"}),
  application_deadline: z.string().min(1, {message: "Application deadline is required"}),
  application_requirements: z.array(z.string()).min(1, {message: "At least one application requirement is needed"}),
});

export function PostJobForm({ defaultValues, onSubmit, isLoading }) {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues || {
      title: '',
      description: '',
      location: '',
      company_id: '',
      requirements: '',
      application_deadline: '',
      application_requirements: ['Resume'],
    },
    resolver: zodResolver(schema),
  });

  const { fn: fncompanies, data: companies, loading: loadingCompanies } = useFetch(getCompanies);

  useEffect(() => {
    fncompanies();
  }, []);

  // Get minimum date (today)
  const minDate = new Date().toISOString().split('T')[0];

  if (loadingCompanies) {
    return <BarLoader className='mb-4' width={'100%'} color="#36d7b7" />;
  }

  return (
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

      {/* Application Deadline */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Application Deadline</label>
        <Input
          type="date"
          min={minDate}
          {...register('application_deadline')}
          className="text-black dark:text-white"
        />
        {errors.application_deadline && (
          <p className='text-red-500'>{errors.application_deadline.message}</p>
        )}
      </div>

      {/* Application Requirements */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Application Requirements</label>
        <Controller
          name="application_requirements"
          control={control}
          render={({ field }) => (
            <Select
              multiple
              value={field.value}
              onChange={field.onChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Requirements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Resume">Resume</SelectItem>
                <SelectItem value="Cover Letter">Cover Letter</SelectItem>
                <SelectItem value="Portfolio">Portfolio</SelectItem>
                <SelectItem value="References">References</SelectItem>
                <SelectItem value="Work Samples">Work Samples</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.application_requirements && (
          <p className='text-red-500'>{errors.application_requirements.message}</p>
        )}
      </div>

      {isLoading && <BarLoader className='mb-4' width={'100%'} color="#36d7b7" />}
      <Button type="submit" variant="blue" size="lg" className="mt-2">
        {defaultValues ? 'Update Job' : 'Post Job'}
      </Button>
    </form>
  );
} 