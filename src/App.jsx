import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from './layouts/app-layout'
import LandingPage from './pages/landing'
import { ThemeProvider } from './components/theme-provider'
import JobListingPage from './pages/job-listing'
import SavedJobPage from './pages/saved-job'
import ProtectedRoute from './components/protected-route'
import { ToastProvider } from "@/components/ui/toast"
import ErrorBoundary from '@/components/ErrorBoundary'
import BlogPage from '@/pages/blog'
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Routes, Route } from 'react-router-dom';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage/>
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
        path: '/saved-job',
        element: (
          <ProtectedRoute>
            <SavedJobPage/>
          </ProtectedRoute>
        )
      },
      {
        path: '/blog',
        element: <BlogPage />,
      },
      {
        path: '/sign-in/*',
        element: (
          <div className="flex justify-center items-center min-h-screen">
            <SignIn routing="path" path="/sign-in" redirectUrl="/" />
          </div>
        ),
      },
      {
        path: '/sign-up/*',
        element: (
          <div className="flex justify-center items-center min-h-screen">
            <SignUp routing="path" path="/sign-up" redirectUrl="/job-listing" />
          </div>
        ),
      }
    ]
  }
])

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <RouterProvider router={router} />
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
