const express = require('express');
const router = express.Router();

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Article catalog - these match the articles on the site
const ARTICLES = [
    { id: 'ds-guide', title: 'Complete Guide to Data Structures', topic: 'data-structures', difficulty: 'intermediate', url: 'course-dsa.html', description: 'Arrays, linked lists, stacks, queues, trees, and graphs with practical examples.' },
    { id: 'algo-patterns', title: 'Algorithm Design Patterns', topic: 'algorithms', difficulty: 'advanced', url: 'practice.html', description: 'Sorting, searching, dynamic programming, and greedy algorithms.' },
    { id: 'interview-prep', title: 'Technical Interview Preparation', topic: 'interview', difficulty: 'intermediate', url: 'interview.html', description: 'Everything to ace your next coding interview.' },
    { id: 'python-fundamentals', title: 'Python Programming Fundamentals', topic: 'python', difficulty: 'beginner', url: 'courses.html', description: 'Python from basics to advanced concepts with practical projects.' },
    { id: 'web-dev', title: 'Modern Web Development', topic: 'web-development', difficulty: 'intermediate', url: 'courses.html', description: 'HTML, CSS, JavaScript, and popular frameworks.' },
    { id: 'ml-intro', title: 'Introduction to Machine Learning', topic: 'machine-learning', difficulty: 'advanced', url: 'courses.html', description: 'Fundamentals of ML, from basic concepts to first model.' },
    { id: 'dsa-course', title: 'Complete DSA Course', topic: 'data-structures', difficulty: 'intermediate', url: 'course-dsa.html', description: '50+ lectures, 40+ hours on data structures and algorithms.' },
    { id: 'practice-easy', title: 'Easy Practice Problems', topic: 'practice', difficulty: 'beginner', url: 'practice.html', description: '150+ easy problems for beginners.' },
    { id: 'practice-medium', title: 'Medium Practice Problems', topic: 'practice', difficulty: 'intermediate', url: 'practice.html', description: '200+ medium problems to build confidence.' },
    { id: 'practice-hard', title: 'Hard Practice Problems', topic: 'practice', difficulty: 'advanced', url: 'practice.html', description: '100+ challenging problems.' }
];

router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your-gemini-api-key-here') {
            // Fallback: basic keyword search
            return res.json({ results: keywordSearch(query), aiPowered: false });
        }

        const articleList = ARTICLES.map((a, i) => `${i + 1}. "${a.title}" - ${a.description} [${a.difficulty}]`).join('\n');

        const prompt = `Given this user search query: "${query}"

And these available articles:
${articleList}

Return a JSON array of the top 5 most relevant article numbers (1-indexed) with relevance scores (0-100).
Format: [{"index": 1, "score": 95, "reason": "brief reason"}, ...]
Only return the JSON array, nothing else.`;

        const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
            })
        });

        if (!response.ok) {
            return res.json({ results: keywordSearch(query), aiPowered: false });
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON from Gemini response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return res.json({ results: keywordSearch(query), aiPowered: false });
        }

        const rankings = JSON.parse(jsonMatch[0]);
        const results = rankings
            .filter(r => r.index >= 1 && r.index <= ARTICLES.length)
            .map(r => ({
                ...ARTICLES[r.index - 1],
                relevanceScore: r.score,
                reason: r.reason
            }));

        res.json({ results, aiPowered: true });
    } catch (error) {
        console.error('AI Search error:', error.message);
        res.json({ results: keywordSearch(req.body.query || ''), aiPowered: false });
    }
});

function keywordSearch(query) {
    const lower = query.toLowerCase();
    return ARTICLES
        .filter(a =>
            a.title.toLowerCase().includes(lower) ||
            a.description.toLowerCase().includes(lower) ||
            a.topic.includes(lower)
        )
        .slice(0, 5)
        .map(a => ({ ...a, relevanceScore: 50 }));
}

module.exports = router;
