# Leave Management System - Project Summary

## Overview

A complete, production-ready leave management system built with separated frontend and backend architecture. The application allows employees to request leave, managers to approve/reject requests, and admins to manage employees and company holidays.

## What Was Built

### Backend (Express.js + PostgreSQL)
- REST API with JWT authentication
- 4 main API route groups: Auth, Employees, Leaves, Holidays
- Role-based access control (3 roles: admin, manager, employee)
- Database initialization script with test data
- Complete error handling and validation

**Files Created:**
- `backend/src/server.ts` - Express app entry point
- `backend/src/routes/` - 4 route files (auth, employees, leaves, holidays)
- `backend/src/middleware/` - Authentication and error handling
- `backend/src/db/` - Database connection and initialization script
- `backend/src/utils/` - JWT and password utilities
- `backend/src/types/` - TypeScript type definitions

### Frontend (Next.js 16 + React 19)
- Role-based UI with protected routes
- Authentication system with AuthContext
- 7 main pages: Login, Dashboard, Apply Leave, Manager Approvals, Admin Employees, Admin Holidays
- API integration with SWR for data fetching
- Responsive design with Tailwind CSS

**Files Created:**
- `app/page.tsx` - Home redirect page
- `app/login/page.tsx` - Login page
- `app/protected/layout.tsx` - Protected routes wrapper
- `app/protected/dashboard/page.tsx` - Employee dashboard
- `app/protected/apply-leave/page.tsx` - Leave application form
- `app/protected/manager/approvals/page.tsx` - Manager approval interface
- `app/protected/admin/employees/page.tsx` - Admin employee management
- `app/protected/admin/holidays/page.tsx` - Admin holiday management
- `lib/api.ts` - Centralized API client
- `lib/contexts/AuthContext.tsx` - Authentication context
- `lib/hooks/useApi.ts` - Custom hooks for API calls
- `components/Navbar.tsx` - Navigation component
- `types/index.ts` - TypeScript type definitions

## Key Features

### Authentication & Authorization
- JWT-based stateless authentication
- HttpOnly cookies for secure token storage
- Role-based middleware on backend
- Protected routes on frontend
- Automatic redirect to login for unauthenticated users

### Employee Management
- Create, read, update, delete employees
- Assign roles (admin, manager, employee)
- Organize by department
- Admin-only access

### Leave Management
- Apply for leave with dates, type, and reason
- View leave history with status
- Managers approve/reject with optional rejection reason
- Employees see only their own leaves
- Managers see their team's leaves
- Admins see all leaves

### Holiday Management
- Add company holidays with dates and descriptions
- View holidays (all users can see)
- Admin-only create/edit/delete

### Database Schema
- 4 tables: roles, employees, leaves, holidays
- Foreign key relationships
- Proper constraints and indexes
- Automatic timestamp tracking

## Tech Stack

### Backend
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Auth:** JWT + bcryptjs
- **Validation:** Zod
- **ORM:** Raw pg client with parameterized queries

### Frontend
- **Framework:** Next.js 16
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **State Management:** React Context + SWR
- **HTTP Client:** Axios
- **Storage:** HttpOnly cookies (js-cookie)

### Infrastructure
- **Database:** Neon (serverless PostgreSQL)
- **Backend Hosting:** Vercel / Railway / Heroku (Node.js)
- **Frontend Hosting:** Vercel (Next.js)

## How to Get Started

### Quick Start (5 minutes)
See `QUICK_START.md` for the fastest way to run the app locally.

### Full Setup
See `SETUP_GUIDE.md` for:
- Detailed configuration instructions
- Database setup guide
- Environment variable configuration
- API endpoint reference
- Troubleshooting guide
- Production deployment guide

### Test Credentials
The system comes with pre-configured test users:
```
Admin     : admin@company.com / admin123
Manager   : manager@company.com / manager123
Employee  : employee@company.com / emp123
```

These are automatically created when you run `pnpm db:init` in the backend.

## Project Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── routes/       (4 route files)
│   │   ├── middleware/   (auth, error handling)
│   │   ├── db/           (connection, init script)
│   │   ├── utils/        (jwt, password)
│   │   ├── types/        (TypeScript types)
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── dist/             (compiled output)
│
├── app/                  (Frontend Next.js app)
│   ├── login/
│   ├── protected/
│   │   ├── dashboard/
│   │   ├── apply-leave/
│   │   ├── manager/
│   │   └── admin/
│   ├── layout.tsx
│   └── page.tsx
│
├── lib/
│   ├── api.ts
│   ├── contexts/
│   ├── hooks/
│   └── types/
│
├── components/
│   └── Navbar.tsx
│
├── SETUP_GUIDE.md
├── QUICK_START.md
└── .env.local
```

## Next Steps

### Local Development
1. Set up a free Neon PostgreSQL database
2. Configure backend `.env` with database URL
3. Run `pnpm db:init` to initialize database
4. Start backend: `cd backend && pnpm dev`
5. Start frontend: `pnpm dev`
6. Visit http://localhost:3000 and login

### Customization Ideas
- Add email notifications for leave approvals
- Implement leave balance tracking
- Add attendance tracking
- Create leave analytics dashboard
- Add custom leave policies
- Implement approval workflows with multiple levels
- Add calendar view for leave visualization

### Production Deployment
- Deploy backend to Vercel/Railway/Heroku
- Deploy frontend to Vercel
- Use production PostgreSQL database
- Configure environment variables on hosting platform
- Set up CI/CD pipeline
- Enable HTTPS and security headers
- Configure domain names and DNS

## Important Notes

### Security
- All passwords are hashed with bcryptjs
- JWT secrets should be strong (use `openssl rand -base64 32`)
- Never commit `.env` files with secrets
- CORS is configured to only allow your frontend domain
- Role-based access control on all API endpoints
- Input validation on all endpoints

### Database Backups
- Neon provides automatic backups
- Set up regular backups for production
- Test restore procedures regularly

### Monitoring
- Monitor API response times
- Track authentication failures
- Watch database query performance
- Set up alerts for errors
- Use application logs for debugging

## Support Resources

- See `SETUP_GUIDE.md` for complete documentation
- See `QUICK_START.md` for fastest setup path
- Check backend logs for API errors
- Check browser console for frontend errors
- Verify database connectivity with `psql` command line

## Success Criteria

You'll know the app is working when:
✅ Backend starts without errors on port 5000
✅ Database has 4 tables and test data
✅ Frontend starts on port 3000
✅ You can login with test credentials
✅ Each role sees their appropriate dashboard
✅ Leave requests can be created and approved
✅ Holidays and employees can be managed

## Architecture Benefits

- **Separated Concerns:** Frontend and backend can be developed/deployed independently
- **Scalability:** Each part can scale independently
- **Team Independence:** Frontend and backend teams can work in parallel
- **Technology Flexibility:** Easy to swap components in future (e.g., replace React with Vue)
- **API-Driven:** Clear contract between frontend and backend
- **Testability:** Easy to test backend API independently

Enjoy building with this complete leave management system!
