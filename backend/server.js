const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
const aiChatRouter = require('./routes/ai-chat');
const aiCodeAssistRouter = require('./routes/ai-code-assist');
const aiSearchRouter = require('./routes/ai-search');

app.use('/api/ai', aiChatRouter);
app.use('/api/ai', aiCodeAssistRouter);
app.use('/api/ai', aiSearchRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Gemini API: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here' ? 'configured' : 'NOT configured - set GEMINI_API_KEY in .env'}`);
});
