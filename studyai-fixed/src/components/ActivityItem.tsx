import { Icon } from './Icon';
import { cn } from '@/src/lib/utils';

export function ActivityItem({ icon, color, title, subtitle, time }: {
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", color)}>
        <Icon name={icon} className="text-xl" />
      </div>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="text-sm text-slate-500">{subtitle}</p>
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{time}</span>
      </div>
    </div>
  );
}
