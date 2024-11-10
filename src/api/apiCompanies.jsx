import supabaseClient, { supabaseUrl } from "@/utils/supabase";

// Fetch Companies
export async function getCompanies(token) {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    const supabase = await supabaseClient(token);
    const { data, error } = await supabase.from("companies").select("*");

    if (error) {
      console.error("Error fetching Companies:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getCompanies:", error);
    throw error;
  }
}

// Add Company
export async function addNewCompany({ name, logo }, token) {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    if (!name || !logo) {
      throw new Error("Company name and logo are required");
    }

    const supabase = await supabaseClient(token);

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 90000);
    const safeFileName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileName = `company_logos/${timestamp}-${random}-${safeFileName}`;

    // Upload logo with proper content type
    const { error: storageError, data: storageData } = await supabase.storage
      .from("company-logo")
      .upload(fileName, logo, {
        contentType: logo.type,
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) {
      console.error("Storage error:", storageError);
      throw new Error(storageError.message || "Error uploading Company Logo");
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("company-logo")
      .getPublicUrl(fileName);

    // Create company record
    const { data, error: dbError } = await supabase
      .from("companies")
      .insert([{
        name: name,
        logo_url: publicUrl,
        created_at: new Date().toISOString()
      }])
      .select();

    if (dbError) {
      // If database insert fails, try to clean up the uploaded file
      await supabase.storage
        .from("company-logo")
        .remove([fileName]);
      
      console.error("Database error:", dbError);
      throw new Error(dbError.message || "Error creating company");
    }

    return data;
  } catch (error) {
    console.error("Error in addNewCompany:", error);
    throw error;
  }
}