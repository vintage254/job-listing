import supabaseClient, { supabaseUrl } from "@/utils/supabase";

// - Apply to job ( candidate )
export async function applyToJob(token, _, jobData) {
  const supabase = await supabaseClient(token);

  const random = Math.floor(Math.random() * 90000);
  const fileName = `resume-${random}-${jobData.candidate_id}`;

  const { error: storageError } = await supabase.storage
    .from("resumes")
    .upload(fileName, jobData.resume);

  if (storageError) throw new Error("Error uploading Resume");

  const resume = `${supabaseUrl}/storage/v1/object/public/resumes/${fileName}`;

  const { data, error } = await supabase
    .from("applications")
    .insert([
      {
        ...jobData,
        resume,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error submitting Application");
  }

  return data;
}

// - Edit Application Status ( recruiter )
export async function updateApplicationStatus(token, { job_id }, status) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("job_id", job_id)
    .select();

  if (error || data.length === 0) {
    console.error("Error Updating Application Status:", error);
    return null;
  }

  return data;
}

// Get applications for a candidate
export async function getApplications(token, { user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .select("*, job:jobs(title, company:companies(name))")
    .eq("candidate_id", user_id);

  if (error) {
    console.error("Error fetching Applications:", error);
    return null;
  }

  return data;
}

// Add helper function to check if user has already applied
export async function checkApplicationExists(token, { job_id, user_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", job_id)
    .eq("candidate_id", user_id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
    console.error("Error checking application:", error);
    return null;
  }

  return !!data;
}

// Get application details
export async function getApplicationDetails(token, { application_id }) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      job:jobs(
        title,
        company:companies(name, logo_url)
      )
    `)
    .eq("id", application_id)
    .single();

  if (error) {
    console.error("Error fetching application details:", error);
    return null;
  }

  return data;
}

// Add candidate requirements
export const addCandidateRequirements = async (requirementsData) => {
  try {
    const { data, error } = await supabase
      .from('candidate_requirements')
      .insert([requirementsData])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding requirements:', error);
    throw error;
  }
};

// Get candidate requirements for a job
export const getCandidateRequirements = async (jobId) => {
  try {
    const { data, error } = await supabase
      .from('candidate_requirements')
      .select('*')
      .eq('job_id', jobId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching requirements:', error);
    throw error;
  }
};

// Contact candidate
export const contactCandidate = async (requirementId, message) => {
  try {
    // Update requirement status
    const { data: requirement, error: reqError } = await supabase
      .from('candidate_requirements')
      .update({ recruiter_contacted: true })
      .eq('id', requirementId)
      .select()
      .single();

    if (reqError) throw reqError;

    // Create notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert([{
        user_id: requirement.candidate_id,
        title: 'Recruiter Contact',
        message: message,
        type: 'recruiter_contact'
      }]);

    if (notifError) throw notifError;

    return requirement;
  } catch (error) {
    console.error('Error contacting candidate:', error);
    throw error;
  }
};

// Get user notifications
export const getUserNotifications = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}; 