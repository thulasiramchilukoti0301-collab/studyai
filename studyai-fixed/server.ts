import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GROQ_API_KEY = process.env.GROQ_API_KEY as string;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-8b-8192';

async function groq(prompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(cors());
  app.use(express.json());

  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.pdf', '.txt'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF and TXT files are allowed'));
      }
    },
  });

  app.post('/api/extract-text', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      let extractedText = '';
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.pdf' || req.file.mimetype === 'application/pdf') {
        const data = await pdf(req.file.buffer);
        extractedText = data.text ?? '';
      } else {
        extractedText = req.file.buffer.toString('utf-8');
      }
      if (!extractedText.trim()) {
        return res.status(422).json({ error: 'Could not extract any text from this file.' });
      }
      return res.json({ text: extractedText, fileName: req.file.originalname, size: req.file.size });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to extract text from file.' });
    }
  });

  app.post('/api/ai/summary', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'No text provided' });
      const result = await groq(`Please summarize the following educational material. Format in professional markdown with clear headings.\n\nMaterial:\n${text.substring(0, 8000)}`);
      return res.json({ result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/quiz', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'No text provided' });
      const result = await groq(`Generate 5 multiple-choice questions based on this material. Return ONLY a JSON array with this exact format, no extra text:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":"A","explanation":"..."}]

Material:\n${text.substring(0, 8000)}`);
      const parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
      return res.json({ result: parsed });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/flashcards', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'No text provided' });
      const result = await groq(`Generate 5 multiple-choice questions based on this material. Return ONLY a valid JSON array, no markdown, no extra text, no explanation outside JSON:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":"A","explanation":"..."}]

Material:\n${text.substring(0, 4000)}`);
    try {
  const cleaned = result.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(match ? match[0] : '[]');
  return res.json({ result: parsed });
} catch {
  return res.json({ result: [] });
}
} catch (error: any) {
return res.status(500).json({ error: error.message });
}
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { question, context } = req.body;
      if (!question) return res.status(400).json({ error: 'No question provided' });
      const result = await groq(`You are StudyAI, a helpful study companion. Use the following notes to answer the question. Be encouraging and educational.\n\nNotes:\n${(context || '').substring(0, 6000)}\n\nQuestion: ${question}`);
      return res.json({ result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on http://localhost:${PORT}`));
}

startServer().catch(console.error);