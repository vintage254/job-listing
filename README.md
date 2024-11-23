# Job Board Application
https://keajiralink.co.ke
![AJIRA](https://github.com/user-attachments/assets/69182392-9245-4e31-baad-a1051e3bdfb0)

A modern job board application built with React, Vite, and Supabase, featuring external job API integration and user authentication.

## Features

### Job Search & Listing
- Real-time job search with filters
- Location-based job filtering
- Pagination support
- Job caching for improved performance
- Integration with JSearch API for comprehensive job listings

### Authentication & User Features
- Secure authentication using Clerk
- Protected routes for authenticated users
- User profile management
- Save/bookmark favorite jobs
- View saved jobs history

### Technical Features
- Supabase database integration
- Job data caching system
- Rate limiting for API calls
- Error handling and recovery
- Responsive design
- Toast notifications for user feedback

## Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- Shadcn/ui components
- React Router DOM
- Axios for API calls

### Backend & Services
- Supabase (Database)
- Clerk (Authentication)
- JSearch API (External Job Data)
- Vercel (Deployment)

### State Management & Data Handling
- React Hooks
- Custom caching system
- Local storage management

## Environment Setup

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAPIDAPI_KEY=your_jsearch_api_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/job-board.git
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

## Database Schema

### cached_jobs
- query_key (TEXT)
- job_data (JSONB)
- cached_at (TIMESTAMP)
- expires_at (TIMESTAMP)

### saved_jobs
- user_id (TEXT)
- job_id (TEXT)
- job_data (JSONB)
- saved_at (TIMESTAMP)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ❤️ in Kenya
