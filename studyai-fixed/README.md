# StudyAI – Deep Focus Companion

An AI-powered study app that transforms your notes into summaries, quizzes, and flashcards using Google Gemini.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up your API key**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```
   Get a key at: https://aistudio.google.com/app/apikey

3. **Run in development**
   ```bash
   npm run dev
   ```
   Opens at http://localhost:3000

## Production Deployment

```bash
npm run build   # builds frontend to /dist
npm start       # serves everything from Express
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `NODE_ENV` | ❌ | Set to `production` for prod |
| `PORT` | ❌ | Server port (default: 3000) |

## Features

- 📄 **PDF & TXT upload** — extract text from files up to 10MB
- 📝 **AI Summaries** — markdown-formatted overviews
- 🧠 **AI Quizzes** — interactive 5-question multiple choice
- 🃏 **Flashcards** — flip-card study mode
- 💬 **Chat with Notes** — ask questions about your material
- 🔥 **Drag & drop** upload support
