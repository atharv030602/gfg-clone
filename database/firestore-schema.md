# Firestore Database Schema

## Collections

### `users/{uid}`
- `displayName`: string
- `email`: string
- `avatar`: string (URL)
- `createdAt`: timestamp

### `progress/{uid}`
- `{courseId}`: object
  - `completedLessons`: string[] (lesson IDs)
  - `percentage`: number (0-100)
  - `totalLessons`: number

### `favorites/{uid}`
- `articleIds`: string[] (article IDs)

### `chatHistory/{uid}/conversations/{conversationId}`
- `messages`: array of objects
  - `role`: "user" | "assistant"
  - `content`: string
  - `timestamp`: number (epoch ms)
- `updatedAt`: timestamp

### `articles` (optional, for AI search seeding)
- `title`: string
- `description`: string
- `topic`: string
- `difficulty`: "beginner" | "intermediate" | "advanced"
- `url`: string (relative path to HTML page)
