import supabaseClient from '@/utils/supabase';

export const applyToJob = async (formData, token) => {
  try {
    const supabase = await supabaseClient(token);
    const fileUrls = {};

    // First, handle file uploads for each application requirement
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        try {
          // Create a unique file path including the job ID and requirement type
          const timestamp = Date.now();
          const filePath = `${formData.get('job_id')}/${key}/${timestamp}_${value.name}`;

          console.log('Uploading file:', {
            type: key,
            name: value.name,
            path: filePath
          });

          // Upload to applications bucket
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('applications')
            .upload(filePath, value);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('applications')
            .getPublicUrl(filePath);

          // Store URL based on requirement type
          if (key.includes('_')) {
            // Handle multiple files for same requirement
            const [reqType] = key.split('_');
            if (!fileUrls[reqType]) {
              fileUrls[reqType] = [];
            }
            fileUrls[reqType].push(publicUrl);
          } else {
            fileUrls[key] = publicUrl;
          }

          console.log(`Uploaded ${key}:`, publicUrl);
        } catch (uploadError) {
          console.error(`Error uploading ${key}:`, uploadError);
          throw uploadError;
        }
      }
    }

    // Create application record with file URLs and other data
    const applicationData = {
      job_id: formData.get('job_id'),
      candidate_id: formData.get('candidate_id'),
      candidate_name: formData.get('name'),
      status: formData.get('status'),
      experience: formData.get('experience'),
      skills: formData.get('skills'),
      education: formData.get('education'),
      files: fileUrls, // Store all file URLs
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in applyToJob:', error);
    throw error;
  }
}; 