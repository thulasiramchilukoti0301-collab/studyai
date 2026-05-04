import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { Icon } from './Icon';
import { AiViewType, QuizQuestion, Flashcard } from '@/src/types';

interface StudyViewProps {
  type: AiViewType;
  data: any;
  loading: boolean;
  onBack: () => void;
  onChat: () => void;
}

export function StudyView({ type, data, loading, onBack, onChat }: StudyViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[32px] p-8 min-h-[60vh] flex flex-col"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-violet-600 font-bold hover:-translate-x-1 transition-transform cursor-pointer"
        >
          <Icon name="arrow_back" />
          Back to Dashboard
        </button>
        <button
          onClick={onChat}
          className="px-6 py-2 bg-violet-600 text-white rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-violet-700 transition-colors cursor-pointer"
        >
          <Icon name="chat_bubble" fill />
          Ask StudyAI
        </button>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="text-violet-600"
            >
              <Icon name="cloud_sync" className="text-6xl" />
            </motion.div>
            <p className="text-slate-500 font-medium">Gemini is processing your material…</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              {type === 'summary' && <SummaryView data={data} />}
              {type === 'quiz' && <QuizView data={data} />}
              {type === 'flashcards' && <FlashcardsView data={data} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

// ── Summary ──────────────────────────────────────────────────
function SummaryView({ data }: { data: string | null }) {
  return (
    <div className="prose prose-slate max-w-none prose-headings:text-violet-900 prose-strong:text-violet-700 prose-a:text-violet-600">
      <ReactMarkdown>{data ?? 'No summary generated.'}</ReactMarkdown>
    </div>
  );
}

// ── Quiz ─────────────────────────────────────────────────────
function QuizView({ data }: { data: QuizQuestion[] | null }) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setReveal] = useState<Record<number, boolean>>({});

  if (!data?.length) return <p className="text-slate-400 text-center py-10">No quiz generated.</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-violet-900 font-display">AI-Generated Quiz</h1>
      {data.map((q, i) => {
        const picked = selected[i];
        const isRevealed = revealed[i];
        const isCorrect = picked === q.correctAnswer;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-6 rounded-2xl bg-white/30"
          >
            <p className="font-bold text-lg text-on-surface mb-4">
              {i + 1}. {q.question}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {q.options.map((opt: string) => {
                let style = 'bg-white/60 border-violet-100 hover:bg-violet-50 text-slate-700';
                if (isRevealed) {
                  if (opt === q.correctAnswer) style = 'bg-emerald-50 border-emerald-300 text-emerald-800';
                  else if (opt === picked) style = 'bg-red-50 border-red-300 text-red-700';
                  else style = 'bg-white/40 border-slate-100 text-slate-400';
                } else if (picked === opt) {
                  style = 'bg-violet-50 border-violet-400 text-violet-800';
                }
                return (
                  <button
                    key={opt}
                    onClick={() => !isRevealed && setSelected(s => ({ ...s, [i]: opt }))}
                    className={cn(
                      'p-3 border rounded-xl text-left transition-all text-sm cursor-pointer',
                      style,
                      isRevealed && 'cursor-default'
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              {picked && !isRevealed && (
                <button
                  onClick={() => setReveal(r => ({ ...r, [i]: true }))}
                  className="text-xs font-bold text-violet-600 hover:underline cursor-pointer"
                >
                  Check Answer
                </button>
              )}
              {isRevealed && (
                <div className={cn('text-xs font-bold px-3 py-1 rounded-full', isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </div>
              )}
            </div>
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 bg-emerald-50 rounded-lg text-xs text-slate-600"
              >
                <span className="font-bold text-emerald-700">Correct: {q.correctAnswer}</span>
                <p className="mt-1">{q.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Flashcards ───────────────────────────────────────────────
function FlashcardsView({ data }: { data: Flashcard[] | null }) {
  if (!data?.length) return <p className="text-slate-400 text-center py-10">No flashcards generated.</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-violet-900 mb-6 font-display">Flashcards</h1>
      <p className="text-sm text-slate-500 mb-6">Click a card to flip it and reveal the definition.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((card, i) => (
          <FlashcardTile key={i} term={card.term} definition={card.definition} index={i} />
        ))}
      </div>
    </div>
  );
}

function FlashcardTile({ term, definition, index }: { term: string; definition: string; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={() => setFlipped(f => !f)}
      className="h-48 cursor-pointer"
      style={{ perspective: '1000px' }}
      role="button"
      aria-label={`Flashcard: ${term}`}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 glass-card p-6 flex items-center justify-center text-center rounded-2xl shadow-xl"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div>
            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Term</p>
            <p className="font-bold text-violet-900 text-lg">{term}</p>
          </div>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 bg-violet-600 p-6 flex items-center justify-center text-center rounded-2xl shadow-xl overflow-y-auto"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div>
            <p className="text-xs font-bold text-violet-200 uppercase tracking-widest mb-2">Definition</p>
            <p className="text-white text-sm font-medium leading-relaxed">{definition}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
