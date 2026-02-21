import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Task, Goal, QuickCapture, CalendarEvent, FocusSession } from './types';
import { loadState, saveState, genId } from './store';
import { Icon } from './components/Icons';
import { DailiesSection } from './components/DailiesSection';
import { StudyView } from './components/StudyView';
import { ProjectsView } from './components/ProjectsView';
import { CareerView } from './components/CareerView';
import { GymView } from './components/GymView';
import { ECView } from './components/ECView';

// Utility hooks and functions
const useKeyboard = (handlers: Record<string, () => void>) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = `${e.ctrlKey ? 'ctrl+' : ''}${e.key.toLowerCase()}`;
      if (handlers[key]) {
        e.preventDefault();
        handlers[key]();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlers]);
};

const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

export function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [view, setView] = useState<'dashboard' | 'study' | 'projects' | 'career' | 'gym' | 'ec' | 'habits' | 'schedule' | 'stats'>('dashboard');
  const [showCapture, setShowCapture] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingStrategyIndex, setEditingStrategyIndex] = useState<number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCommandBar, setShowCommandBar] = useState(false);
  const [commandBarQuery, setCommandBarQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'task' | 'goal' | 'event' | 'habit'; id: string; title?: string; onConfirm: () => void } | null>(null);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hey Abhinav! 👋 I'm your AI productivity coach. Ask me anything about focus, motivation, or how to tackle your tasks. What's on your mind?" }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [captureText, setCaptureText] = useState('');
  const timerRef = useRef<number | null>(null);
  const aiChatRef = useRef<HTMLDivElement>(null);

  // Auto-save
  useEffect(() => { saveState(state); }, [state]);

  // Timer
  useEffect(() => {
    if (timerActive && !timerPaused) {
      timerRef.current = window.setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerActive(false);
            const session: FocusSession = { id: genId(), taskId: timerTaskId || undefined, duration: 25, completedAt: new Date().toISOString(), category: timerTaskId ? state.tasks.find(t => t.id === timerTaskId)?.category || 'personal' : 'personal' };
            setState(p => ({ ...p, sessions: [...p.sessions, session], tasks: p.tasks.map(t => t.id === timerTaskId ? { ...t, pomodoros: t.pomodoros + 1 } : t) }));
            if ('Notification' in window && Notification.permission === 'granted') new Notification('🍅 Pomodoro Complete!', { body: 'Great work! Take a 5-minute break.' });
            return 25 * 60;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, timerPaused, timerTaskId, state.tasks]);

  // Notification permission
  useEffect(() => { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); }, []);

  // Keyboard shortcuts
  useKeyboard({
    'n': () => setShowCapture(true),
    't': () => setTimerActive(a => !a),
    'a': () => setShowAI(a => !a),
    'k': () => { setShowCommandBar(true); setCommandBarQuery(''); },
    '/': () => { setShowCommandBar(true); setCommandBarQuery(''); },
    'escape': () => { setShowCapture(false); setEditingTask(null); setEditingGoal(null); setEditingEvent(null); setEditingStrategyIndex(null); setShowAI(false); setShowCommandBar(false); setConfirmDelete(null); },
  });

  // Command bar search results
  const q = commandBarQuery.toLowerCase().trim();
  const today = new Date().toISOString().split('T')[0];
  const focusTasks = state.tasks.filter(t => !t.completed).sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    if (p[a.priority] !== p[b.priority]) return p[a.priority] - p[b.priority];
    const da = a.due ? new Date(a.due).getTime() : Infinity;
    const db = b.due ? new Date(b.due).getTime() : Infinity;
    return da - db;
  });
  const doNextTask = focusTasks[0];

  const cmdTasks = q ? state.tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 5) : [];
  const cmdNav = [
    { id: 'dashboard', label: 'Dashboard', view: 'dashboard' as const },
    { id: 'study', label: 'Study', view: 'study' as const },
    { id: 'projects', label: 'Projects', view: 'projects' as const },
    { id: 'career', label: 'Career', view: 'career' as const },
    { id: 'gym', label: 'Gym', view: 'gym' as const },
    { id: 'ec', label: 'Extracurriculars', view: 'ec' as const },
    { id: 'habits', label: 'Habits', view: 'habits' as const },
    { id: 'schedule', label: 'Schedule', view: 'schedule' as const },
    { id: 'stats', label: 'Analytics', view: 'stats' as const },
  ].filter(n => q ? n.label.toLowerCase().includes(q) : true);
  const cmdActions = [
    { id: 'capture', label: 'Quick capture', icon: '✏️', run: () => { setShowCommandBar(false); setShowCapture(true); } },
    { id: 'timer', label: 'Start timer', icon: '🍅', run: () => { setShowCommandBar(false); setTimerActive(true); } },
    { id: 'do-next', label: 'Focus on Do Next', icon: '🎯', run: () => { if (doNextTask) { setTimerTaskId(doNextTask.id); setTimerActive(true); setView('dashboard'); } setShowCommandBar(false); } },
    { id: 'ai', label: 'AI Coach', icon: '🧠', run: () => { setShowCommandBar(false); setShowAI(true); } },
  ].filter(a => q ? a.label.toLowerCase().includes(q) : true);

  // State updaters
  const updateTask = (id: string, u: Partial<Task>) => setState(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, ...u } : t) }));
  const addTask = (t: Omit<Task, 'id'>) => setState(p => ({ ...p, tasks: [...p.tasks, { ...t, id: genId() }] }));
  const deleteTask = (id: string) => setState(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== id) }));
  const updateGoal = (id: string, u: Partial<Goal>) => setState(p => ({ ...p, goals: p.goals.map(g => g.id === id ? { ...g, ...u } : g) }));
  const addGoal = (g: Omit<Goal, 'id'>) => setState(p => ({ ...p, goals: [...p.goals, { ...g, id: genId() }] }));
  const deleteGoal = (id: string) => setState(p => ({ ...p, goals: p.goals.filter(g => g.id !== id) }));
  const toggleHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setState(p => ({ ...p, habits: p.habits.map(h => {
      if (h.id !== id) return h;
      const done = h.history.includes(today);
      return { ...h, history: done ? h.history.filter(d => d !== today) : [...h.history, today], streak: done ? Math.max(0, h.streak - 1) : h.streak + 1 };
    })}));
  };
  const addHabit = (name: string, icon: string) => setState(p => ({ ...p, habits: [...p.habits, { id: genId(), name, icon, streak: 0, history: [], target: 7 }] }));
  const deleteHabit = (id: string) => setState(p => ({ ...p, habits: p.habits.filter(h => h.id !== id) }));
  const updateEvent = (id: string, u: Partial<CalendarEvent>) => setState(p => ({ ...p, events: p.events.map(e => e.id === id ? { ...e, ...u } : e) }));
  const saveNewEvent = (e: Omit<CalendarEvent, 'id'>) => setState(p => ({ ...p, events: [...p.events, { ...e, id: genId() }] }));
  const deleteEvent = (id: string) => setState(p => ({ ...p, events: p.events.filter(e => e.id !== id) }));
  const updateStrategy = (i: number, text: string) => setState(p => ({ ...p, strategies: p.strategies.map((s, j) => j === i ? text : s) }));
  const addStrategy = (text: string) => setState(p => ({ ...p, strategies: [...p.strategies, text] }));
  const deleteStrategy = (i: number) => setState(p => ({ ...p, strategies: p.strategies.filter((_, j) => j !== i) }));

  const setCourses = (courses: AppState['courses']) => setState(p => ({ ...p, courses }));
  const setProjects = (projects: AppState['projects']) => {
    setState(p => {
      const next = { ...p, projects };
      const goalUpdates = next.goals.map(g => {
        if (g.source !== 'project' || !g.projectId) return g;
        const proj = next.projects.find(pr => pr.id === g.projectId);
        if (!proj) return g;
        const done = proj.subtasks.filter(s => s.completed).length;
        const total = proj.subtasks.length;
        const progress = total ? Math.round((done / total) * 100) : 0;
        return { ...g, progress, target: 100 };
      });
      return { ...next, goals: goalUpdates };
    });
  };
  const setJobApplications = (jobApplications: AppState['jobApplications']) => {
    setState(p => ({
      ...p,
      jobApplications,
      goals: p.goals.map(g => {
        if (g.source !== 'career') return g;
        const applied = jobApplications.filter(a => ['applied', 'oa', 'interview', 'offer'].includes(a.status)).length;
        const offers = jobApplications.filter(a => a.status === 'offer').length;
        if (g.title.includes('Applications')) return { ...g, progress: applied };
        if (g.title.includes('Internship') || g.title.includes('offer')) return { ...g, progress: offers };
        return g;
      }),
    }));
  };
  const setGymSessions = (gymSessions: AppState['gymSessions']) => setState(p => ({
    ...p,
    gymSessions,
    goals: p.goals.map(g => g.category === 'gym' ? { ...g, progress: gymSessions.length } : g),
  }));
  const setExtracurriculars = (extracurriculars: AppState['extracurriculars']) => setState(p => ({ ...p, extracurriculars }));

  const toggleDaily = (id: string) => {
    const d = today;
    setState(p => {
      const completed = p.dailyCompletions?.[d] || [];
      const has = completed.includes(id);
      return { ...p, dailyCompletions: { ...(p.dailyCompletions || {}), [d]: has ? completed.filter(x => x !== id) : [...completed, id] } };
    });
  };

  const processCapture = (cap: QuickCapture) => {
    const t = cap.text.toLowerCase();
    let cat: Task['category'] = 'personal';
    let course: string | undefined;
    const courses = ['MA 30300', 'ME 30800', 'ME 36500', 'ME 32300', 'GER 10200'];
    for (const c of courses) if (t.includes(c.toLowerCase()) || t.includes(c.split(' ')[0].toLowerCase())) { cat = 'course'; course = c; break; }
    if (t.includes('resume') || t.includes('internship') || t.includes('apply')) cat = 'career';
    if (t.includes('asme') || t.includes('pase') || t.includes('racing')) cat = 'ec';
    if (t.includes('project') || t.includes('vibration') || t.includes('build')) cat = 'project';
    addTask({ title: cap.text, category: cat, course, priority: t.includes('urgent') || t.includes('asap') ? 'high' : 'medium', completed: false, pomodoros: 0, tags: [] });
    setState(p => ({ ...p, captures: p.captures.filter(c => c.id !== cap.id) }));
  };

  const addCapture = () => {
    if (!captureText.trim()) return;
    setState(p => ({ ...p, captures: [...p.captures, { id: genId(), text: captureText.trim(), createdAt: new Date().toISOString(), processed: false }] }));
    setCaptureText('');
    setShowCapture(false);
  };

  // AI Chat
  const handleAI = useCallback(() => {
    if (!aiInput.trim()) return;
    setAiMessages(m => [...m, { role: 'user', text: aiInput.trim() }]);
    const q = aiInput.toLowerCase();
    setAiInput('');
    setTimeout(() => {
      let r = '';
      if (q.includes('overwhelm') || q.includes('stress') || q.includes('too much')) r = "I hear you. When everything feels overwhelming, simplify: pick ONE task, the most important one. Complete it, then reassess. You don't need to do everything today. What's the single most critical thing right now?";
      else if (q.includes('focus') || q.includes('what should')) { const u = state.tasks.filter(t => !t.completed && t.priority === 'high'); r = u.length ? `Focus on: "${u[0].title}". It's high priority. Start a 25-min Pomodoro and just begin - starting is the hardest part! 💪` : "No high-priority tasks! Work on your projects or send out some applications."; }
      else if (q.includes('motivation') || q.includes('lazy') || q.includes('procrastinat')) r = "Procrastination usually comes from fear or feeling overwhelmed. Try the 2-minute rule: commit to just 2 minutes. Starting is hardest. Also, visualize yourself at Tesla/Rivian. What's one tiny step you can take right now?";
      else if (q.includes('internship') || q.includes('resume')) r = "For Tesla, Rivian, Meta:\n1. Tailor your resume per application\n2. Highlight CTRC research & ASME Racing\n3. Quantify achievements\n4. Network on LinkedIn\n5. Aim for 5-10 apps/week\n\nYour CVT design & thermal analysis experience is exactly what they want!";
      else if (q.includes('schedule') || q.includes('time')) r = "Your schedule insights:\n• MWF mornings = packed with classes\n• TR = power days for deep work!\n• 10:20-11:30 MWF = quick task time\n• Evenings work well for you\n\nWant help planning a specific day?";
      else if (q.includes('gym')) r = "Consistency > intensity. Try habit stacking: right after last class, go directly to gym. Don't go home first! Keep gym bag ready. Even 20 min counts. Which days work best?";
      else if (q.includes('help')) r = "I can help with:\n• What to focus on\n• Breaking down tasks\n• Motivation boosts\n• Day/week planning\n• Career advice\n• Study strategies\n• Habit building\n\nJust ask!";
      else r = "Good question! Let's dig deeper - what specific aspect would you like to explore? I'm here to help you crush your goals. 🎯";
      setAiMessages(m => [...m, { role: 'ai', text: r }]);
    }, 400);
  }, [aiInput, state.tasks]);

  useEffect(() => { aiChatRef.current?.scrollTo(0, aiChatRef.current.scrollHeight); }, [aiMessages]);

  // Stats
  const todaysTasks = state.tasks.filter(t => t.due === today);
  const completedToday = todaysTasks.filter(t => t.completed).length;
  const totalFocusToday = state.sessions.filter(s => s.completedAt.startsWith(today)).reduce((a, s) => a + s.duration, 0);
  const todayHabits = state.habits.filter(h => h.history.includes(today)).length;
  const upcomingDeadlines = state.tasks.filter(t => t.due && !t.completed).sort((a, b) => new Date(a.due!).getTime() - new Date(b.due!).getTime()).slice(0, 5);
  const timerProgress = (timerSeconds / (25 * 60)) * 100;
  const circumference = 2 * Math.PI * 80;

  const quotes = state.motivationalQuotes?.length ? state.motivationalQuotes : [
    "The best time to start was yesterday. The next best time is now.",
    "Small steps lead to big changes.",
    "Focus on progress, not perfection.",
  ];
  const dailyQuote = quotes[Math.abs(Math.floor(new Date().getTime() / 86400000)) % quotes.length];

  return (
    <div className="min-h-screen relative">
      <div className="mesh-bg" />
      <div className="aurora-bg" />
      <div className="dot-pattern" />
      <div className="noise-overlay" />

      {/* Command Bar */}
      {showCommandBar && (
        <div className="modal-backdrop flex items-start justify-center pt-[15vh] px-4" onClick={() => setShowCommandBar(false)}>
          <div className="command-bar w-full max-w-xl glass-card p-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-3 py-2 border-b border-white/5">
              <Icon.Search />
              <input value={commandBarQuery} onChange={e => setCommandBarQuery(e.target.value)} placeholder="Search tasks, navigate, or run action..." className="flex-1 bg-transparent outline-none text-sm" autoFocus />
              <kbd className="px-2 py-0.5 text-xs rounded bg-white/5 text-zinc-500">Esc</kbd>
            </div>
            <div className="max-h-72 overflow-y-auto py-2">
              {cmdTasks.length > 0 && (
                <div className="px-2 py-1"><p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Tasks</p>
                  {cmdTasks.map(t => (
                    <button key={t.id} onClick={() => { setEditingTask(t); setShowCommandBar(false); }} className="command-bar-item w-full text-left px-3 py-2 rounded-lg flex items-center gap-3">
                      <span className="tag tag-cyan">{t.category}</span><span className="truncate">{t.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {cmdNav.length > 0 && (
                <div className="px-2 py-1"><p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Navigate</p>
                  {cmdNav.map(n => (
                    <button key={n.id} onClick={() => { setView(n.view); setShowCommandBar(false); }} className="command-bar-item w-full text-left px-3 py-2 rounded-lg">{n.label}</button>
                  ))}
                </div>
              )}
              {cmdActions.length > 0 && (
                <div className="px-2 py-1"><p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Actions</p>
                  {cmdActions.map(a => (
                    <button key={a.id} onClick={a.run} className="command-bar-item w-full text-left px-3 py-2 rounded-lg flex items-center gap-3"><span>{a.icon}</span>{a.label}</button>
                  ))}
                </div>
              )}
              {!q && cmdTasks.length === 0 && cmdNav.length === 0 && cmdActions.length === 0 && (
                <div className="px-4 py-6 text-center text-zinc-500 text-sm">Type to search tasks, or pick an action</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="glass-card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Delete {confirmDelete.type}?</h3>
            <p className="text-sm text-zinc-400 mb-6">{confirmDelete.title ? `"${confirmDelete.title}"` : 'This action cannot be undone.'}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancel</button>
              <button onClick={confirmDelete.onConfirm} className="px-4 py-2 rounded-xl font-medium bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Capture Modal */}
      {showCapture && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setShowCapture(false)}>
          <div className="glass-card card p-6 w-full max-w-lg animate-float" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#08080a]" style={{ background: 'linear-gradient(135deg, var(--accent-primary), #00b4a0)' }}><Icon.Bolt /></div>
              <div><h3 className="font-semibold">Quick Capture</h3><p className="text-sm text-zinc-500">Dump it here, sort it later</p></div>
            </div>
            <textarea autoFocus value={captureText} onChange={e => setCaptureText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addCapture())} placeholder="What's on your mind? (Enter to save)" className="input h-32 resize-none" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowCapture(false)} className="btn-secondary">Cancel</button>
              <button onClick={addCapture} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setEditingTask(null)}>
          <div className="glass-card card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">Edit Task</h3>
            <div className="space-y-4">
              <input value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} className="input" placeholder="Task title" />
              <div className="grid grid-cols-2 gap-4">
                <select value={editingTask.category} onChange={e => setEditingTask({ ...editingTask, category: e.target.value as Task['category'] })} className="input">
                  <option value="course">Course</option><option value="project">Project</option><option value="ec">Extracurricular</option><option value="career">Career</option><option value="personal">Personal</option>
                </select>
                <select value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })} className="input">
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <input type="date" value={editingTask.due || ''} onChange={e => setEditingTask({ ...editingTask, due: e.target.value })} className="input" />
              <input value={editingTask.tags.join(', ')} onChange={e => setEditingTask({ ...editingTask, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} className="input" placeholder="Tags (comma separated)" />
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setConfirmDelete({ type: 'task', id: editingTask.id, title: editingTask.title, onConfirm: () => { deleteTask(editingTask.id); setEditingTask(null); setConfirmDelete(null); }})} className="text-rose-400 hover:text-rose-300 flex items-center gap-2"><Icon.Trash /> Delete</button>
              <div className="flex gap-3">
                <button onClick={() => setEditingTask(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => { updateTask(editingTask.id, editingTask); setEditingTask(null); }} className="btn-primary">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Edit Modal */}
      {editingGoal && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setEditingGoal(null)}>
          <div className="glass-card card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">Edit Goal</h3>
            <div className="space-y-4">
              <input value={editingGoal.title} onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })} className="input" placeholder="Goal title" />
              <div className="grid grid-cols-3 gap-4">
                <input type="number" value={editingGoal.progress} onChange={e => setEditingGoal({ ...editingGoal, progress: Number(e.target.value) })} className="input" placeholder="Progress" />
                <input type="number" value={editingGoal.target} onChange={e => setEditingGoal({ ...editingGoal, target: Number(e.target.value) })} className="input" placeholder="Target" />
                <input value={editingGoal.unit} onChange={e => setEditingGoal({ ...editingGoal, unit: e.target.value })} className="input" placeholder="Unit" />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setConfirmDelete({ type: 'goal', id: editingGoal.id, title: editingGoal.title, onConfirm: () => { deleteGoal(editingGoal.id); setEditingGoal(null); setConfirmDelete(null); }})} className="text-rose-400 hover:text-rose-300 flex items-center gap-2"><Icon.Trash /> Delete</button>
              <div className="flex gap-3">
                <button onClick={() => setEditingGoal(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => { updateGoal(editingGoal.id, editingGoal); setEditingGoal(null); }} className="btn-primary">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Edit Modal */}
      {editingEvent && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setEditingEvent(null)}>
          <div className="glass-card card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">{editingEvent.id ? 'Edit' : 'Add'} Event</h3>
            <div className="space-y-4">
              <input value={editingEvent.title} onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })} className="input" placeholder="Event title" />
              <div className="grid grid-cols-2 gap-4">
                <select value={editingEvent.day} onChange={e => setEditingEvent({ ...editingEvent, day: e.target.value })} className="input">
                  <option value="M">Monday</option><option value="T">Tuesday</option><option value="W">Wednesday</option><option value="R">Thursday</option><option value="F">Friday</option><option value="MW">Mon/Wed</option><option value="MWF">Mon/Wed/Fri</option><option value="TR">Tue/Thu</option>
                </select>
                <select value={editingEvent.type} onChange={e => setEditingEvent({ ...editingEvent, type: e.target.value as CalendarEvent['type'] })} className="input">
                  <option value="class">Class</option><option value="meeting">Meeting</option><option value="focus">Focus</option><option value="personal">Personal</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="time" value={editingEvent.startTime} onChange={e => setEditingEvent({ ...editingEvent, startTime: e.target.value })} className="input" />
                <input type="time" value={editingEvent.endTime} onChange={e => setEditingEvent({ ...editingEvent, endTime: e.target.value })} className="input" />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              {editingEvent.id && <button onClick={() => setConfirmDelete({ type: 'event', id: editingEvent.id, title: editingEvent.title, onConfirm: () => { deleteEvent(editingEvent.id); setEditingEvent(null); setConfirmDelete(null); }})} className="text-rose-400 hover:text-rose-300 flex items-center gap-2"><Icon.Trash /> Delete</button>}
              {!editingEvent.id && <div />}
              <div className="flex gap-3">
                <button onClick={() => setEditingEvent(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => { editingEvent.id ? updateEvent(editingEvent.id, editingEvent) : saveNewEvent(editingEvent); setEditingEvent(null); }} className="btn-primary">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Sidebar */}
      <div className={`slide-panel w-96 ${showAI ? 'open' : ''}`} style={{ background: 'rgba(18, 18, 21, 0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--accent-tertiary), #a78bfa)' }}><Icon.Brain /></div>
              <div><h3 className="font-semibold">AI Coach</h3><p className="text-xs text-zinc-500">Your productivity partner</p></div>
            </div>
            <button onClick={() => setShowAI(false)} className="p-2 hover:bg-white/5 rounded-lg transition"><Icon.X /></button>
          </div>
          <div ref={aiChatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'text-[#08080a]' : 'bg-white/[0.04] border border-white/[0.06]'}`} style={m.role === 'user' ? { background: 'linear-gradient(135deg, var(--accent-primary), #00b4a0)' } : undefined}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-2">
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAI()} placeholder="Ask me anything..." className="input flex-1" />
              <button onClick={handleAI} className="btn-primary px-4"><Icon.Send /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#08080a]/50 backdrop-blur-2xl border-b border-white/[0.06] relative">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[#08080a] glow-cyan" style={{ background: 'linear-gradient(135deg, var(--accent-primary), #00b4a0)' }}><Icon.Bolt /></div>
            <div><h1 className="font-bold text-lg tracking-tight">NEXUS</h1><p className="text-[10px] text-zinc-500 -mt-0.5 uppercase tracking-widest">Command Center</p></div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {(['dashboard', 'study', 'projects', 'career', 'gym', 'ec', 'habits', 'schedule', 'stats'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`nav-tab ${view === v ? 'active' : ''}`}>{v === 'ec' ? 'EC' : v.charAt(0).toUpperCase() + v.slice(1)}</button>
            ))}
          </nav>
          <button onClick={() => setMobileNavOpen(o => !o)} className="md:hidden p-2 rounded-lg hover:bg-white/5"><Icon.Menu /></button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCommandBar(true)} className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition text-zinc-400 hover:text-zinc-300 text-sm" title="Command Bar (K)"><Icon.Search /> <span>Search...</span> <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/5">K</kbd></button>
            {timerActive && <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg glow-border-cyan" style={{ background: 'rgba(0,229,199,0.08)', border: '1px solid rgba(0,229,199,0.2)' }}><span className="text-sm">🍅</span><span className="font-mono text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>{formatTime(timerSeconds)}</span></div>}
            <button onClick={() => setShowAI(true)} className="p-2 rounded-lg hover:bg-white/5 transition" title="AI Coach (A)"><Icon.Brain /></button>
            <button onClick={() => setShowCapture(true)} className="btn-primary px-3 py-2" title="Quick Capture (N)"><Icon.Plus /></button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0c0c0f] border-b border-white/5 p-4 max-w-7xl mx-auto rounded-b-xl" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="grid grid-cols-2 gap-2">
              {(['dashboard', 'study', 'projects', 'career', 'gym', 'ec', 'habits', 'schedule', 'stats'] as const).map(v => (
                <button key={v} onClick={() => { setView(v); setMobileNavOpen(false); }} className={`nav-tab text-left ${view === v ? 'active' : ''}`}>{v === 'ec' ? 'EC' : v.charAt(0).toUpperCase() + v.slice(1)}</button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 animate-page-in">
        {/* DASHBOARD */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Dailies - recurring at top */}
            {state.dailies?.length > 0 && (
              <DailiesSection
                dailies={state.dailies}
                completedIds={state.dailyCompletions?.[today] || []}
                onToggle={toggleDaily}
              />
            )}
            {/* Hero + Timer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card p-6">
                <h2 className="text-2xl font-bold mb-1 text-zinc-100">{getGreeting()}, <span className="text-gradient-cyan">Abhinav</span>! 👋</h2>
                <p className="text-zinc-400 mb-1">{completedToday > 0 ? `You've knocked out ${completedToday} task${completedToday > 1 ? 's' : ''} today. Keep the momentum!` : "Ready to make today count? Pick your first task and let's go!"}</p>
                <p className="text-sm text-zinc-500 italic mb-6 border-l-2 border-[var(--accent-primary)]/30 pl-4">"{dailyQuote}"</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="stat-card card"><p className="stat-value" style={{ color: 'var(--accent-primary)' }}>{completedToday}/{todaysTasks.length || '—'}</p><p className="stat-label">Tasks</p></div>
                  <div className="stat-card card"><p className="stat-value" style={{ color: '#a78bfa' }}>{totalFocusToday}m</p><p className="stat-label">Focus</p></div>
                  <div className="stat-card card"><p className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{todayHabits}/{state.habits.length}</p><p className="stat-label">Habits</p></div>
                  <div className="stat-card card"><p className="stat-value" style={{ color: 'var(--accent-secondary)' }}>{Math.max(0, ...state.habits.map(h => h.streak))}</p><p className="stat-label">Streak</p></div>
                </div>
              </div>
              <div className="card p-6 flex flex-col items-center justify-center">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Pomodoro Timer</p>
                <div className="timer-ring mb-4">
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <defs><linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00e5c7"/><stop offset="100%" stopColor="#00b4a0"/></linearGradient></defs>
                    <circle className="timer-ring-bg" cx="90" cy="90" r="80"/>
                    <circle className="timer-ring-progress" cx="90" cy="90" r="80" strokeDasharray={circumference} strokeDashoffset={circumference - (timerProgress / 100) * circumference}/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="font-mono text-4xl font-bold">{formatTime(timerSeconds)}</span></div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  {!timerActive ? <button onClick={() => setTimerActive(true)} className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition glow-cyan text-[#08080a]" style={{ background: 'linear-gradient(135deg, var(--accent-primary), #00b4a0)' }}><Icon.Play /></button> : (
                    <><button onClick={() => setTimerPaused(!timerPaused)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">{timerPaused ? <Icon.Play /> : <Icon.Pause />}</button>
                    <button onClick={() => { setTimerActive(false); setTimerSeconds(25 * 60); }} className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 transition"><Icon.Stop /></button></>
                  )}
                </div>
                <select value={timerTaskId || ''} onChange={e => setTimerTaskId(e.target.value || null)} className="input text-sm py-2">
                  <option value="">Link to task...</option>
                  {state.tasks.filter(t => !t.completed).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            </div>

            {/* Tasks, Deadlines, Habits */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2 text-zinc-200"><Icon.Target /> Today's Focus</h3>
                  <button onClick={() => addTask({ title: 'New Task', category: 'personal', priority: 'medium', due: today, completed: false, pomodoros: 0, tags: [] })} className="p-2 rounded-lg hover:bg-white/5 transition" title="Add task"><Icon.Plus /></button>
                </div>
                {doNextTask && (
                  <p className="text-xs text-zinc-500 mb-3 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" /> Do next: <span className="text-zinc-400 font-medium truncate">{doNextTask.title}</span></p>
                )}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {focusTasks.slice(0, 8).map(task => (
                    <div key={task.id} className={`task-item group priority-${task.priority} ${task.id === doNextTask?.id ? 'do-next' : ''}`}>
                      <button onClick={(e) => { e.stopPropagation(); updateTask(task.id, { completed: true }); }} className="checkbox flex-shrink-0"><Icon.Check /></button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-zinc-100 truncate">{task.title}</p>
                          {task.id === doNextTask?.id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-medium">Do next</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                          {task.course && <span className="px-1.5 py-0.5 rounded bg-white/5">{task.course}</span>}
                          {task.due && <span className="flex items-center gap-1"><Icon.Clock className="w-3 h-3" /> {daysUntil(task.due) === 0 ? 'Today' : daysUntil(task.due) === 1 ? 'Tomorrow' : `${daysUntil(task.due)}d`}</span>}
                          {task.pomodoros > 0 && <span>🍅 {task.pomodoros}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={(e) => { e.stopPropagation(); setTimerTaskId(task.id); setTimerActive(true); }} className="p-2 rounded-lg hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" title="Focus on this"><Icon.Play className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingTask(task); }} className="p-2 rounded-lg hover:bg-white/10"><Icon.Edit /></button>
                      </div>
                    </div>
                  ))}
                  {focusTasks.length === 0 && <div className="text-center py-12"><p className="text-zinc-500 text-sm">All clear! 🎉</p><p className="text-zinc-600 text-xs mt-1">Add a task or take a break</p></div>}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-zinc-200"><Icon.Clock /> Deadlines</h3>
                <div className="space-y-2">
                  {upcomingDeadlines.map(t => {
                    const d = daysUntil(t.due!);
                    const col = d <= 1 ? 'var(--accent-rose)' : d <= 3 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
                    return (
                      <div key={t.id} className="deadline-item flex items-center justify-between cursor-pointer" onClick={() => setEditingTask(t)}>
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium text-zinc-100 truncate">{t.title}</p><p className="text-xs text-zinc-500 mt-0.5">{t.course || t.category}</p></div>
                        <span className="font-mono font-bold text-sm px-2.5 py-1 rounded-lg shrink-0" style={{ background: `${col}20`, color: col }}>{d === 0 ? 'TODAY' : `${d}D`}</span>
                      </div>
                    );
                  })}
                  {upcomingDeadlines.length === 0 && <div className="text-center py-10"><p className="text-zinc-500 text-sm">No deadlines! 🎊</p></div>}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-zinc-200"><Icon.Fire /> Daily Habits</h3>
                <div className="space-y-2">
                  {state.habits.map(h => {
                    const done = h.history.includes(today);
                    return (
                      <button key={h.id} onClick={() => toggleHabit(h.id)} className={`habit-card w-full text-left ${done ? 'completed' : ''}`}>
                        <span className="text-2xl">{h.icon}</span>
                        <div className="flex-1"><p className="text-sm font-medium">{h.name}</p><p className="text-xs text-zinc-500">{h.streak} day streak</p></div>
                        {h.streak >= 3 && <span className="text-lg streak-fire">🔥</span>}
                        {done && <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white"><Icon.Check /></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Captures, Goals & Strategies */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4"><h3 className="font-semibold flex items-center gap-2 text-zinc-200"><Icon.Inbox /> Inbox</h3><span className="tag tag-cyan">{state.captures.length}</span></div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {state.captures.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                      <div className="flex-1 min-w-0"><p className="text-sm truncate">{c.text}</p><p className="text-xs text-zinc-500">{new Date(c.createdAt).toLocaleDateString()}</p></div>
                      <button onClick={() => processCapture(c)} className="tag tag-violet flex items-center gap-1"><Icon.Sparkle /> Process</button>
                    </div>
                  ))}
                  {state.captures.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">Inbox zero! Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs">N</kbd> to capture</p>}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-4"><h3 className="font-semibold flex items-center gap-2 text-zinc-200"><Icon.Target /> Goals</h3><button onClick={() => addGoal({ title: 'New Goal', category: 'personal', progress: 0, target: 100, unit: '%' })} className="p-1 hover:bg-white/5 rounded transition"><Icon.Plus /></button></div>
                <div className="space-y-4">
                  {state.goals.slice(0, 4).map(g => {
                    const pct = Math.min(100, (g.progress / g.target) * 100);
                    return (
                      <div key={g.id} className="group">
                        <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium">{g.title}</p><div className="flex items-center gap-2"><span className="text-xs text-zinc-500">{g.progress}/{g.target} {g.unit}</span><button onClick={() => setEditingGoal(g)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition"><Icon.Edit /></button></div></div>
                        <div className="progress-track"><div className="progress-fill progress-cyan" style={{ width: `${pct}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-4"><h3 className="font-semibold flex items-center gap-2 text-zinc-200"><Icon.Zap /> Strategies</h3><button onClick={() => { addStrategy('New strategy'); setEditingStrategyIndex(state.strategies.length); }} className="p-1 hover:bg-white/5 rounded transition"><Icon.Plus /></button></div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {state.strategies.map((s, i) => (
                    <div key={i} className="group flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition">
                      {editingStrategyIndex === i ? (
                        <div className="flex-1 flex gap-2">
                          <input value={s} onChange={e => updateStrategy(i, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') setEditingStrategyIndex(null); }} className="input flex-1 py-2 text-sm" autoFocus />
                          <button onClick={() => setEditingStrategyIndex(null)} className="btn-primary py-2 px-3 text-xs">Done</button>
                        </div>
                      ) : (
                        <>
                          <p className="flex-1 text-sm text-zinc-300">{s}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => setEditingStrategyIndex(i)} className="p-1.5 hover:bg-white/10 rounded"><Icon.Edit /></button>
                            <button onClick={() => deleteStrategy(i)} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded"><Icon.Trash /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TASKS */}
        {view === 'tasks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">All Tasks</h2><button onClick={() => addTask({ title: 'New Task', category: 'personal', priority: 'medium', completed: false, pomodoros: 0, tags: [] })} className="btn-primary flex items-center gap-2"><Icon.Plus /> Add Task</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(['course', 'career', 'project', 'ec', 'personal'] as const).map(cat => {
                const tasks = state.tasks.filter(t => t.category === cat);
                const icons: Record<string, string> = { course: '📚', career: '💼', project: '🔧', ec: '🏆', personal: '✨' };
                const labels: Record<string, string> = { course: 'Courses', career: 'Career', project: 'Projects', ec: 'Extracurriculars', personal: 'Personal' };
                return (
                  <div key={cat} className="card p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><span>{icons[cat]}</span> {labels[cat]}<span className="ml-auto tag tag-cyan">{tasks.filter(t => !t.completed).length}</span></h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {tasks.map(t => (
                        <div key={t.id} className={`task-item group ${t.completed ? 'opacity-50' : ''} priority-${t.priority}`}>
                          <button onClick={() => updateTask(t.id, { completed: !t.completed })} className={`checkbox flex-shrink-0 ${t.completed ? 'checked' : ''}`}>{t.completed && <Icon.Check />}</button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium text-zinc-100 truncate ${t.completed ? 'line-through text-zinc-500' : ''}`}>{t.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 flex-wrap">{t.pomodoros > 0 && <span>🍅 {t.pomodoros}</span>}{t.tags.map(tag => <span key={tag} className="tag tag-violet">{tag}</span>)}{t.course && <span className="px-1.5 py-0.5 rounded bg-white/5">{t.course}</span>}</div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            {!t.completed && <button onClick={() => { setTimerTaskId(t.id); setTimerActive(true); setView('dashboard'); }} className="p-2 rounded-lg hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" title="Focus"><Icon.Play className="w-4 h-4" /></button>}
                            <button onClick={() => setEditingTask(t)} className="p-2 rounded-lg hover:bg-white/10"><Icon.Edit /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GOALS */}
        {view === 'goals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Goals</h2><button onClick={() => addGoal({ title: 'New Goal', category: 'personal', progress: 0, target: 100, unit: '%' })} className="btn-primary flex items-center gap-2"><Icon.Plus /> Add Goal</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.goals.map(g => {
                const pct = Math.min(100, (g.progress / g.target) * 100);
                return (
                  <div key={g.id} className="card p-6 group">
                    <div className="flex items-start justify-between mb-4">
                      <div><p className="tag tag-cyan mb-2">{g.category}</p><h3 className="text-lg font-semibold">{g.title}</h3></div>
                      <button onClick={() => setEditingGoal(g)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg transition"><Icon.Edit /></button>
                    </div>
                    <div className="flex items-end gap-4 mb-4"><p className="text-4xl font-bold text-gradient-cyan">{g.progress}</p><p className="text-zinc-500 mb-1">/ {g.target} {g.unit}</p></div>
                    <div className="progress-track h-3"><div className="progress-fill progress-violet h-3" style={{ width: `${pct}%` }} /></div>
                    <p className="text-sm text-zinc-500 mt-2">{pct.toFixed(0)}% complete</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HABITS */}
        {view === 'habits' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Habits</h2><button onClick={() => { const n = prompt('Habit name:'); const i = prompt('Emoji:', '✨'); if (n) addHabit(n, i || '✨'); }} className="btn-primary flex items-center gap-2"><Icon.Plus /> Add Habit</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {state.habits.map(h => {
                const done = h.history.includes(today);
                const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0]; });
                return (
                  <div key={h.id} className="card p-5">
                    <div className="flex items-center justify-between mb-4"><span className="text-3xl">{h.icon}</span><button onClick={() => setConfirmDelete({ type: 'habit', id: h.id, title: h.name, onConfirm: () => { deleteHabit(h.id); setConfirmDelete(null); }})} className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition opacity-50 hover:opacity-100"><Icon.Trash /></button></div>
                    <h3 className="font-semibold mb-1">{h.name}</h3>
                    <div className="flex items-center gap-2 mb-4">{h.streak >= 3 && <span className="streak-fire">🔥</span>}<span className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{h.streak}</span><span className="text-sm text-zinc-500">day streak</span></div>
                    <div className="week-heatmap mb-4">{last7.map(d => <div key={d} className={`heatmap-day ${h.history.includes(d) ? 'filled' : ''}`} title={d} />)}</div>
                    <button onClick={() => toggleHabit(h.id)} className={`w-full py-3 rounded-xl font-medium transition ${done ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 hover:bg-white/10'}`}>{done ? '✓ Done Today' : 'Mark Complete'}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        {view === 'schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Schedule</h2><button onClick={() => setEditingEvent({ id: '', title: 'New Event', day: 'M', startTime: '09:00', endTime: '10:00', type: 'focus' })} className="btn-primary flex items-center gap-2"><Icon.Plus /> Add Event</button></div>
            <div className="card p-4 overflow-x-auto">
              <div className="schedule-grid min-w-[800px]">
                <div />{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => <div key={d} className="text-center font-semibold py-2 text-sm">{d}</div>)}
                {Array.from({ length: 12 }, (_, i) => i + 8).map(h => (
                  <div key={h} className="contents">
                    <div className="text-xs text-zinc-500 py-2 text-right pr-2">{h > 12 ? `${h - 12}p` : h === 12 ? '12p' : `${h}a`}</div>
                    {['M', 'T', 'W', 'R', 'F'].map(d => {
                      const evts = state.events.filter(e => e.day.includes(d) && parseInt(e.startTime.split(':')[0]) === h);
                      return (
                        <div key={d} className="schedule-cell">
                          {evts.map(e => <button key={e.id} onClick={() => setEditingEvent(e)} className={`schedule-event w-full event-${e.type}`}><p className="font-medium truncate">{e.title}</p><p className="text-zinc-400">{e.startTime}</p></button>)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4 text-sm flex-wrap"><span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-500" /> Classes</span><span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-violet-500" /> Meetings</span><span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500" /> Focus</span><span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-500" /> Personal</span></div>
          </div>
        )}

        {/* STATS */}
        {view === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card stat-card"><p className="stat-value" style={{ color: 'var(--accent-primary)' }}>{state.sessions.filter(s => { const d = new Date(s.completedAt); return d >= new Date(Date.now() - 7 * 86400000); }).reduce((a, s) => a + s.duration, 0)}</p><p className="stat-label">Mins (7d)</p></div>
              <div className="card stat-card"><p className="stat-value" style={{ color: '#a78bfa' }}>{state.sessions.length}</p><p className="stat-label">Pomodoros</p></div>
              <div className="card stat-card"><p className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{state.tasks.filter(t => t.completed).length}</p><p className="stat-label">Completed</p></div>
              <div className="card stat-card"><p className="stat-value" style={{ color: 'var(--accent-secondary)' }}>{state.habits.reduce((a, h) => a + h.history.length, 0)}</p><p className="stat-label">Habit Days</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Icon.Chart /> Focus by Category</h3>
                <div className="space-y-3">
                  {(['course', 'career', 'project', 'ec', 'personal'] as const).map(cat => {
                    const mins = state.sessions.filter(s => s.category === cat).reduce((a, s) => a + s.duration, 0);
                    const total = state.sessions.reduce((a, s) => a + s.duration, 0) || 1;
                    const colors: Record<string, string> = { course: 'progress-cyan', career: 'progress-violet', project: 'progress-emerald', ec: 'progress-cyan', personal: 'progress-violet' };
                    return (
                      <div key={cat}><div className="flex justify-between text-sm mb-1"><span className="capitalize">{cat}</span><span className="text-zinc-500">{mins}m</span></div><div className="progress-track"><div className={`progress-fill ${colors[cat]}`} style={{ width: `${(mins / total) * 100}%` }} /></div></div>
                    );
                  })}
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Icon.Brain /> Insights</h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,229,199,0.06)', border: '1px solid rgba(0,229,199,0.12)' }}><span style={{ color: 'var(--accent-primary)' }}>💡</span> Your best focus hours are mornings & evenings. Schedule deep work then.</div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}><span style={{ color: '#a78bfa' }}>🎯</span> {state.tasks.filter(t => !t.completed && t.priority === 'high').length} high-priority tasks remaining.</div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}><span style={{ color: 'var(--accent-emerald)' }}>🔥</span> Best streak: {Math.max(0, ...state.habits.map(h => h.streak))} days. Keep it going!</div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}><span style={{ color: 'var(--accent-secondary)' }}>⚡</span> TR are your power days. Use them for project work!</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Keyboard hints */}
      <div className="fixed bottom-4 left-4 hidden lg:flex items-center gap-4 text-xs text-zinc-600">
        <span><kbd className="px-1.5 py-0.5 bg-white/5 rounded">K</kbd> / <kbd className="px-1.5 py-0.5 bg-white/5 rounded">/</kbd> Command</span>
        <span><kbd className="px-1.5 py-0.5 bg-white/5 rounded">N</kbd> Capture</span>
        <span><kbd className="px-1.5 py-0.5 bg-white/5 rounded">T</kbd> Timer</span>
        <span><kbd className="px-1.5 py-0.5 bg-white/5 rounded">A</kbd> AI Coach</span>
      </div>
    </div>
  );
}
