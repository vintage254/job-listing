import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Fetch Companies
export async function getCompanies() {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching Companies:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching Companies:", error);
    return null;
  }
}

// Add Company
export async function addNewCompany(_, companyData) {
  try {
    // Generate a unique ID for the company
    const companyId = `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // First, upload the logo
    const random = Math.floor(Math.random() * 90000);
    const fileName = `logo-${random}-${companyData.name.replace(/\s+/g, '-').toLowerCase()}`;
    const fileExt = companyData.logo.name.split('.').pop();
    const fullFileName = `${fileName}.${fileExt}`;

    const { error: storageError } = await supabase.storage
      .from("company-logo")
      .upload(fullFileName, companyData.logo, {
        cacheControl: '3600',
        upsert: false,
        contentType: companyData.logo.type
      });

    if (storageError) {
      console.error("Storage Error:", storageError);
      throw new Error("Error uploading Company Logo");
    }

    // Get the public URL for the uploaded logo
    const { data: { publicUrl } } = supabase.storage
      .from("company-logo")
      .getPublicUrl(fullFileName);

    // Then create the company record
    const { data, error } = await supabase
      .from("companies")
      .insert([
        {
          id: companyId,
          name: companyData.name,
          logo_url: publicUrl,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error("Database Error:", error);
      throw new Error("Error creating company record");
    }

    return data;
  } catch (error) {
    console.error("Error in addNewCompany:", error);
    throw error;
  }
}