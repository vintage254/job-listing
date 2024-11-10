import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserButton, useUser } from "@clerk/clerk-react";
import LogoSvg from "./LogoSvg";

const Header = () => {
  const { user, isLoaded } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="font-bold text-xl"><LogoSvg className="h-8 sm:h-8 lg:h-8" /></Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          <Link to="/job-listing" className="text-sm font-medium hover:underline">
            Jobs
          </Link>
          <Link to="/blog" className="text-sm font-medium hover:underline">
            Trending News Articles
          </Link>
          {isLoaded ? (
            user ? (
              <div className="flex items-center gap-4">
                <Link to="/saved-job" className="text-sm font-medium hover:underline">
                  Saved Jobs
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <Link to="/sign-in">
                <Button>Sign In</Button>
              </Link>
            )
          ) : null}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};

export default Header;