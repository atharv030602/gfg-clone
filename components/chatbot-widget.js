/**
 * Chatbot Widget - Global floating AI chatbot
 * Auto-injects into any page that imports this module.
 * Uses backend Gemini proxy for AI responses.
 * Stores conversation history in Firestore for logged-in users.
 */

import { chatWithAI } from '../api/gemini.js';

let conversationHistory = [];
let conversationId = null;
let isOpen = false;

// Try to import Firebase for chat history (optional - works without it)
let firebaseClient = null;
let authModule = null;
try {
    firebaseClient = await import('../api/firebase-client.js');
    authModule = await import('../database/firebase-config.js');
} catch (e) {
    // Firebase not available - chatbot works without it
}

function getUid() {
    try { return authModule?.auth?.currentUser?.uid || null; } catch { return null; }
}

function injectStyles() {
    if (document.getElementById('chatbot-widget-styles')) return;
    const style = document.createElement('style');
    style.id = 'chatbot-widget-styles';
    style.textContent = `
        .chatbot-float-btn { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #2F8D46, #0F7B0F); color: white; border: none; font-size: 24px; cursor: pointer; box-shadow: 0 4px 20px rgba(47,141,70,0.4); z-index: 9998; transition: transform 0.3s, box-shadow 0.3s; animation: chatbot-pulse 2s infinite; display: flex; align-items: center; justify-content: center; }
        .chatbot-float-btn:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(47,141,70,0.5); }
        @keyframes chatbot-pulse { 0%,100% { box-shadow: 0 4px 20px rgba(47,141,70,0.4); } 50% { box-shadow: 0 4px 30px rgba(47,141,70,0.7); } }
        .chatbot-panel { position: fixed; bottom: 90px; right: 24px; width: 380px; max-height: 520px; background: var(--bg-secondary, #fff); border-radius: 16px; box-shadow: 0 10px 50px rgba(0,0,0,0.2); z-index: 9999; display: none; flex-direction: column; overflow: hidden; border: 1px solid var(--border-color, #dee2e6); }
        .chatbot-panel.open { display: flex; animation: chatbot-slide-up 0.3s ease; }
        @keyframes chatbot-slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .chatbot-panel-header { background: linear-gradient(135deg, #2F8D46, #0F7B0F); color: white; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }
        .chatbot-panel-header h3 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 8px; }
        .chatbot-panel-header .status-dot { width: 8px; height: 8px; background: #51cf66; border-radius: 50%; }
        .chatbot-close-btn { background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 4px 8px; }
        .chatbot-messages { flex: 1; overflow-y: auto; padding: 16px; min-height: 200px; max-height: 320px; }
        .chatbot-msg { margin-bottom: 12px; }
        .chatbot-msg-bubble { padding: 10px 14px; border-radius: 12px; font-size: 0.9rem; line-height: 1.5; max-width: 90%; word-wrap: break-word; }
        .chatbot-msg-bubble.user { background: linear-gradient(135deg, #2F8D46, #0F7B0F); color: white; margin-left: auto; border-bottom-right-radius: 4px; }
        .chatbot-msg-bubble.ai { background: var(--bg-tertiary, #f0f0f0); color: var(--text-primary, #333); border-bottom-left-radius: 4px; }
        .chatbot-msg-bubble.ai pre { background: #1a1a1a; color: #e0e0e0; padding: 8px; border-radius: 6px; overflow-x: auto; font-size: 0.8rem; margin: 6px 0; }
        .chatbot-msg-bubble.ai code { background: rgba(0,0,0,0.1); padding: 1px 4px; border-radius: 3px; font-size: 0.85rem; }
        .chatbot-suggestions { display: flex; gap: 6px; flex-wrap: wrap; padding: 0 16px 8px; }
        .chatbot-suggest-btn { background: var(--bg-tertiary, #f0f0f0); border: 1px solid var(--border-color, #dee2e6); color: var(--text-accent, #2F8D46); padding: 4px 10px; border-radius: 14px; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; }
        .chatbot-suggest-btn:hover { background: var(--text-accent, #2F8D46); color: white; }
        .chatbot-input-area { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border-color, #dee2e6); }
        .chatbot-input { flex: 1; border: 1px solid var(--border-color, #dee2e6); border-radius: 8px; padding: 8px 12px; font-size: 0.9rem; background: var(--bg-primary, #f8f9fa); color: var(--text-primary, #333); outline: none; }
        .chatbot-input:focus { border-color: #2F8D46; }
        .chatbot-send-btn { background: linear-gradient(135deg, #2F8D46, #0F7B0F); color: white; border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer; font-size: 0.9rem; }
        .chatbot-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .chatbot-typing { display: flex; gap: 4px; padding: 10px 14px; }
        .chatbot-typing span { width: 8px; height: 8px; background: #2F8D46; border-radius: 50%; animation: chatbot-bounce 1.4s infinite both; }
        .chatbot-typing span:nth-child(2) { animation-delay: 0.2s; }
        .chatbot-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes chatbot-bounce { 0%,80%,100% { transform: scale(0.6); } 40% { transform: scale(1); } }
        .chatbot-welcome { text-align: center; padding: 20px; color: var(--text-secondary, #666); }
        .chatbot-welcome h4 { margin-bottom: 8px; color: var(--text-primary, #333); }
        .chatbot-quick-btns { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
        .chatbot-quick-btn { background: var(--bg-tertiary, #f0f0f0); border: 1px solid var(--border-color, #dee2e6); padding: 8px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; text-align: left; transition: all 0.2s; color: var(--text-primary, #333); }
        .chatbot-quick-btn:hover { border-color: #2F8D46; background: rgba(47,141,70,0.05); }
        .chatbot-footer { text-align: center; padding: 6px; font-size: 0.7rem; color: var(--text-secondary, #999); border-top: 1px solid var(--border-color, #eee); }
        @media (max-width: 480px) { .chatbot-panel { width: calc(100vw - 20px); right: 10px; bottom: 80px; max-height: 70vh; } }
    `;
    document.head.appendChild(style);
}

function formatAIResponse(text) {
    let html = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => `<pre><code>${code.trim()}</code></pre>`)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    return html;
}

function injectWidget() {
    if (document.getElementById('chatbot-widget-root')) return;

    const root = document.createElement('div');
    root.id = 'chatbot-widget-root';
    root.innerHTML = `
        <button class="chatbot-float-btn" id="chatbotToggle" aria-label="Open AI assistant">💬</button>
        <div class="chatbot-panel" id="chatbotPanel">
            <div class="chatbot-panel-header">
                <h3><span class="status-dot"></span> AI Coding Assistant</h3>
                <button class="chatbot-close-btn" id="chatbotClose">×</button>
            </div>
            <div class="chatbot-messages" id="chatbotMessages">
                <div class="chatbot-welcome">
                    <h4>👋 Hi there!</h4>
                    <p>Ask me anything about programming, DSA, or interviews.</p>
                    <div class="chatbot-quick-btns">
                        <button class="chatbot-quick-btn" data-msg="Explain binary search algorithm">📚 Explain binary search</button>
                        <button class="chatbot-quick-btn" data-msg="What are the most common data structures?">🗂️ Common data structures</button>
                        <button class="chatbot-quick-btn" data-msg="Tips for coding interviews">💼 Interview tips</button>
                    </div>
                </div>
            </div>
            <div class="chatbot-suggestions" id="chatbotSuggestions"></div>
            <div class="chatbot-input-area">
                <input class="chatbot-input" id="chatbotInput" type="text" placeholder="Ask a coding question..." autocomplete="off">
                <button class="chatbot-send-btn" id="chatbotSend">➤</button>
            </div>
            <div class="chatbot-footer">AI-generated responses. Verify important information.</div>
        </div>
    `;
    document.body.appendChild(root);

    // Event listeners
    document.getElementById('chatbotToggle').addEventListener('click', togglePanel);
    document.getElementById('chatbotClose').addEventListener('click', togglePanel);
    document.getElementById('chatbotSend').addEventListener('click', sendMessage);
    document.getElementById('chatbotInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    root.querySelectorAll('.chatbot-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('chatbotInput').value = btn.dataset.msg;
            sendMessage();
        });
    });
}

function togglePanel() {
    isOpen = !isOpen;
    const panel = document.getElementById('chatbotPanel');
    panel.classList.toggle('open', isOpen);
    if (isOpen) document.getElementById('chatbotInput').focus();
}

function addMessage(text, sender, suggestions = []) {
    const container = document.getElementById('chatbotMessages');
    const welcome = container.querySelector('.chatbot-welcome');
    if (welcome) welcome.remove();

    const div = document.createElement('div');
    div.className = 'chatbot-msg';
    const bubble = document.createElement('div');
    bubble.className = `chatbot-msg-bubble ${sender}`;
    bubble.innerHTML = sender === 'ai' ? formatAIResponse(text) : text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    // Update suggestions
    const sugContainer = document.getElementById('chatbotSuggestions');
    sugContainer.innerHTML = '';
    suggestions.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'chatbot-suggest-btn';
        btn.textContent = s;
        btn.addEventListener('click', () => {
            document.getElementById('chatbotInput').value = s;
            sendMessage();
        });
        sugContainer.appendChild(btn);
    });
}

function showTyping() {
    const container = document.getElementById('chatbotMessages');
    const div = document.createElement('div');
    div.id = 'chatbot-typing';
    div.className = 'chatbot-msg';
    div.innerHTML = '<div class="chatbot-typing"><span></span><span></span><span></span></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('chatbot-typing');
    if (el) el.remove();
}

async function sendMessage() {
    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    document.getElementById('chatbotSend').disabled = true;
    addMessage(message, 'user');
    showTyping();

    try {
        const data = await chatWithAI(message, conversationHistory, conversationId);
        hideTyping();
        addMessage(data.response, 'ai', data.suggestions || []);
        if (data.conversationId) conversationId = data.conversationId;

        conversationHistory.push({ role: 'user', content: message }, { role: 'assistant', content: data.response });
        if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);

        // Save to Firestore if logged in
        const uid = getUid();
        if (uid && firebaseClient && conversationId) {
            try { await firebaseClient.saveConversation(uid, conversationId, conversationHistory); } catch {}
        }
    } catch (err) {
        hideTyping();
        addMessage('Sorry, I encountered an error. Make sure the backend server is running (npm run backend).', 'ai');
    }

    document.getElementById('chatbotSend').disabled = false;
    input.focus();
}

// Auto-initialize
injectStyles();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
} else {
    injectWidget();
}
