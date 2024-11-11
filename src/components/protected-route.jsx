import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LockIcon } from "lucide-react";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue",
        variant: "destructive",
        duration: 3000,
        className: "z-50",
      });
    }
  }, [isLoaded, isSignedIn, toast]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex justify-center">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <LockIcon className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Access Restricted
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300">
            Please sign in or sign up to access this content. Create an account to unlock all features.
          </p>

          <div className="pt-4">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            This is a protected area. Authentication is required to continue.
          </div>
        </Card>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;