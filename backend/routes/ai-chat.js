const express = require('express');
const router = express.Router();

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are an AI coding assistant for a GeeksforGeeks-style learning platform.
You help users learn programming concepts, data structures, algorithms, and prepare for technical interviews.

Guidelines:
- Be concise and clear in explanations
- Provide code examples when helpful (use markdown code blocks)
- Encourage learning and problem-solving
- Suggest relevant topics from: Data Structures, Algorithms, Web Development, Python, Machine Learning, Interview Preparation
- For complex topics, break them down into simpler parts
- When relevant, suggest practice problems or related articles`;

router.post('/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your-gemini-api-key-here') {
            return res.json({
                response: "The AI assistant is not configured yet. Please set GEMINI_API_KEY in backend/.env to enable AI features.",
                suggestions: ["Explore tutorials", "Practice coding problems", "Read interview guides"]
            });
        }

        // Build conversation for Gemini
        const contents = [];

        // Add system instruction via first user/model exchange
        contents.push(
            { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Understood. I will act as a helpful coding assistant for the learning platform.' }] }
        );

        // Add conversation history
        for (const msg of conversationHistory.slice(-20)) {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        }

        // Add current message
        contents.push({ role: 'user', parts: [{ text: message }] });

        const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || "I couldn't generate a response.";

        const suggestions = generateSuggestions(message);

        res.json({
            response: aiResponse,
            suggestions,
            conversationId: req.body.conversationId || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        });
    } catch (error) {
        console.error('AI Chat error:', error.message);
        res.status(500).json({ error: 'Failed to process chat request', message: error.message });
    }
});

function generateSuggestions(userMessage) {
    const lower = userMessage.toLowerCase();
    if (lower.includes('array') || lower.includes('data structure')) {
        return ["Learn about Arrays", "Practice Array Problems", "Trees and Graphs"];
    } else if (lower.includes('algorithm') || lower.includes('sort')) {
        return ["Sorting Algorithms", "Search Algorithms", "Dynamic Programming"];
    } else if (lower.includes('interview')) {
        return ["Interview Preparation Guide", "Common Interview Questions", "System Design"];
    } else if (lower.includes('python') || lower.includes('java')) {
        return ["Language Tutorials", "Practice Problems", "Code Examples"];
    }
    return ["Explore Tutorials", "Practice Problems", "Interview Prep"];
}

module.exports = router;
