import React, { useState, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';
import * as Gemini from '@/src/services/geminiService';
import { StudyMaterial, AiViewType } from '@/src/types';

import { Icon } from './components/Icon';
import { Sidebar } from './components/Sidebar';
import { StudyView } from './components/StudyView';
import { ChatUI } from './components/ChatUI';
import { ActivityItem } from './components/ActivityItem';
import { LibraryItem } from './components/LibraryItem';
import { motion } from 'framer-motion';

export default function App() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showChat, setShowChat] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<StudyMaterial | null>(null);
  const [activeAiView, setActiveAiView] = useState<AiViewType>('none');
  const [aiData, setAiData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File Upload ──────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-uploaded
    e.target.value = '';
    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error ?? `Server error ${response.status}`);
      }

      const data = await response.json();

      if (!data?.text) {
        throw new Error('No text could be extracted from this file.');
      }

      const newMaterial: StudyMaterial = {
        id: Math.random().toString(36).substring(2, 11),
        name: data.fileName ?? file.name,
        text: data.text,
        type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'txt',
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        uploadedAt: new Date(),
      };

      setMaterials(prev => [newMaterial, ...prev]);
      setCurrentMaterial(newMaterial);
      handleGenerateAI('summary', newMaterial);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message ?? 'Upload failed. Is the backend server running?');
    } finally {
      setIsUploading(false);
    }
  };

  // ── AI Generation ────────────────────────────────────────────
  const handleGenerateAI = useCallback(
    async (type: 'summary' | 'quiz' | 'flashcards', material: StudyMaterial) => {
      setIsGenerating(true);
      setAiData(null); // clear stale data immediately
      setActiveAiView(type);

      try {
        let result;
        if (type === 'summary') result = await Gemini.generateSummary(material.text);
        else if (type === 'quiz') result = await Gemini.generateQuiz(material.text);
        else result = await Gemini.generateFlashcards(material.text);
        setAiData(result);
      } catch (err) {
        console.error('AI generation failed:', err);
        setAiData(null);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const openMaterial = (material: StudyMaterial) => {
    setCurrentMaterial(material);
    setAiData(null);
    handleGenerateAI('summary', material);
  };

  // ── Drag & Drop ──────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const fakeEvent = { target: { files: [file], value: '' } } as any;
    handleFileUpload(fakeEvent);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="ml-72 flex-1 p-8 pb-32">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="font-display text-3xl font-bold text-on-background">Welcome back 👋</h2>
            <p className="text-body-md text-slate-500">You've reached 85% of your weekly study goal. Keep it up!</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass-card flex items-center gap-2 px-4 py-2 rounded-full border border-white/40">
              <Icon name="local_fire_department" className="text-orange-500" fill />
              <span className="font-bold text-slate-700">12 Day Streak</span>
            </div>
            <button
              type="button"
              title="Notifications"
              className="p-2 glass-card rounded-full text-slate-600 hover:text-violet-600 transition-colors cursor-pointer"
            >
              <Icon name="notifications" />
            </button>
            <div className="w-10 h-10 rounded-full border-2 border-violet-200 p-0.5">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
                alt="User avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Study View or Dashboard */}
        {activeAiView !== 'none' ? (
          <div>
            {/* AI Tab Bar */}
            {currentMaterial && (
              <div className="flex gap-3 mb-6">
                {(['summary', 'quiz', 'flashcards'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => handleGenerateAI(t, currentMaterial)}
                    className={cn(
                      'px-5 py-2 rounded-full font-bold text-sm transition-all cursor-pointer capitalize',
                      activeAiView === t
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'bg-white/60 text-slate-600 hover:bg-white border border-white/60'
                    )}
                  >
                    {t === 'summary' && '📄 '}
                    {t === 'quiz' && '🧠 '}
                    {t === 'flashcards' && '🃏 '}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            )}
            <StudyView
              type={activeAiView}
              data={aiData}
              loading={isGenerating}
              onBack={() => { setActiveAiView('none'); setAiData(null); }}
              onChat={() => setShowChat(true)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Upload Area */}
            <section className="col-span-12 lg:col-span-8 glass-card rounded-[32px] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/10 blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-violet-900 flex items-center gap-2">
                    <Icon name="upload_file" />
                    Upload Study Materials
                  </h3>
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">PDF · TXT</span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  className="border-2 border-dashed border-violet-200 rounded-2xl p-12 flex flex-col items-center justify-center bg-white/20 hover:bg-white/40 transition-all cursor-pointer group/upload"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.txt"
                    title="Upload study materials"
                    aria-label="Upload study materials"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center text-white mb-4 shadow-xl group-hover/upload:scale-110 transition-transform">
                    {isUploading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
                        <Icon name="sync" className="text-3xl" />
                      </motion.div>
                    ) : (
                      <Icon name="add" className="text-3xl" />
                    )}
                  </div>
                  <p className="text-xl font-semibold text-slate-700 mb-1">
                    {isUploading ? 'Extracting insights…' : 'Drag & drop your lecture notes'}
                  </p>
                  <p className="text-sm text-slate-500">AI will automatically generate summaries and flashcards</p>
                  {uploadError && (
                    <p className="mt-4 text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl text-center max-w-sm">
                      ⚠️ {uploadError}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Current Focus */}
            <section className="col-span-12 lg:col-span-4 glass-card rounded-[32px] p-8">
              <h3 className="text-lg font-bold text-on-background mb-6">Current Focus</h3>
              <div className="space-y-6">
                {[
                  { label: 'Quantum Physics', progress: 72, color: 'from-violet-600 to-blue-500' },
                  { label: 'Organic Chemistry', progress: 45, color: 'from-pink-500 to-rose-400' },
                  { label: 'Neural Networks', progress: 89, color: 'from-blue-500 to-cyan-400' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-slate-700">{item.label}</span>
                      <span className="font-bold text-violet-600">{item.progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn('h-full bg-gradient-to-r', item.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-3 border border-violet-200 rounded-xl font-bold text-violet-600 hover:bg-white transition-all cursor-pointer">
                View All Courses
              </button>
            </section>

            {/* Recent Activity */}
            <section className="col-span-12 lg:col-span-5 glass-card rounded-[32px] p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-on-background">Recent Activity</h3>
                <a href="#" className="text-xs font-bold text-violet-500 hover:underline">View Log</a>
              </div>
              <div className="space-y-6">
                <ActivityItem
                  icon="auto_fix_high"
                  color="bg-violet-100 text-violet-600"
                  title="Generated 24 Flashcards"
                  subtitle="Bio 101 – Mitochondria Section"
                  time="2 hours ago"
                />
                <ActivityItem
                  icon="psychology"
                  color="bg-blue-100 text-blue-600"
                  title="New Study Session"
                  subtitle="Deep Work: Discrete Mathematics"
                  time="Yesterday"
                />
                <ActivityItem
                  icon="verified"
                  color="bg-emerald-100 text-emerald-600"
                  title="Quiz Completed"
                  subtitle="Result: 92% (A+)"
                  time="Oct 24, 2024"
                />
              </div>
            </section>

            {/* Library */}
            <section className="col-span-12 lg:col-span-7 glass-card rounded-[32px] p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-on-background">Your Library</h3>
                <div className="flex gap-2">
                  <button type="button" title="Grid view" className="p-2 bg-white/40 rounded-lg hover:bg-white/60 cursor-pointer">
                    <Icon name="grid_view" />
                  </button>
                  <button type="button" title="List view" className="p-2 bg-white/80 rounded-lg text-violet-600 shadow-sm cursor-pointer">
                    <Icon name="list" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.length === 0 ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-10 opacity-40">
                    <Icon name="library_books" className="text-5xl mb-2" />
                    <p className="text-slate-400 italic">No materials uploaded yet.</p>
                  </div>
                ) : (
                  materials.map(m => (
                    <LibraryItem key={m.id} material={m} onClick={() => openMaterial(m)} />
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Chat Overlay */}
      <AnimatePresence>
        {showChat && (
          <ChatUI context={currentMaterial?.text ?? ''} onClose={() => setShowChat(false)} />
        )}
      </AnimatePresence>

      {/* Footer */}
      {activeAiView === 'none' && (
        <footer className="ml-72 fixed bottom-0 left-0 right-0 flex justify-between items-center px-12 py-5 glass-card bg-white/40 rounded-t-3xl z-40">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">StudyAI</span>
            <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-bold">BETA</span>
          </div>
          <p className="text-xs text-slate-500">© 2025 StudyAI. Built for deep focus.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Support', 'Careers'].map(l => (
              <a key={l} href="#" className="text-slate-500 hover:text-violet-500 transition-colors text-xs">
                {l}
              </a>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
