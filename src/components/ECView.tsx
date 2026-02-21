import { Extracurricular } from '../types';
import { Icon } from './Icons';
import { genId } from '../store';

interface Props {
  ecs: Extracurricular[];
  onUpdate: (ecs: Extracurricular[]) => void;
}

export function ECView({ ecs, onUpdate }: Props) {
  const toggleTask = (ecId: string, taskId: string) => {
    onUpdate(ecs.map(ec => ec.id !== ecId ? ec : { ...ec, tasks: ec.tasks.map(t => t.id !== taskId ? t : { ...t, completed: !t.completed }) }));
  };

  const addTask = (ecId: string) => {
    onUpdate(ecs.map(ec => ec.id !== ecId ? ec : { ...ec, tasks: [...ec.tasks, { id: genId(), title: 'New task', completed: false }] }));
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold font-mono tracking-tight">Extracurriculars</h1>
      {ecs.map(ec => {
        const done = ec.tasks.filter(t => t.completed).length;
        const total = ec.tasks.length;
        return (
          <div key={ec.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">{ec.name}</h2>
                {ec.role && <p className="text-sm text-zinc-500">{ec.role}</p>}
              </div>
              <span className="font-mono text-sm text-zinc-500">{done}/{total}</span>
            </div>
            <div className="space-y-2">
              {ec.tasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <button onClick={() => toggleTask(ec.id, t.id)} className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${t.completed ? 'bg-emerald-500' : 'border border-zinc-600'}`}>{t.completed && <Icon.Check className="w-3 h-3 text-white" />}</button>
                  <span className={`flex-1 text-sm ${t.completed ? 'line-through text-zinc-500' : ''}`}>{t.title}</span>
                </div>
              ))}
              <button onClick={() => addTask(ec.id)} className="w-full p-2 rounded-lg border border-dashed border-zinc-600 text-zinc-500 hover:border-zinc-500 text-sm flex items-center justify-center gap-2"><Icon.Plus /> Add task</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
