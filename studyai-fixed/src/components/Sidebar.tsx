import { cn } from '@/src/lib/utils';
import { Icon } from './Icon';

const NAV_ITEMS = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { id: 'progress', icon: 'insights', label: 'My Progress' },
  { id: 'flashcards', icon: 'style', label: 'Flashcards' },
  { id: 'groups', icon: 'group', label: 'Study Groups' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
];

export function Sidebar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  return (
    <aside className="fixed left-0 top-0 h-[calc(100vh-48px)] w-64 m-6 rounded-2xl glass-sidebar z-50 flex flex-col py-6">
      {/* Logo */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-200">
          <Icon name="auto_stories" className="text-white" fill />
        </div>
        <div>
          <h1 className="font-display text-lg font-black text-violet-600 tracking-tight">StudyAI</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Deep Focus Mode</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer',
              activeTab === item.id
                ? 'bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg'
                : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
            )}
            aria-current={activeTab === item.id ? 'page' : undefined}
          >
            <Icon name={item.icon} fill={activeTab === item.id} />
            <span className="text-[14px] font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-4 mt-auto space-y-4">
        <button className="w-full bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer">
          <Icon name="add" className="text-sm" />
          New Session
        </button>
        <div className="pt-4 border-t border-slate-200/50">
          <a
            href="#"
            className="text-slate-400 hover:text-violet-600 px-4 py-2 flex items-center gap-3 text-sm transition-colors"
          >
            <Icon name="help_outline" />
            Help Center
          </a>
        </div>
      </div>
    </aside>
  );
}
