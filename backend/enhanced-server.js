const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { error: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));
app.use(passport.initialize());
app.use(generalLimiter);

// MongoDB connection
let db;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gfg-clone';

// Email transporter setup
const emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// User roles enum
const USER_ROLES = {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin'
};

// Mock database for development
function createMockDatabase() {
    const mockData = {
        users: [],
        refreshTokens: [],
        contactMessages: [],
        newsletterSubscribers: [],
        forumPosts: []
    };
    
    return {
        collection: (name) => ({
            findOne: async (query) => {
                const items = mockData[name] || [];
                if (query._id && query._id.toString) {
                    return items.find(item => item._id?.toString() === query._id.toString());
                }
                if (query.email) {
                    return items.find(item => item.email === query.email);
                }
                if (query.emailVerificationToken) {
                    return items.find(item => item.emailVerificationToken === query.emailVerificationToken);
                }
                if (query.passwordResetToken) {
                    return items.find(item => item.passwordResetToken === query.passwordResetToken);
                }
                if (query.token) {
                    return items.find(item => item.token === query.token);
                }
                if (query.role) {
                    return items.find(item => item.role === query.role);
                }
                return items[0] || null;
            },
            find: (query = {}) => ({
                sort: () => ({ 
                    skip: () => ({ 
                        limit: () => ({ 
                            toArray: async () => mockData[name] || [] 
                        })
                    })
                }),
                toArray: async () => mockData[name] || []
            }),
            insertOne: async (doc) => {
                const id = Date.now().toString();
                const newDoc = { ...doc, _id: id };
                if (!mockData[name]) mockData[name] = [];
                mockData[name].push(newDoc);
                return { insertedId: id };
            },
            updateOne: async (query, update) => {
                const items = mockData[name] || [];
                let found = false;
                for (let item of items) {
                    if ((query._id && item._id === query._id) || 
                        (query.email && item.email === query.email) ||
                        (query.emailVerificationToken && item.emailVerificationToken === query.emailVerificationToken) ||
                        (query.passwordResetToken && item.passwordResetToken === query.passwordResetToken)) {
                        if (update.$set) Object.assign(item, update.$set);
                        if (update.$unset) {
                            for (let key in update.$unset) delete item[key];
                        }
                        found = true;
                        break;
                    }
                }
                return { matchedCount: found ? 1 : 0 };
            },
            deleteOne: async (query) => {
                const items = mockData[name] || [];
                const index = items.findIndex(item => 
                    (query._id && item._id === query._id) ||
                    (query.token && item.token === query.token)
                );
                if (index > -1) {
                    items.splice(index, 1);
                    return { deletedCount: 1 };
                }
                return { deletedCount: 0 };
            },
            deleteMany: async (query) => {
                const items = mockData[name] || [];
                const toDelete = [];
                for (let i = items.length - 1; i >= 0; i--) {
                    if (query.userId && items[i].userId === query.userId) {
                        toDelete.push(items.splice(i, 1)[0]);
                    }
                }
                return { deletedCount: toDelete.length };
            },
            countDocuments: async () => (mockData[name] || []).length,
            createIndex: async () => true
        })
    };
}

async function connectToMongoDB() {
    try {
        // MongoDB connection options with SSL handling
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        };
        
        // Add SSL options for Atlas connections
        if (MONGODB_URI.includes('mongodb+srv://')) {
            options.tls = true;
            options.tlsAllowInvalidCertificates = false;
        }
        
        const client = new MongoClient(MONGODB_URI, options);
        await client.connect();
        db = client.db('gfg-clone');
        console.log('✅ Connected to MongoDB successfully!');
        
        await createIndexes();
        await createDefaultAdmin();
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        
        // For development, we can fallback to a mock database
        console.log('⚠️ Falling back to in-memory storage for development...');
        db = createMockDatabase();
        console.log('✅ Mock database initialized');
    }
}

async function createIndexes() {
    try {
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ 'oauth.provider': 1, 'oauth.providerId': 1 });
        await db.collection('users').createIndex({ emailVerificationToken: 1 });
        await db.collection('users').createIndex({ passwordResetToken: 1 });
        await db.collection('refreshTokens').createIndex({ token: 1 });
        await db.collection('refreshTokens').createIndex({ userId: 1 });
        await db.collection('refreshTokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        console.log('✅ Database indexes created');
    } catch (error) {
        console.log('⚠️ Index creation warning:', error.message);
    }
}

async function createDefaultAdmin() {
    try {
        const adminExists = await db.collection('users').findOne({ role: USER_ROLES.ADMIN });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 12);
            await db.collection('users').insertOne({
                email: 'admin@gfg-clone.com',
                password: hashedPassword,
                displayName: 'Admin User',
                role: USER_ROLES.ADMIN,
                isEmailVerified: true,
                createdAt: new Date(),
                progress: {
                    articlesRead: 0,
                    problemsSolved: 0,
                    streak: 0
                }
            });
            console.log('✅ Default admin user created: admin@gfg-clone.com / admin123');
        }
    } catch (error) {
        console.log('⚠️ Default admin creation warning:', error.message);
    }
}

// JWT utility functions
function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { 
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' 
    });
}

function generateRefreshToken() {
    return jwt.sign({ type: 'refresh' }, process.env.JWT_REFRESH_SECRET, { 
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' 
    });
}

async function saveRefreshToken(userId, token) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.collection('refreshTokens').insertOne({
        userId: new ObjectId(userId),
        token,
        expiresAt,
        createdAt: new Date()
    });
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Role-based authorization middleware
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const userRoles = Array.isArray(roles) ? roles : [roles];
        if (!userRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        next();
    };
}

// Email utility functions
async function sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify Your Email - GFG Clone',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2f8d46;">Welcome to GFG Clone!</h2>
                <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
                <a href="${verificationUrl}" style="background-color: #2f8d46; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                    Verify Email Address
                </a>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all;">${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
            </div>
        `
    };
    
    await emailTransporter.sendMail(mailOptions);
}

async function sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset - GFG Clone',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2f8d46;">Password Reset Request</h2>
                <p>You requested a password reset. Click the link below to set a new password:</p>
                <a href="${resetUrl}" style="background-color: #2f8d46; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                    Reset Password
                </a>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all;">${resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this reset, please ignore this email.</p>
            </div>
        `
    };
    
    await emailTransporter.sendMail(mailOptions);
}

// Passport configuration
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
        if (user) {
            return done(null, user);
        }
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        let user = await db.collection('users').findOne({
            $or: [
                { email: profile.emails[0].value },
                { 'oauth.provider': 'google', 'oauth.providerId': profile.id }
            ]
        });

        if (user) {
            // Update OAuth info if needed
            if (!user.oauth || user.oauth.provider !== 'google') {
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { 
                        $set: { 
                            oauth: { provider: 'google', providerId: profile.id },
                            isEmailVerified: true
                        } 
                    }
                );
            }
        } else {
            // Create new user
            const result = await db.collection('users').insertOne({
                email: profile.emails[0].value,
                displayName: profile.displayName,
                avatar: profile.photos[0].value,
                role: USER_ROLES.STUDENT,
                isEmailVerified: true,
                oauth: { provider: 'google', providerId: profile.id },
                createdAt: new Date(),
                progress: {
                    articlesRead: 0,
                    problemsSolved: 0,
                    streak: 0
                }
            });
            user = { _id: result.insertedId, ...profile._json };
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await db.collection('users').findOne({
            $or: [
                { email: profile.emails[0].value },
                { 'oauth.provider': 'github', 'oauth.providerId': profile.id }
            ]
        });

        if (user) {
            if (!user.oauth || user.oauth.provider !== 'github') {
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { 
                        $set: { 
                            oauth: { provider: 'github', providerId: profile.id },
                            isEmailVerified: true
                        } 
                    }
                );
            }
        } else {
            const result = await db.collection('users').insertOne({
                email: profile.emails[0].value,
                displayName: profile.displayName || profile.username,
                avatar: profile.photos[0].value,
                role: USER_ROLES.STUDENT,
                isEmailVerified: true,
                oauth: { provider: 'github', providerId: profile.id },
                createdAt: new Date(),
                progress: {
                    articlesRead: 0,
                    problemsSolved: 0,
                    streak: 0
                }
            });
            user = { _id: result.insertedId, ...profile._json };
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

// ========== ENHANCED AUTHENTICATION ROUTES ==========

// User Registration with email verification
app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { email, password, displayName, role = USER_ROLES.STUDENT } = req.body;
        
        if (!email || !password || !displayName) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Validate role
        if (!Object.values(USER_ROLES).includes(role)) {
            return res.status(400).json({ error: 'Invalid role specified' });
        }
        
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const emailVerificationToken = uuidv4();
        
        const user = {
            email,
            password: hashedPassword,
            displayName,
            role,
            isEmailVerified: false,
            emailVerificationToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            createdAt: new Date(),
            lastLogin: null,
            progress: {
                articlesRead: 0,
                problemsSolved: 0,
                streak: 0
            }
        };
        
        const result = await db.collection('users').insertOne(user);
        
        // Send verification email
        try {
            await sendVerificationEmail(email, emailVerificationToken);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail registration if email fails
        }
        
        res.status(201).json({
            message: 'User created successfully. Please check your email to verify your account.',
            userId: result.insertedId,
            emailSent: true
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Email verification
app.post('/api/auth/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Verification token required' });
        }
        
        const user = await db.collection('users').findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() }
        });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }
        
        await db.collection('users').updateOne(
            { _id: user._id },
            { 
                $set: { isEmailVerified: true },
                $unset: { emailVerificationToken: "", emailVerificationExpires: "" }
            }
        );
        
        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
});

// User Login with refresh token
app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (!user.isEmailVerified) {
            return res.status(400).json({ error: 'Please verify your email before logging in' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
        );
        
        // Generate tokens
        const accessToken = generateAccessToken({ 
            userId: user._id, 
            email: user.email, 
            role: user.role 
        });
        const refreshToken = generateRefreshToken();
        
        // Save refresh token
        await saveRefreshToken(user._id, refreshToken);
        
        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Refresh Token
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }
        
        // Verify refresh token
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid refresh token' });
            }
            
            // Check if refresh token exists in database
            const tokenDoc = await db.collection('refreshTokens').findOne({ token: refreshToken });
            if (!tokenDoc) {
                return res.status(403).json({ error: 'Refresh token not found' });
            }
            
            // Get user
            const user = await db.collection('users').findOne({ _id: tokenDoc.userId });
            if (!user) {
                return res.status(403).json({ error: 'User not found' });
            }
            
            // Generate new access token
            const accessToken = generateAccessToken({ 
                userId: user._id, 
                email: user.email, 
                role: user.role 
            });
            
            res.json({ accessToken });
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// Forgot Password
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            // Don't reveal if user exists or not
            return res.json({ message: 'If the email exists, a reset link has been sent' });
        }
        
        const resetToken = uuidv4();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        await db.collection('users').updateOne(
            { _id: user._id },
            { 
                $set: { 
                    passwordResetToken: resetToken,
                    passwordResetExpires: resetExpires
                }
            }
        );
        
        try {
            await sendPasswordResetEmail(email, resetToken);
        } catch (emailError) {
            console.error('Password reset email failed:', emailError);
        }
        
        res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }
        
        const user = await db.collection('users').findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() }
        });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        await db.collection('users').updateOne(
            { _id: user._id },
            { 
                $set: { password: hashedPassword },
                $unset: { passwordResetToken: "", passwordResetExpires: "" }
            }
        );
        
        // Invalidate all refresh tokens for this user
        await db.collection('refreshTokens').deleteMany({ userId: user._id });
        
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (refreshToken) {
            await db.collection('refreshTokens').deleteOne({ token: refreshToken });
        }
        
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Google OAuth routes
app.get('/api/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

app.get('/api/auth/google/callback', 
    passport.authenticate('google', { session: false }),
    async (req, res) => {
        try {
            const user = req.user;
            const accessToken = generateAccessToken({ 
                userId: user._id, 
                email: user.email, 
                role: user.role || USER_ROLES.STUDENT 
            });
            const refreshToken = generateRefreshToken();
            
            await saveRefreshToken(user._id, refreshToken);
            
            // Redirect to frontend with tokens
            res.redirect(`${process.env.FRONTEND_URL}/oauth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`);
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
        }
    }
);

// GitHub OAuth routes
app.get('/api/auth/github', passport.authenticate('github', { 
    scope: ['user:email'] 
}));

app.get('/api/auth/github/callback',
    passport.authenticate('github', { session: false }),
    async (req, res) => {
        try {
            const user = req.user;
            const accessToken = generateAccessToken({ 
                userId: user._id, 
                email: user.email, 
                role: user.role || USER_ROLES.STUDENT 
            });
            const refreshToken = generateRefreshToken();
            
            await saveRefreshToken(user._id, refreshToken);
            
            res.redirect(`${process.env.FRONTEND_URL}/oauth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`);
        } catch (error) {
            console.error('GitHub OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
        }
    }
);

// ========== USER MANAGEMENT ROUTES ==========

// Get current user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0, emailVerificationToken: 0, passwordResetToken: 0 } }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { displayName, bio, avatar } = req.body;
        
        const updateData = {};
        if (displayName) updateData.displayName = displayName;
        if (bio) updateData.bio = bio;
        if (avatar) updateData.avatar = avatar;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        await db.collection('users').updateOne(
            { _id: new ObjectId(req.user.userId) },
            { $set: updateData }
        );
        
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ========== ADMIN ROUTES ==========

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireRole(USER_ROLES.ADMIN), async (req, res) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;
        
        let query = {};
        if (role && role !== 'all') query.role = role;
        if (search) {
            query.$or = [
                { displayName: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ];
        }
        
        const users = await db.collection('users')
            .find(query, { projection: { password: 0, emailVerificationToken: 0, passwordResetToken: 0 } })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .toArray();
        
        const total = await db.collection('users').countDocuments(query);
        
        res.json({
            users,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Update user role (admin only)
app.put('/api/admin/users/:id/role', authenticateToken, requireRole(USER_ROLES.ADMIN), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        if (!Object.values(USER_ROLES).includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: { role } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Keep existing routes from original server.js
// ... (forum posts, contact, newsletter, progress routes)

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        database: db ? 'connected' : 'disconnected',
        features: {
            jwtRefresh: true,
            roleBasedAuth: true,
            oauth: true,
            emailVerification: true,
            passwordReset: true
        }
    });
});

// Start server
async function startServer() {
    await connectToMongoDB();
    
    app.listen(PORT, () => {
        console.log(`🚀 Enhanced GFG Clone Server running on http://localhost:${PORT}`);
        console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
        console.log('✨ Enhanced features enabled:');
        console.log('  - JWT Refresh Tokens');
        console.log('  - Role-based Access Control');
        console.log('  - OAuth (Google & GitHub)');
        console.log('  - Email Verification');
        console.log('  - Password Reset');
        console.log('  - Rate Limiting');
    });
}

startServer().catch(console.error);