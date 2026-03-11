# 🔐 Enhanced Authentication Setup Guide

## 🎉 What's Been Implemented

Your GFG Clone now has **enterprise-grade authentication** with these features:

✅ **JWT Refresh Tokens** - Secure, short-lived access tokens  
✅ **Role-Based Access Control** - Admin, Instructor, Student roles  
✅ **OAuth Integration** - Google and GitHub login  
✅ **Email Verification** - Secure account activation  
✅ **Password Reset** - Email-based password recovery  
✅ **Rate Limiting** - Protection against brute force attacks  

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure OAuth Applications

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret

#### GitHub OAuth Setup:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID and Client Secret

### 3. Configure Environment Variables

Update your `backend/.env` file:

```env
# MongoDB Configuration
MONGODB_URI=your-mongodb-connection-string

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@gfg-clone.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Gmail App Password Setup
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings → Security → App passwords
3. Generate an app password for "Mail"
4. Use this password in `EMAIL_PASS`

## 🔧 Running the Enhanced Server

```bash
cd backend
node enhanced-server.js
```

You'll see:
```
🚀 Enhanced GFG Clone Server running on http://localhost:5000
📊 API endpoints available at http://localhost:5000/api
✨ Enhanced features enabled:
  - JWT Refresh Tokens
  - Role-based Access Control
  - OAuth (Google & GitHub)
  - Email Verification
  - Password Reset
  - Rate Limiting
```

## 📋 New API Endpoints

### Authentication
- `POST /api/auth/register` - Register with email verification
- `POST /api/auth/login` - Login with refresh token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate tokens
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### OAuth
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/github` - Initiate GitHub OAuth

### User Management
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update user profile

### Admin Only
- `GET /api/admin/users` - Get all users (paginated)
- `PUT /api/admin/users/:id/role` - Update user role

## 🌐 New Frontend Pages

### Authentication Pages
- `oauth-success.html` - OAuth callback handler
- `verify-email.html` - Email verification page
- `reset-password.html` - Password reset page

## 👤 User Roles

### Student (Default)
- Access to courses, practice problems, forum
- Can update own profile

### Instructor  
- All student permissions
- Can create/edit courses (future feature)
- Can moderate forum posts (future feature)

### Admin
- All permissions
- User management
- Can change user roles
- Access to all data

## 🔑 Default Admin Account

```
Email: admin@gfg-clone.com
Password: admin123
Role: Admin
```

## 🔒 Security Features

### Rate Limiting
- Authentication routes: 5 attempts per 15 minutes
- General routes: 100 requests per 15 minutes

### Password Security
- Minimum 6 characters
- Bcrypt hashing with salt rounds: 12
- Password strength indicator in reset form

### Token Security
- Short-lived access tokens (15 minutes)
- Refresh tokens stored in database
- Automatic token cleanup on logout
- All refresh tokens invalidated on password reset

### Email Security
- Secure SMTP with TLS
- Time-limited verification tokens (24 hours)
- Time-limited reset tokens (1 hour)
- No user enumeration in forgot password

## 🎨 Frontend Integration

### Authentication State Management
```javascript
// Store tokens
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);

// Make authenticated requests
const response = await fetch('/api/user/profile', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
});

// Handle token refresh
if (response.status === 403) {
    await refreshAccessToken();
    // Retry request
}
```

### Role-Based UI
```javascript
const user = await getCurrentUser();
if (user.role === 'admin') {
    showAdminPanel();
}
```

## 🧪 Testing the Features

### 1. User Registration
- Register at `/login.html`
- Check email for verification link
- Verify email at `/verify-email.html`

### 2. OAuth Login
- Click "Login with Google/GitHub"
- Authorize the application
- Get redirected to `/oauth-success.html`

### 3. Password Reset
- Go to "Forgot Password" on login page
- Enter email address
- Check email for reset link
- Reset password at `/reset-password.html`

### 4. Role Management
- Login as admin
- Access user management endpoints
- Update user roles

## 🚨 Troubleshooting

### OAuth Issues
- Verify callback URLs match exactly
- Check OAuth app status (not in development mode)
- Ensure correct scopes are requested

### Email Issues  
- Use Gmail app password, not regular password
- Enable "Less secure app access" if needed
- Check SMTP settings

### Database Issues
- Verify MongoDB connection string
- Check network connectivity
- Ensure database user has correct permissions

## 🔄 Next Steps

With this authentication system in place, you can now add:
- Course enrollment tracking
- User progress analytics
- Social features
- Payment integration
- Advanced user roles and permissions

Your GFG Clone is now ready for production-level user management! 🎉