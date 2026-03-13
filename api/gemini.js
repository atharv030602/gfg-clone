/**
 * Gemini API Helper
 * Calls the backend proxy at /api/ai/* endpoints.
 * All AI requests go through the backend so the API key stays server-side.
 */

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://your-backend-url.herokuapp.com';  // Replace with your deployed backend URL

export async function chatWithAI(message, conversationHistory = [], conversationId = null) {
    const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationHistory, conversationId })
    });

    if (!response.ok) throw new Error('Chat request failed');
    return response.json();
}

export async function codeAssist(code, language = 'javascript', action = 'explain') {
    const response = await fetch(`${API_BASE}/api/ai/code-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, action })
    });

    if (!response.ok) throw new Error('Code assist request failed');
    return response.json();
}

export async function aiSearch(query) {
    const response = await fetch(`${API_BASE}/api/ai/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });

    if (!response.ok) throw new Error('Search request failed');
    return response.json();
}
