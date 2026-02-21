import { Icon } from './Icons';

interface Daily {
  id: string;
  title: string;
  icon: string;
}

interface Props {
  dailies: Daily[];
  completedIds: string[];
  onToggle: (id: string) => void;
}

export function DailiesSection({ dailies, completedIds, onToggle }: Props) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 mb-4">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {dailies.map(d => {
          const completed = completedIds.includes(d.id);
          return (
          <button
            key={d.id}
            onClick={() => onToggle(d.id)}
            className={`daily-card flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
              completed
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600'
            }`}
          >
            <span className="text-2xl">{d.icon}</span>
            <span className="text-xs font-medium text-zinc-300 text-center leading-tight">{d.title}</span>
            {completed && <Icon.Check className="w-4 h-4 text-emerald-500" />}
          </button>
        );})}
      </div>
    </section>
  );
}
