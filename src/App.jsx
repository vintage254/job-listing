import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from './layouts/app-layout'
import LandingPage from './pages/landing'
import OnboardingPage from './pages/onboarding'


const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage/>
      },

      {
        path: '/onboarding',
        element: <OnboardingPage/>
      },

      {
        path: '/job-listing',
        element: <JobListingPage/>
      },
      {
        path: '/job',
        element: <JobPage/>
      },
      {
        path: '/onboarding',
        element: <MyJobsPage/>
      },
      {
        path: '/post-job',
        element: <PostJobPage/>
      },
      {
        path: '/saved-job',
        element: <SavedJobPage/>
      }
    ]
  }
])
function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App
