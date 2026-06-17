# Quick Reference - Leave Management System

## 🚀 Start the System (2 Terminal Windows)

### Terminal 1: Backend
```bash
cd backend
pnpm dev
```
Expected output:
```
✓ Leave Management API Server running on http://localhost:5000
```

### Terminal 2: Frontend  
```bash
pnpm dev
```
Expected output:
```
▲ Next.js 16.2.6
- Local: http://localhost:3000
```

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | admin123 |
| Manager | manager@company.com | manager123 |
| Employee | employee@company.com | emp123 |

**How to Use**: Visit `http://localhost:3000` → Click any credential box → Click "Sign In"

---

## ✅ What Works

- ✅ **Login**: All 3 roles authenticate successfully
- ✅ **JWT Tokens**: Generated and validated properly
- ✅ **Session**: Persists across page refreshes
- ✅ **API Endpoints**: All 16 endpoints functional
- ✅ **Database**: Connected to Neon PostgreSQL
- ✅ **UI**: Modern dark theme, fully responsive
- ✅ **Security**: HttpOnly cookies, CORS enabled, parameterized queries

---

## 📊 API Endpoints (All Working)

### Authentication
```
POST   /api/auth/login      - Login with email/password
GET    /api/auth/me         - Get current user info
POST   /api/auth/logout     - Logout
GET    /api/health          - Health check
```

### Employees
```
GET    /api/employees       - List all employees (admin)
POST   /api/employees       - Create employee (admin)
GET    /api/employees/:id   - Get employee (self/admin/manager)
PUT    /api/employees/:id   - Update employee (admin)
DELETE /api/employees/:id   - Delete employee (admin)
```

### Leaves
```
GET    /api/leaves          - List leaves (by role)
POST   /api/leaves          - Apply for leave (employee)
GET    /api/leaves/:id      - Get leave details
PUT    /api/leaves/:id      - Approve/reject (manager)
GET    /api/leaves/user/mine - My leave requests
```

### Holidays
```
GET    /api/holidays        - List all holidays
POST   /api/holidays        - Add holiday (admin)
PUT    /api/holidays/:id    - Update holiday (admin)
DELETE /api/holidays/:id    - Delete holiday (admin)
```

---

## 🧪 Test Commands

### Test Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'
```

### Test with Token
```bash
# First get token from login response, then:
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test All Logins
```bash
# Admin
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'

# Manager
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@company.com","password":"manager123"}'

# Employee
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@company.com","password":"emp123"}'
```

---

## 📁 Key Files

### Configuration
- `backend/.env` - Backend environment variables
- `.env.local` - Frontend environment (API URL)

### Authentication
- `backend/src/routes/auth.ts` - Login/logout logic
- `lib/contexts/AuthContext.tsx` - Frontend auth state
- `app/login/page.tsx` - Login page UI

### Database
- `backend/src/db/connection.ts` - Neon connection
- `backend/src/db/init.ts` - Schema & seed data

### Protected Routes
- `app/protected/layout.tsx` - Auth check wrapper
- `app/protected/dashboard/page.tsx` - Employee dashboard
- `app/protected/admin/employees/page.tsx` - Admin page
- `app/protected/manager/approvals/page.tsx` - Manager page

---

## 🔍 Verify Everything Works

```bash
# 1. Check backend
curl http://localhost:5000/api/health

# 2. Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'

# 3. Should return:
# {"token":"...", "user":{...}}

# 4. Visit frontend
# http://localhost:3000 → Should see login page
# Click admin credential → Click Sign In → Should see dashboard
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check DATABASE_URL in `.env` |
| Login fails | Verify users in database (Neon dashboard) |
| Frontend blank | Check browser console for errors |
| Port 5000 in use | `lsof -ti:5000 \| xargs kill -9` |
| Port 3000 in use | `lsof -ti:3000 \| xargs kill -9` |
| Clear cache | Ctrl+Shift+Delete → Clear cookies |

---

## 📚 Documentation

- `AUTHENTICATION_FIXED.md` - Auth fix details
- `README_FIXED.md` - Complete system guide
- `TESTING_GUIDE.md` - 10-phase testing
- `SYSTEM_STATUS.md` - Health status
- `VERIFY_EVERYTHING.md` - Verification procedures

---

## ✨ Summary

Your Leave Management System is **fully operational** with:
- ✅ Secure JWT authentication
- ✅ Role-based access control
- ✅ Neon PostgreSQL database
- ✅ Modern responsive UI
- ✅ All APIs working
- ✅ Test data ready

**Everything is ready to use and test!** 🎉
