const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Data files
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const contactFile = path.join(dataDir, 'contact.json');
const newsletterFile = path.join(dataDir, 'newsletter.json');
const forumFile = path.join(dataDir, 'forum.json');

// Initialize data directory and files
async function initializeData() {
    try {
        await fs.mkdir(dataDir, { recursive: true });
        
        const files = [
            [usersFile, []],
            [contactFile, []],
            [newsletterFile, []],
            [forumFile, []]
        ];
        
        for (const [file, defaultData] of files) {
            try {
                await fs.access(file);
            } catch {
                await fs.writeFile(file, JSON.stringify(defaultData, null, 2));
            }
        }
        console.log('✅ Data files initialized');
    } catch (error) {
        console.error('❌ Data initialization error:', error);
    }
}

// Helper functions
async function readJSON(file) {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
}

async function writeJSON(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// Auth middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, 'gfg-clone-secret-key-2024', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// ========== AUTH ROUTES ==========

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;
        
        if (!email || !password || !displayName) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const users = await readJSON(usersFile);
        
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: Date.now().toString(),
            email,
            password: hashedPassword,
            displayName,
            createdAt: new Date(),
            progress: { articlesRead: 0, problemsSolved: 0, streak: 0 }
        };
        
        users.push(user);
        await writeJSON(usersFile, users);
        
        const token = jwt.sign({ userId: user.id, email }, 'gfg-clone-secret-key-2024', { expiresIn: '24h' });
        
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: user.id, email, displayName }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const users = await readJSON(usersFile);
        const user = users.find(u => u.email === email);
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user.id, email }, 'gfg-clone-secret-key-2024', { expiresIn: '24h' });
        
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, displayName: user.displayName }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ========== CONTACT ROUTES ==========

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const contacts = await readJSON(contactFile);
        const contactMessage = {
            id: Date.now().toString(),
            name, email, subject, message,
            timestamp: new Date(),
            status: 'unread'
        };
        
        contacts.push(contactMessage);
        await writeJSON(contactFile, contacts);
        
        res.status(201).json({ message: 'Contact message saved successfully', id: contactMessage.id });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ error: 'Failed to save contact message' });
    }
});

// ========== NEWSLETTER ROUTES ==========

app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const subscribers = await readJSON(newsletterFile);
        
        if (subscribers.find(s => s.email === email)) {
            return res.status(400).json({ error: 'Email already subscribed' });
        }
        
        const subscriber = {
            id: Date.now().toString(),
            email,
            timestamp: new Date(),
            status: 'active'
        };
        
        subscribers.push(subscriber);
        await writeJSON(newsletterFile, subscribers);
        
        res.status(201).json({ message: 'Successfully subscribed to newsletter', id: subscriber.id });
    } catch (error) {
        console.error('Newsletter error:', error);
        res.status(500).json({ error: 'Failed to subscribe to newsletter' });
    }
});

// ========== FORUM ROUTES ==========

app.post('/api/forum/posts', authenticateToken, async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }
        
        const posts = await readJSON(forumFile);
        const post = {
            id: Date.now().toString(),
            title, content, category,
            tags: tags || [],
            author: { id: req.user.userId, email: req.user.email },
            timestamp: new Date(),
            likes: 0, replies: 0, views: 0
        };
        
        posts.push(post);
        await writeJSON(forumFile, posts);
        
        res.status(201).json({ message: 'Forum post created successfully', id: post.id, post });
    } catch (error) {
        console.error('Forum post error:', error);
        res.status(500).json({ error: 'Failed to create forum post' });
    }
});

app.get('/api/forum/posts', async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;
        let posts = await readJSON(forumFile);
        
        if (category && category !== 'all') {
            posts = posts.filter(p => p.category === category);
        }
        
        posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const start = (page - 1) * limit;
        const paginatedPosts = posts.slice(start, start + parseInt(limit));
        
        res.json({
            posts: paginatedPosts,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(posts.length / limit),
                hasNext: start + parseInt(limit) < posts.length,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get forum posts error:', error);
        res.status(500).json({ error: 'Failed to get forum posts' });
    }
});

// ========== USER PROGRESS ROUTES ==========

app.get('/api/user/progress', authenticateToken, async (req, res) => {
    try {
        const users = await readJSON(usersFile);
        const user = users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            _id: user.id,
            displayName: user.displayName,
            email: user.email,
            progress: user.progress
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Failed to get progress' });
    }
});

app.put('/api/user/progress', authenticateToken, async (req, res) => {
    try {
        const { articlesRead, problemsSolved, streak } = req.body;
        const users = await readJSON(usersFile);
        const userIndex = users.findIndex(u => u.id === req.user.userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (articlesRead !== undefined) users[userIndex].progress.articlesRead = articlesRead;
        if (problemsSolved !== undefined) users[userIndex].progress.problemsSolved = problemsSolved;
        if (streak !== undefined) users[userIndex].progress.streak = streak;
        
        await writeJSON(usersFile, users);
        res.json({ message: 'Progress updated successfully' });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date(), database: 'JSON files' });
});

// Start server
async function startServer() {
    await initializeData();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
        console.log(`💾 Using JSON file storage in: ${dataDir}`);
    });
}

startServer();