const express = require('express');
const router = express.Router();

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const ACTION_PROMPTS = {
    explain: `You are a code explanation assistant. Explain the following code in clear, simple terms.
Break down what each section does. Identify the algorithm or pattern used.
Mention the time and space complexity if applicable.
Format your response with markdown headings and code blocks.`,

    debug: `You are a code debugging assistant. Analyze the following code for:
1. Syntax errors
2. Logic errors
3. Edge cases not handled
4. Potential runtime errors
Provide the corrected code with explanations of what was wrong.
Format your response with markdown.`,

    optimize: `You are a code optimization assistant. Analyze the following code and suggest:
1. Performance improvements (time/space complexity)
2. Code readability improvements
3. Best practices and modern patterns
Provide the optimized code with explanations.
Format your response with markdown.`
};

router.post('/code-assist', async (req, res) => {
    try {
        const { code, language = 'javascript', action = 'explain' } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        if (!ACTION_PROMPTS[action]) {
            return res.status(400).json({ error: 'Invalid action. Use: explain, debug, or optimize' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your-gemini-api-key-here') {
            return res.json({
                result: "AI code assistant is not configured. Please set GEMINI_API_KEY in backend/.env.",
                suggestions: []
            });
        }

        const prompt = `${ACTION_PROMPTS[action]}\n\nLanguage: ${language}\n\n\`\`\`${language}\n${code}\n\`\`\``;

        const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const result = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || "Could not analyze the code.";

        res.json({ result, action, language });
    } catch (error) {
        console.error('AI Code Assist error:', error.message);
        res.status(500).json({ error: 'Failed to analyze code', message: error.message });
    }
});

module.exports = router;
