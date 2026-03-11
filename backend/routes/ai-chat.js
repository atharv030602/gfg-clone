const express = require('express');
const router = express.Router();

// AI Chat endpoint (supports multiple AI providers)
router.post('/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if OpenAI API key is configured
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            // Return a helpful response without API key
            return res.json({
                response: "I'm your AI coding assistant! To enable full AI capabilities, please configure the OPENAI_API_KEY in your environment variables. In the meantime, I can still help you navigate the site and provide basic guidance.",
                suggestions: [
                    "Explore our tutorials",
                    "Practice coding problems",
                    "Read interview guides"
                ]
            });
        }

        // Build conversation context
        const systemMessage = {
            role: "system",
            content: `You are a helpful coding assistant for GeeksforGeeks. You help users learn programming concepts, data structures, algorithms, and prepare for technical interviews. 
            
            Guidelines:
            - Be concise and clear in explanations
            - Provide code examples when helpful
            - Encourage learning and problem-solving
            - Reference relevant articles or practice problems on the platform
            - Be supportive and patient with beginners
            - For complex topics, break them down into simpler parts`
        };

        const messages = [
            systemMessage,
            ...conversationHistory,
            { role: "user", content: message }
        ];

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Generate contextual suggestions
        const suggestions = generateSuggestions(message, aiResponse);

        res.json({
            response: aiResponse,
            suggestions: suggestions,
            conversationId: req.body.conversationId || generateConversationId()
        });

    } catch (error) {
        console.error('AI Chat error:', error);
        res.status(500).json({ 
            error: 'Failed to process chat request',
            message: error.message 
        });
    }
});

// Generate contextual suggestions based on the conversation
function generateSuggestions(userMessage, aiResponse) {
    const suggestions = [];
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('array') || lowerMessage.includes('data structure')) {
        suggestions.push("Learn about Arrays", "Practice Array Problems", "Trees and Graphs");
    } else if (lowerMessage.includes('algorithm') || lowerMessage.includes('sort')) {
        suggestions.push("Sorting Algorithms", "Search Algorithms", "Dynamic Programming");
    } else if (lowerMessage.includes('interview')) {
        suggestions.push("Interview Preparation Guide", "Common Interview Questions", "System Design");
    } else if (lowerMessage.includes('python') || lowerMessage.includes('java')) {
        suggestions.push("Language Tutorials", "Practice Problems", "Code Examples");
    } else {
        suggestions.push("Explore Tutorials", "Practice Problems", "Interview Prep");
    }
    
    return suggestions.slice(0, 3);
}

// Generate a unique conversation ID
function generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get chat history (if user is authenticated)
router.get('/history', async (req, res) => {
    try {
        const userId = req.user?.userId; // From auth middleware if available
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // This would fetch from database in production
        res.json({
            conversations: [],
            message: "Chat history feature coming soon"
        });
    } catch (error) {
        console.error('Chat history error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

module.exports = router;
