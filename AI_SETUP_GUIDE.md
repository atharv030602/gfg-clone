# AI Chatbot Integration Setup Guide

## Overview
Your GeeksforGeeks clone now has an AI-powered coding assistant that can help users with:
- Programming concepts and explanations
- Data structures and algorithms
- Interview preparation tips
- Code examples and debugging
- Learning guidance

## Features

### ✨ Key Features
- **Intelligent Responses**: Context-aware AI responses using OpenAI's GPT
- **Conversation Memory**: Maintains conversation context
- **Code Formatting**: Properly formats code blocks and inline code
- **Quick Actions**: Pre-defined questions for common queries
- **Smart Suggestions**: Context-based follow-up suggestions
- **Typing Indicators**: Visual feedback while AI is thinking
- **Mobile Responsive**: Works seamlessly on all devices

## Setup Instructions

### 1. Install Dependencies (if not already installed)
```bash
cd backend
npm install
```

The AI chatbot uses the `fetch` API which is built into Node.js 18+. If you're using an older version:
```bash
npm install node-fetch
```

### 2. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it starts with `sk-...`)

### 3. Configure Environment Variables

Add to your `.env` file in the `backend` directory:

```env
# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Or use GPT-4 for better responses (costs more)
# OPENAI_MODEL=gpt-4

# Existing configurations...
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 4. Start the Backend Server

```bash
cd backend
node server.js
```

You should see:
```
✅ Connected to MongoDB successfully!
✅ Database indexes created
🚀 Server is running on port 5000
```

### 5. Test the Chatbot

1. Open `ai-chatbot.html` in your browser
2. Click the robot icon (🤖) in the bottom-right
3. Try asking questions like:
   - "Explain binary search algorithm"
   - "What are the common data structures?"
   - "Tips for coding interviews"

## Integration with Existing Pages

### Add Chatbot Widget to Any Page

Add this code before the closing `</body>` tag on any page:

```html
<!-- AI Chat Widget -->
<div class="ai-chat-widget">
    <button class="chat-toggle-btn" id="chatToggle" onclick="toggleChat()">
        🤖
    </button>

    <div class="chat-container" id="chatContainer">
        <!-- Chat content here -->
    </div>
</div>

<!-- Include the chatbot scripts -->
<link rel="stylesheet" href="styles.css">
<script src="ai-chatbot.js"></script>
```

Or simply include it as a script:
```html
<script src="ai-chatbot.js"></script>
```

## API Endpoints

### POST `/api/ai/chat`

Send a message to the AI assistant.

**Request:**
```json
{
  "message": "Explain binary search",
  "conversationHistory": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ],
  "conversationId": "conv_12345"
}
```

**Response:**
```json
{
  "response": "Binary search is an efficient algorithm...",
  "suggestions": [
    "Learn about Arrays",
    "Practice Array Problems"
  ],
  "conversationId": "conv_12345"
}
```

## Customization

### Change AI Model

In `.env`:
```env
# For faster, cheaper responses
OPENAI_MODEL=gpt-3.5-turbo

# For better, more detailed responses
OPENAI_MODEL=gpt-4

# For even better responses (most expensive)
OPENAI_MODEL=gpt-4-turbo
```

### Modify System Prompt

Edit `backend/routes/ai-chat.js`, line 29-40:

```javascript
const systemMessage = {
    role: "system",
    content: `Your custom instructions here...`
};
```

### Adjust Response Length

In `backend/routes/ai-chat.js`, line 58:

```javascript
max_tokens: 500,  // Increase for longer responses
```

### Change Appearance

Edit the CSS in `ai-chatbot.html` or `styles.css` to customize:
- Colors
- Sizes
- Animations
- Position

## Costs & Usage

### OpenAI Pricing (as of 2024)
- **GPT-3.5 Turbo**: ~$0.002 per 1K tokens
- **GPT-4**: ~$0.03 per 1K tokens
- **GPT-4 Turbo**: ~$0.01 per 1K tokens

Average conversation (10 messages) costs:
- GPT-3.5: $0.01 - $0.05
- GPT-4: $0.15 - $0.50

### Monitor Usage
- Check your [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- Set usage limits in OpenAI settings
- Monitor token usage in console logs

## Demo Mode (Without API Key)

The chatbot works in demo mode without an API key. It will:
- Display helpful navigation tips
- Show platform features
- Provide basic guidance
- Not use actual AI (predefined responses)

## Troubleshooting

### "Backend not available" Error
- Make sure backend server is running (`node backend/server.js`)
- Check that port 5000 is not in use
- Verify CORS is enabled in server.js

### "Invalid API Key" Error
- Check your OpenAI API key in `.env`
- Make sure key starts with `sk-`
- Verify key is active on OpenAI platform

### Slow Responses
- Switch to gpt-3.5-turbo for faster responses
- Reduce max_tokens in the API call
- Check your internet connection

### Rate Limiting
- OpenAI has rate limits (requests per minute)
- Add retry logic in `ai-chat.js`
- Consider caching common responses

## Advanced Features (Future Enhancements)

### Planned Features:
- 🎯 Save conversation history to database
- 🔍 Search through past conversations
- 📊 User-specific AI personas
- 🎨 Theme customization
- 📱 Push notifications for responses
- 🔊 Voice input/output
- 🌐 Multi-language support
- 💾 Export conversations

## Security Best Practices

1. **Never expose API keys in frontend**
   - Keep keys in `.env` file
   - Use backend proxy (as implemented)
   - Add to `.gitignore`

2. **Rate Limiting**
   - Implement request throttling
   - Add user authentication
   - Monitor abuse

3. **Input Validation**
   - Sanitize user inputs
   - Limit message length
   - Filter inappropriate content

4. **Cost Control**
   - Set max tokens limit
   - Implement usage quotas per user
   - Monitor daily/monthly spending

## Support & Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GPT Best Practices](https://platform.openai.com/docs/guides/gpt-best-practices)
- [OpenAI Community Forum](https://community.openai.com/)

## Credits

Built with:
- OpenAI GPT API
- Node.js & Express
- HTML, CSS, JavaScript
- MongoDB (for conversation storage - coming soon)

---

**Questions?** Check the troubleshooting section or open an issue on GitHub.
