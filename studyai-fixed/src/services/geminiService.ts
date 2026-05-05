const BASE = '';

export const generateSummary = async (text: string): Promise<string> => {
  const res = await fetch(`${BASE}/api/ai/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.result;
};

export const generateQuiz = async (text: string) => {
  const res = await fetch(`${BASE}/api/ai/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.result;
};

export const generateFlashcards = async (text: string) => {
  const res = await fetch(`${BASE}/api/ai/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.result;
};

export const chatWithNotes = async (
  question: string,
  context: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context, history }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.result;
};