# Leave Management System - Complete Testing Guide

## System Overview

The Leave Management System is now a **fully functional enterprise application** with:

- ✅ **Backend API Server** - Express.js with JWT authentication
- ✅ **Frontend Application** - Next.js 16 with modern UI
- ✅ **Database** - PostgreSQL with Neon integration
- ✅ **Authentication** - Secure httpOnly cookies + JWT
- ✅ **Role-Based Access Control** - Admin, Manager, Employee

---

## Pre-Testing Setup

### 1. **Start the Backend Server**

```bash
cd backend
pnpm dev
```

Expected output:
```
✓ Leave Management API Server running on http://localhost:5000
  CORS enabled for: http://localhost:3000
```

### 2. **Start the Frontend Development Server** (in a new terminal)

```bash
cd (project root)
pnpm dev
```

Expected output:
```
▲ Next.js 16.2.6
  - Local: http://localhost:3000
```

### 3. **Initialize the Database** (first time only)

```bash
cd backend
pnpm run db:init
```

This creates:
- Roles table (admin, manager, employee)
- Employees table
- Leaves table
- Holidays table
- Test data with demo credentials

---

## Test Credentials

Use these to test different roles:

| Role     | Email                  | Password   |
|----------|------------------------|-----------|
| Admin    | admin@company.com      | admin123  |
| Manager  | manager@company.com    | manager123|
| Employee | employee@company.com   | emp123    |

---

## End-to-End Testing Workflow

### **PHASE 1: Authentication Testing**

#### Test 1.1: Login Page Visibility
- [ ] Navigate to `http://localhost:3000`
- [ ] Verify you're redirected to `/login`
- [ ] Check page layout:
  - [ ] Dark theme with good contrast
  - [ ] "Leave Management" header visible
  - [ ] Email and password input fields
  - [ ] Sign In button
  - [ ] Demo credentials section (clickable)

#### Test 1.2: Demo Credentials Auto-Fill
- [ ] Click on "Admin" credential box
- [ ] Verify email field fills with `admin@company.com`
- [ ] Verify password field fills with `admin123`
- [ ] Repeat for Manager and Employee roles

#### Test 1.3: Valid Login - Admin
- [ ] Enter `admin@company.com` / `admin123`
- [ ] Click "Sign In"
- [ ] **Expected**: Redirected to `/protected/dashboard`
- [ ] Verify navbar shows username
- [ ] Verify no errors in browser console

#### Test 1.4: Valid Login - Manager
- [ ] Go to `/login`
- [ ] Enter `manager@company.com` / `manager123`
- [ ] Click "Sign In"
- [ ] **Expected**: Redirected to `/protected/dashboard`
- [ ] Verify manager-specific menu items appear

#### Test 1.5: Valid Login - Employee
- [ ] Go to `/login`
- [ ] Enter `employee@company.com` / `emp123`
- [ ] Click "Sign In"
- [ ] **Expected**: Redirected to `/protected/dashboard`
- [ ] Verify employee-specific menu items appear

#### Test 1.6: Invalid Credentials
- [ ] Enter wrong email: `wrong@company.com`
- [ ] Enter password: `admin123`
- [ ] Click "Sign In"
- [ ] **Expected**: Error message "Invalid email or password"
- [ ] Verify you stay on login page

#### Test 1.7: Empty Form Submission
- [ ] Leave email and password empty
- [ ] Click "Sign In"
- [ ] **Expected**: Browser validation prevents submission OR error message appears

#### Test 1.8: Token Persistence
- [ ] Log in successfully
- [ ] Refresh the page (F5)
- [ ] **Expected**: You remain logged in, no redirect to login
- [ ] Check Application tab > Cookies > `authToken` exists

---

### **PHASE 2: Role-Based Access Control (RBAC) Testing**

#### Test 2.1: Admin Dashboard Access
- [ ] Log in as admin
- [ ] Verify you can access:
  - [ ] `/protected/dashboard` - Main dashboard
  - [ ] `/protected/apply-leave` - Apply for leave
  - [ ] `/protected/admin/employees` - Employee management
  - [ ] `/protected/admin/holidays` - Holiday management

#### Test 2.2: Manager Dashboard Access
- [ ] Log in as manager
- [ ] Verify you can access:
  - [ ] `/protected/dashboard` - Main dashboard
  - [ ] `/protected/apply-leave` - Apply for leave
  - [ ] `/protected/manager/approvals` - Leave approvals
- [ ] Verify you CANNOT access:
  - [ ] `/protected/admin/employees` (should redirect or show 403)
  - [ ] `/protected/admin/holidays` (should redirect or show 403)

#### Test 2.3: Employee Dashboard Access
- [ ] Log in as employee
- [ ] Verify you can access:
  - [ ] `/protected/dashboard` - Main dashboard
  - [ ] `/protected/apply-leave` - Apply for leave
- [ ] Verify you CANNOT access:
  - [ ] `/protected/manager/approvals` (should redirect)
  - [ ] `/protected/admin/employees` (should redirect)
  - [ ] `/protected/admin/holidays` (should redirect)

#### Test 2.4: Unauthorized Route Access
- [ ] Log in as employee
- [ ] Try to visit `/protected/admin/employees` directly
- [ ] **Expected**: Redirected to dashboard or access denied message

---

### **PHASE 3: Employee Management Testing (Admin Only)**

#### Test 3.1: View All Employees
- [ ] Log in as admin
- [ ] Navigate to "Admin" > "Employees"
- [ ] Verify you can see:
  - [ ] Table with employee list
  - [ ] Columns: Name, Email, Role, Actions
  - [ ] At least 3 demo employees

#### Test 3.2: Create New Employee
- [ ] Click "+ Add Employee" button
- [ ] Fill form with:
  - Name: "John Doe"
  - Email: "john@company.com"
  - Password: "password123"
  - Role: "Employee"
  - Manager: (select from dropdown if applicable)
- [ ] Click "Create"
- [ ] **Expected**: Success message, employee appears in list

#### Test 3.3: Edit Employee
- [ ] Click edit icon on an employee
- [ ] Change name to "Jane Doe"
- [ ] Click "Update"
- [ ] **Expected**: Change is reflected in the list

#### Test 3.4: Delete Employee
- [ ] Click delete icon on an employee
- [ ] Confirm deletion in modal
- [ ] **Expected**: Employee removed from list

---

### **PHASE 4: Leave Management Testing**

#### Test 4.1: Employee - Apply for Leave
- [ ] Log in as employee
- [ ] Click "Apply Leave"
- [ ] Fill form:
  - [ ] Start Date: Pick a future date
  - [ ] End Date: Pick a date after start
  - [ ] Leave Type: "Casual Leave"
  - [ ] Reason: "Personal appointment"
- [ ] Click "Submit"
- [ ] **Expected**: Success message, redirected to dashboard

#### Test 4.2: View Own Leave Requests
- [ ] On employee dashboard
- [ ] Verify "Your Leave Requests" section shows:
  - [ ] Leave you just applied for
  - [ ] Status: "Pending"
  - [ ] Dates and reason

#### Test 4.3: Manager - View Subordinates' Leaves
- [ ] Log in as manager
- [ ] Navigate to "Manager" > "Approvals"
- [ ] Verify you see:
  - [ ] List of pending leave requests
  - [ ] Only from employees you manage
  - [ ] Approve/Reject buttons

#### Test 4.4: Manager - Approve Leave
- [ ] On approvals page
- [ ] Click "Approve" on a pending leave
- [ ] Optional: Add comment
- [ ] Click "Confirm Approve"
- [ ] **Expected**: Status changes to "Approved"

#### Test 4.5: Manager - Reject Leave
- [ ] On approvals page
- [ ] Click "Reject" on a pending leave
- [ ] Add rejection reason
- [ ] Click "Confirm Reject"
- [ ] **Expected**: Status changes to "Rejected"

#### Test 4.6: Admin - View All Leaves
- [ ] Log in as admin
- [ ] Navigate to "Admin" > "All Leaves"
- [ ] Verify you can see:
  - [ ] All leave requests from all employees
  - [ ] Filter by status (Pending, Approved, Rejected)
  - [ ] Edit or delete leaves if needed

---

### **PHASE 5: Holiday Management Testing (Admin Only)**

#### Test 5.1: View Holidays
- [ ] Log in as admin
- [ ] Navigate to "Admin" > "Holidays"
- [ ] Verify you can see:
  - [ ] List of public holidays
  - [ ] Columns: Date, Holiday Name, Description

#### Test 5.2: Add Holiday
- [ ] Click "+ Add Holiday" button
- [ ] Fill form:
  - [ ] Date: Select a date
  - [ ] Name: "Independence Day"
  - [ ] Description: "National holiday"
- [ ] Click "Add"
- [ ] **Expected**: Holiday appears in list

#### Test 5.3: Edit Holiday
- [ ] Click edit on a holiday
- [ ] Change description
- [ ] Click "Update"
- [ ] **Expected**: Change is reflected

#### Test 5.4: Delete Holiday
- [ ] Click delete on a holiday
- [ ] Confirm deletion
- [ ] **Expected**: Holiday removed from list

#### Test 5.5: Holiday Visibility in Leave Form
- [ ] Log in as employee
- [ ] Go to "Apply Leave"
- [ ] Date picker should:
  - [ ] Highlight holidays
  - [ ] Optionally prevent selecting holidays

---

### **PHASE 6: API Testing**

#### Test 6.1: Backend Health Check
```bash
curl http://localhost:5000/api/health
```
**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2026-06-17T10:30:00.000Z"
}
```

#### Test 6.2: Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'
```
**Expected Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@company.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

#### Test 6.3: Get User Info (with auth)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Cookie: authToken=YOUR_TOKEN_HERE"
```
**Expected Response:**
```json
{
  "user": {
    "id": 1,
    "email": "admin@company.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

#### Test 6.4: Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Cookie: authToken=YOUR_TOKEN_HERE"
```
**Expected Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### **PHASE 7: UI/UX Testing**

#### Test 7.1: Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] All pages should be readable and functional

#### Test 7.2: Dark Mode (if implemented)
- [ ] Toggle dark mode
- [ ] Verify colors have good contrast
- [ ] Verify text is readable

#### Test 7.3: Navigation
- [ ] Navbar items are clickable and work
- [ ] Logout button works properly
- [ ] User menu shows correct role

#### Test 7.4: Form Validation
- [ ] Email fields validate email format
- [ ] Date fields prevent past dates
- [ ] Required fields show error if empty
- [ ] Error messages are visible and helpful

---

### **PHASE 8: Security Testing**

#### Test 8.1: XSS Prevention
- [ ] Try entering HTML/JavaScript in form fields:
  ```
  <script>alert('XSS')</script>
  ```
- [ ] **Expected**: Sanitized or escaped, no script execution

#### Test 8.2: CSRF Protection
- [ ] No obvious CSRF vulnerabilities
- [ ] All state-changing requests use proper methods

#### Test 8.3: Session Security
- [ ] Log out
- [ ] Try accessing protected route directly
- [ ] **Expected**: Redirected to login

#### Test 8.4: Cookie Security
- [ ] Open DevTools > Application > Cookies
- [ ] `authToken` should have:
  - [ ] HttpOnly flag (not accessible via JS)
  - [ ] Secure flag (HTTPS only in production)
  - [ ] SameSite flag (lax or strict)

---

### **PHASE 9: Error Handling Testing**

#### Test 9.1: Network Error
- [ ] Stop backend server
- [ ] Try to login
- [ ] **Expected**: User-friendly error message

#### Test 9.2: Database Connection Error
- [ ] Intentionally disconnect database
- [ ] Try to perform action
- [ ] **Expected**: Graceful error message (not raw error)

#### Test 9.3: Invalid Form Data
- [ ] Submit form with invalid data
- [ ] **Expected**: Clear error messages

---

### **PHASE 10: Performance Testing**

#### Test 10.1: Page Load Times
- [ ] Open DevTools > Network tab
- [ ] Navigate to different pages
- [ ] Verify pages load in < 3 seconds

#### Test 10.2: Large List Performance
- [ ] View page with many employees/leaves
- [ ] **Expected**: Smooth scrolling, no lag

#### Test 10.3: Pagination (if implemented)
- [ ] Verify pagination works
- [ ] Each page loads correctly

---

## Automated Test Results

Run tests and verify all pass:

```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd ..
pnpm test
```

---

## Known Issues / Workarounds

(Document any known issues here)

---

## Deployment Checklist

Before going to production:

- [ ] Update `CORS_ORIGIN` in backend `.env`
- [ ] Set secure cookies in production (HTTPS)
- [ ] Set proper database credentials
- [ ] Update `NEXT_PUBLIC_API_URL` for production API
- [ ] Enable CSRF protection if needed
- [ ] Setup rate limiting
- [ ] Enable database backups
- [ ] Setup monitoring/logging
- [ ] SSL certificate configured

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Check backend server logs
3. Verify database is running
4. Verify both servers are on correct ports
5. Clear browser cache and cookies
6. Restart both servers

---

**Last Updated:** June 17, 2026
**Status:** ✅ Complete and Ready for Testing
