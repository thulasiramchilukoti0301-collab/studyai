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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  // Middleware
  app.use(cors({
    origin: isDev ? 'http://localhost:5173' : '*',
    methods: ['GET', 'POST'],
  }));
  app.use(express.json());

  // Multer setup
  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.pdf', '.txt'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF and TXT files are allowed'));
      }
    },
  });

  // ── API Routes ──────────────────────────────────────────────
  app.post('/api/extract-text', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

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

      return res.json({
        text: extractedText,
        fileName: req.file.originalname,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Extraction error:', error);
      return res.status(500).json({ error: 'Failed to extract text from file.' });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Static / Vite ────────────────────────────────────────────
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT} [${isDev ? 'dev' : 'production'}]`);
  });
}

startServer().catch(console.error);
