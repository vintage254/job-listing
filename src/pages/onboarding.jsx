import React from 'react';

const OnboardingPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Complete Your Profile</h1>
        
        <form className="space-y-6">
          {/* Personal Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email" 
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input 
                type="tel" 
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </section>

          {/* Professional Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Professional Information</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Current Job Title</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Years of Experience</label>
              <select className="w-full p-2 border rounded-md">
                <option value="">Select experience</option>
                <option value="0-1">0-1 years</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5+">5+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Skills</label>
              <textarea 
                className="w-full p-2 border rounded-md"
                placeholder="Enter your skills (separated by commas)"
                rows="3"
              />
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage; 