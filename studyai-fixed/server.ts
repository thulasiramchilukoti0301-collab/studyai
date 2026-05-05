import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
const MODEL = 'gemini-2.0-flash';

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
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: `Please summarize the following educational material. Format in professional markdown with clear headings.\n\nMaterial Content:\n${text.substring(0, 30000)}`,
      });
      return res.json({ result: response.text ?? 'No summary generated.' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/quiz', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'No text provided' });
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: `Generate 5 multiple-choice questions based on the following material. Each question must have exactly 4 options. Return ONLY valid JSON.\n\nMaterial Content:\n${text.substring(0, 30000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctAnswer', 'explanation'],
            },
          },
        },
      });
      const result = JSON.parse((response.text ?? '[]').replace(/```json|```/g, '').trim());
      return res.json({ result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/flashcards', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'No text provided' });
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: `Generate 10 flashcards (term and definition). Return ONLY valid JSON.\n\nMaterial Content:\n${text.substring(0, 30000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING },
              },
              required: ['term', 'definition'],
            },
          },
        },
      });
      const result = JSON.parse((response.text ?? '[]').replace(/```json|```/g, '').trim());
      return res.json({ result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { question, context, history } = req.body;
      if (!question) return res.status(400).json({ error: 'No question provided' });
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
          ...(history || []),
          { role: 'user', parts: [{ text: `Based on the following notes, answer: "${question}"\n\nNotes:\n${(context || '').substring(0, 20000)}` }] },
        ],
        config: { systemInstruction: 'You are StudyAI, a helpful study companion. Use provided notes as primary source. Keep answers encouraging and educational.' },
      });
      return res.json({ result: response.text ?? 'Could not generate a response.' });
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