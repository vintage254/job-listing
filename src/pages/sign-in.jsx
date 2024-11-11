import { useNavigate, useLocation } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";

const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn 
        afterSignInUrl={(location.state?.from || "/job-listing")}
        routing="path"
        path="/sign-in"
      />
    </div>
  );
};

export default SignInPage; 