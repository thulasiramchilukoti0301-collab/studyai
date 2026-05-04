import { Icon } from './Icon';
import { cn } from '@/src/lib/utils';
import { StudyMaterial } from '@/src/types';

export function LibraryItem({
  material,
  onClick,
}: {
  material: StudyMaterial;
  onClick: () => void;
}) {
  const isPdf = material.type === 'pdf';
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className={cn(
        'p-4 bg-white/40 rounded-2xl border border-white/60 hover:border-violet-200',
        'transition-all flex items-center gap-4 cursor-pointer group hover:shadow-md'
      )}
      aria-label={`Open ${material.name}`}
    >
      <div
        className={cn(
          'w-12 h-16 rounded-lg flex items-center justify-center transition-all shrink-0',
          'bg-violet-600/10 text-violet-600 group-hover:bg-violet-600 group-hover:text-white'
        )}
      >
        <Icon name={isPdf ? 'description' : 'article'} className="text-3xl" />
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-slate-800 truncate">{material.name}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{material.size}</p>
        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
          {isPdf ? 'PDF' : 'TXT'}
        </span>
      </div>
    </div>
  );
}
