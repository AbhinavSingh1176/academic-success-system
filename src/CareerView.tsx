import { JobApplication } from '../types';
import { Icon } from './Icons';
import { genId } from '../store';

const STATUS_COLORS: Record<string, string> = {
  saved: 'bg-zinc-600',
  applied: 'bg-blue-500/20 text-blue-400',
  oa: 'bg-violet-500/20 text-violet-400',
  interview: 'bg-amber-500/20 text-amber-400',
  offer: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-rose-500/20 text-rose-400',
};

interface Props {
  applications: JobApplication[];
  onUpdate: (apps: JobApplication[]) => void;
}

export function CareerView({ applications, onUpdate }: Props) {
  const addApp = () => onUpdate([...applications, { id: genId(), company: 'New Company', role: 'Role', status: 'saved' }]);
  const updateApp = (id: string, u: Partial<JobApplication>) =>
    onUpdate(applications.map(a => a.id === id ? { ...a, ...u } : a));
  const deleteApp = (id: string) => onUpdate(applications.filter(a => a.id !== id));

  const stats = { applied: applications.filter(a => a.status === 'applied' || a.status === 'oa' || a.status === 'interview').length, offers: applications.filter(a => a.status === 'offer').length };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono tracking-tight">Career</h1>
        <div className="flex gap-4 text-sm font-mono">
          <span className="text-zinc-500">Applied: <span className="text-zinc-200">{stats.applied}</span></span>
          <span className="text-zinc-500">Offers: <span style={{ color: 'var(--accent-emerald)' }}>{stats.offers}</span></span>
        </div>
      </div>

      <button onClick={addApp} className="btn-primary flex items-center gap-2"><Icon.Plus /> Add Application</button>

      <div className="space-y-3">
        {applications.map(app => (
          <div key={app.id} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-100">{app.company}</p>
              <p className="text-sm text-zinc-500">{app.role}</p>
              {app.dateApplied && <p className="text-xs font-mono text-zinc-600 mt-1">Applied {app.dateApplied}</p>}
            </div>
            <select
              value={app.status}
              onChange={e => updateApp(app.id, { status: e.target.value as JobApplication['status'] })}
              className={`input py-2 w-28 text-sm ${STATUS_COLORS[app.status]}`}
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="oa">OA</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={() => deleteApp(app.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded"><Icon.Trash /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
