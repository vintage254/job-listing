import Header from "@/components/header";
import { Outlet } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";

const AppLayout = () => {
  const { isLoaded, user } = useUser();

  return (
    <div>
      <div className="grid-background"></div>
      <main className="min-h-screen container">
        <Header />
        <Outlet />
      </main>
      <div className="p-10 text-center bg-gray-800 mt-10">
        made by Derrick Njuguna @2024
      </div>
      <div className="flex items-center gap-4">
        {user?.unsafeMetadata?.role === "recruiter" && (
          <>
            <Link to="/post-job">
              <Button>Post a Job</Button>
            </Link>
            <Link to="/my-jobs">
              <Button variant="outline">My Jobs</Button>
            </Link>
            <NotificationBell />
          </>
        )}
        {/* ... other navigation items */}
      </div>
    </div>
  );
};

export default AppLayout;