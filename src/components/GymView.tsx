import { GymSession } from '../types';
import { Icon } from './Icons';
import { genId } from '../store';

const DAY_TYPES = ['push', 'pull', 'legs', 'cardio'] as const;

interface Props {
  sessions: GymSession[];
  onUpdate: (s: GymSession[]) => void;
}

export function GymView({ sessions, onUpdate }: Props) {
  const addSession = () => {
    const today = new Date().toISOString().split('T')[0];
    onUpdate([...sessions, { id: genId(), date: today, dayType: 'push', exercises: [] }]);
  };

  const last7 = sessions.slice(-7).reverse();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold font-mono tracking-tight">Gym</h1>
      <p className="text-sm text-zinc-500">PPL + Cardio. Log workouts below. <span className="text-zinc-600">(HEVY sync coming soon)</span></p>

      <div className="grid grid-cols-4 gap-2">
        {DAY_TYPES.map(dt => (
          <div key={dt} className="card p-4 text-center">
            <p className="text-xs font-mono uppercase text-zinc-500">{dt}</p>
            <p className="text-2xl font-bold mt-1">{sessions.filter(s => s.dayType === dt).length}</p>
          </div>
        ))}
      </div>

      <button onClick={addSession} className="btn-primary flex items-center gap-2"><Icon.Plus /> Log Workout</button>

      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Recent sessions</h3>
        {last7.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center">No sessions yet. Log your first workout!</p>
        ) : (
          last7.map(s => (
            <div key={s.id} className="card p-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-sm text-zinc-400">{s.date}</span>
                <span className="ml-3 px-2 py-0.5 rounded text-xs font-medium bg-white/5">{s.dayType}</span>
              </div>
              <span className="text-sm text-zinc-500">{s.exercises.length} exercises</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
