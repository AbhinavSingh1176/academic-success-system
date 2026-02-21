import { Project } from '../types';
import { Icon } from './Icons';
import { genId } from '../store';

interface Props {
  projects: Project[];
  onUpdate: (projects: Project[]) => void;
}

export function ProjectsView({ projects, onUpdate }: Props) {
  const updateProject = (id: string, updater: (p: Project) => Project) =>
    onUpdate(projects.map(p => p.id === id ? updater(p) : p));

  const toggleSubtask = (projectId: string, subId: string) => {
    updateProject(projectId, p => ({ ...p, subtasks: p.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s) }));
  };

  const addSubtask = (projectId: string) => {
    updateProject(projectId, p => ({ ...p, subtasks: [...p.subtasks, { id: genId(), title: 'New subtask', completed: false }] }));
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold font-mono tracking-tight">Projects</h1>
      {projects.map(proj => {
        const done = proj.subtasks.filter(s => s.completed).length;
        const total = proj.subtasks.length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        return (
          <div key={proj.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">{proj.name}</h2>
                {proj.description && <p className="text-sm text-zinc-500 mt-1">{proj.description}</p>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-bold" style={{ color: 'var(--accent-primary)' }}>{pct}%</p>
                <p className="text-xs text-zinc-500">{done}/{total} subtasks</p>
              </div>
            </div>
            <div className="progress-track h-2 mb-4"><div className="progress-fill progress-cyan h-2" style={{ width: `${pct}%` }} /></div>
            <div className="space-y-2">
              {proj.subtasks.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                  <button onClick={() => toggleSubtask(proj.id, s.id)} className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${s.completed ? 'bg-emerald-500' : 'border border-zinc-600'}`}>{s.completed && <Icon.Check className="w-3 h-3 text-white" />}</button>
                  <span className={`flex-1 text-sm ${s.completed ? 'line-through text-zinc-500' : ''}`}>{s.title}</span>
                  {s.due && <span className="text-xs font-mono text-zinc-500">{s.due}</span>}
                </div>
              ))}
              <button onClick={() => addSubtask(proj.id)} className="w-full p-3 rounded-lg border border-dashed border-zinc-600 text-zinc-500 hover:border-zinc-500 hover:text-zinc-400 text-sm flex items-center justify-center gap-2">
                <Icon.Plus /> Add subtask
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
