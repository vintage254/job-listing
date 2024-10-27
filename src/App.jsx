import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from './layouts/app-layout'
import LandingPage from './pages/landing'
import OnboardingPage from './pages/onboarding'
import { ThemeProvider } from './components/theme-provider'
import JobListingPage from './pages/job-listing'
import JobPage from './pages/job'
import MyJobsPage from './pages/my-jobs'
import PostJobPage from './pages/post-job'
import SavedJobPage from './pages/saved-job'


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
        path: '/job',
        element: <JobListingPage/>
      },
      {
        path: '/job/:id',
        element: <JobPage/>
      },
      {
        path: '/my-jobs',
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
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
