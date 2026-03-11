const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
let db;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gfg-clone';

async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db('gfg-clone');
        console.log('✅ Connected to MongoDB successfully!');
        
        // Create indexes for better performance
        await createIndexes();
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function createIndexes() {
    try {
        // Create indexes for better query performance
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('forumPosts').createIndex({ timestamp: -1 });
        await db.collection('contactMessages').createIndex({ timestamp: -1 });
        await db.collection('newsletterSubscribers').createIndex({ email: 1 }, { unique: true });
        console.log('✅ Database indexes created');
    } catch (error) {
        console.log('⚠️ Index creation warning:', error.message);
    }
}

// Import AI chat routes
const aiChatRouter = require('./routes/ai-chat');

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// ========== AI CHAT ROUTES ==========
app.use('/api/ai', aiChatRouter);

// ========== AUTHENTICATION ROUTES ==========

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;
        
        if (!email || !password || !displayName) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = {
            email,
            password: hashedPassword,
            displayName,
            createdAt: new Date(),
            lastLogin: new Date(),
            progress: {
                articlesRead: 0,
                problemsSolved: 0,
                streak: 0
            }
        };
        
        const result = await db.collection('users').insertOne(user);
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: result.insertedId, email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: result.insertedId,
                email,
                displayName
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Find user
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
        );
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                displayName: user.displayName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ========== CONTACT MESSAGES ROUTES ==========

// Save contact message
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const contactMessage = {
            name,
            email,
            subject,
            message,
            timestamp: new Date(),
            status: 'unread'
        };
        
        const result = await db.collection('contactMessages').insertOne(contactMessage);
        
        res.status(201).json({
            message: 'Contact message saved successfully',
            id: result.insertedId
        });
    } catch (error) {
        console.error('Contact message error:', error);
        res.status(500).json({ error: 'Failed to save contact message' });
    }
});

// Get contact messages (admin only)
app.get('/api/contact', authenticateToken, async (req, res) => {
    try {
        const messages = await db.collection('contactMessages')
            .find({})
            .sort({ timestamp: -1 })
            .toArray();
        
        res.json(messages);
    } catch (error) {
        console.error('Get contact messages error:', error);
        res.status(500).json({ error: 'Failed to get contact messages' });
    }
});

// ========== NEWSLETTER ROUTES ==========

// Subscribe to newsletter
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const subscriber = {
            email,
            timestamp: new Date(),
            status: 'active'
        };
        
        const result = await db.collection('newsletterSubscribers').insertOne(subscriber);
        
        res.status(201).json({
            message: 'Successfully subscribed to newsletter',
            id: result.insertedId
        });
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({ error: 'Email already subscribed' });
        }
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ error: 'Failed to subscribe to newsletter' });
    }
});

// Get newsletter subscribers (admin only)
app.get('/api/newsletter', authenticateToken, async (req, res) => {
    try {
        const subscribers = await db.collection('newsletterSubscribers')
            .find({})
            .sort({ timestamp: -1 })
            .toArray();
        
        res.json(subscribers);
    } catch (error) {
        console.error('Get newsletter subscribers error:', error);
        res.status(500).json({ error: 'Failed to get newsletter subscribers' });
    }
});

// ========== FORUM POSTS ROUTES ==========

// Create forum post
app.post('/api/forum/posts', authenticateToken, async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }
        
        const post = {
            title,
            content,
            category,
            tags: tags || [],
            author: {
                id: req.user.userId,
                email: req.user.email
            },
            timestamp: new Date(),
            likes: 0,
            replies: 0,
            views: 0
        };
        
        const result = await db.collection('forumPosts').insertOne(post);
        
        res.status(201).json({
            message: 'Forum post created successfully',
            id: result.insertedId,
            post
        });
    } catch (error) {
        console.error('Create forum post error:', error);
        res.status(500).json({ error: 'Failed to create forum post' });
    }
});

// Get forum posts
app.get('/api/forum/posts', async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;
        
        let query = {};
        if (category && category !== 'all') {
            query.category = category;
        }
        
        const posts = await db.collection('forumPosts')
            .find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .toArray();
        
        const total = await db.collection('forumPosts').countDocuments(query);
        
        res.json({
            posts,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get forum posts error:', error);
        res.status(500).json({ error: 'Failed to get forum posts' });
    }
});

// Get single forum post
app.get('/api/forum/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }
        
        // Increment view count
        await db.collection('forumPosts').updateOne(
            { _id: new ObjectId(id) },
            { $inc: { views: 1 } }
        );
        
        const post = await db.collection('forumPosts').findOne({ _id: new ObjectId(id) });
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json(post);
    } catch (error) {
        console.error('Get forum post error:', error);
        res.status(500).json({ error: 'Failed to get forum post' });
    }
});

// ========== USER PROGRESS ROUTES ==========

// Update user progress
app.put('/api/user/progress', authenticateToken, async (req, res) => {
    try {
        const { articlesRead, problemsSolved, streak } = req.body;
        
        const updateData = {};
        if (articlesRead !== undefined) updateData['progress.articlesRead'] = articlesRead;
        if (problemsSolved !== undefined) updateData['progress.problemsSolved'] = problemsSolved;
        if (streak !== undefined) updateData['progress.streak'] = streak;
        
        await db.collection('users').updateOne(
            { _id: new ObjectId(req.user.userId) },
            { $set: updateData }
        );
        
        res.json({ message: 'Progress updated successfully' });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Get user progress
app.get('/api/user/progress', authenticateToken, async (req, res) => {
    try {
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { progress: 1, displayName: 1, email: 1 } }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Failed to get progress' });
    }
});

// ========== HEALTH CHECK ==========

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        database: db ? 'connected' : 'disconnected'
    });
});

// Start server
async function startServer() {
    await connectToMongoDB();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
    });
}

startServer();