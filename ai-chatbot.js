// AI Chatbot functionality
// Set API base URL via `window.AI_API_URL` if needed (e.g. deployed backend URL).
// Defaults to a relative route for same-origin deployments.
const API_URL = (typeof window !== 'undefined' && window.AI_API_URL)
    ? window.AI_API_URL
    : '/api/ai/chat';

let conversationHistory = [];
let conversationId = null;

// Toggle chat window
function toggleChat() {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return;

    chatContainer.classList.toggle('open');

    if (chatContainer.classList.contains('open')) {
        const input = document.getElementById('chatInput');
        if (input) {
            input.focus();
        }
    }
}

// Handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Send quick message
function sendQuickMessage(message) {
    document.getElementById('chatInput').value = message;
    sendMessage();
}

// Send message to AI
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Clear input
    input.value = '';
    
    // Disable send button
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    
    // Remove welcome message if exists
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send to API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                conversationHistory: conversationHistory,
                conversationId: conversationId
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get response from AI');
        }
        
        const data = await response.json();
        
        // Update conversation ID
        if (data.conversationId) {
            conversationId = data.conversationId;
        }
        
        // Remove typing indicator
        hideTypingIndicator();
        
        // Add AI response to chat
        addMessage(data.response, 'ai', data.suggestions);
        
        // Update conversation history
        conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: data.response }
        );
        
        // Keep only last 10 messages in history to avoid context overflow
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }
        
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        addMessage(
            'Sorry, I encountered an error. Please make sure the backend server is running and try again.',
            'ai'
        );
    } finally {
        // Re-enable send button
        sendBtn.disabled = false;
        input.focus();
    }
}

// Add message to chat
function addMessage(text, sender, suggestions = []) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}`;
    
    // Format message text (handle code blocks and inline code)
    const formattedText = formatMessage(text);
    bubble.innerHTML = formattedText;
    
    messageDiv.appendChild(bubble);
    
    // Add suggestions if available
    if (suggestions && suggestions.length > 0) {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'suggestions';
        
        suggestions.forEach(suggestion => {
            const suggestionBtn = document.createElement('button');
            suggestionBtn.className = 'suggestion-btn';
            suggestionBtn.textContent = suggestion;
            suggestionBtn.onclick = () => sendQuickMessage(suggestion);
            suggestionsDiv.appendChild(suggestionBtn);
        });
        
        messageDiv.appendChild(suggestionsDiv);
    }
    
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Format message text
function formatMessage(text) {
    // Escape HTML
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Handle code blocks (```)
    formatted = formatted.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code>${code.trim()}</code></pre>`;
    });
    
    // Handle inline code (`)
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// Show typing indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'chat-message';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Initialize chatbot
document.addEventListener('DOMContentLoaded', function() {
    console.log('AI Chatbot initialized');
    
    // Check if backend is available
    checkBackendStatus();
});

// Check backend status
async function checkBackendStatus() {
    try {
        const response = await fetch(API_URL.replace('/chat', '/status'), {
            method: 'GET'
        });
        
        if (response.ok) {
            console.log('✅ Backend connected');
        }
    } catch (error) {
        console.warn('⚠️ Backend not available. Chat will work in demo mode.');
    }
}
