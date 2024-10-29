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
import ProtectedRoute from './components/protected-route'


const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage/>
      },

      {
        path: "/onboarding",
        element: (
          <ProtectedRoute>
            <OnboardingPage/>
          </ProtectedRoute>
        ),
      },

      {
        path: '/job-listing',
        element: (
          <ProtectedRoute>
            <JobListingPage/>
          </ProtectedRoute>
        )
      },
      {
        
        path: '/job/:id',
        element: (
          <ProtectedRoute>
            <JobPage/>
          </ProtectedRoute>
        )
      },
      {
        path: '/my-jobs',
        element: (
          <ProtectedRoute>
            <MyJobsPage/>
          </ProtectedRoute>
        )
      },
      {
        path: '/post-job',
        element: (
          <ProtectedRoute>
            <PostJobPage/>
          </ProtectedRoute>
        )
      },
      {
        path: '/saved-job',
        element: (
          <ProtectedRoute>
            <SavedJobPage/>
          </ProtectedRoute>
        )
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
