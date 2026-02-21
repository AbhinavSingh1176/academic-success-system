import { Course } from '../types';
import { Icon } from './Icons';
import { genId } from '../store';

interface Props {
  courses: Course[];
  onUpdate: (courses: Course[]) => void;
}

export function StudyView({ courses, onUpdate }: Props) {
  const updateCourse = (id: string, updater: (c: Course) => Course) =>
    onUpdate(courses.map(c => c.id === id ? updater(c) : c));

  const addHomework = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    updateCourse(courseId, c => ({ ...c, homeworks: [...c.homeworks, { id: genId(), title: 'New homework', completed: false }] }));
  };

  const toggleHomework = (courseId: string, hwId: string) => {
    updateCourse(courseId, c => ({ ...c, homeworks: c.homeworks.map(h => h.id === hwId ? { ...h, completed: !h.completed } : h) }));
  };

  const toggleLecture = (courseId: string, lecId: string) => {
    updateCourse(courseId, c => ({ ...c, lectures: c.lectures.map(l => l.id === lecId ? { ...l, studied: !l.studied } : l) }));
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold font-mono tracking-tight">Study</h1>
      {courses.map(course => {
        const studiedCount = course.lectures.filter(l => l.studied).length;
        const hwDone = course.homeworks.filter(h => h.completed).length;
        const examReady = course.exams.filter(e => e.prepStatus === 'ready' || e.prepStatus === 'done').length;
        return (
          <div key={course.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">{course.code} — {course.name}</h2>
                <div className="flex gap-3 mt-1 text-xs font-mono text-zinc-500">
                  <span>Lectures: {studiedCount}/{course.lectures.length}</span>
                  <span>HW: {hwDone}/{course.homeworks.length}</span>
                  {course.exams.length > 0 && <span>Exams ready: {examReady}/{course.exams.length}</span>}
                </div>
              </div>
            </div>

            {course.exams.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">Exams</h3>
                <div className="space-y-2">
                  {course.exams.map(exam => (
                    <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                      <span className="font-medium">{exam.title}</span>
                      <span className="text-xs font-mono text-zinc-500">{exam.date}</span>
                      <select
                        value={exam.prepStatus}
                        onChange={e => updateCourse(course.id, c => ({ ...c, exams: c.exams.map(ex => ex.id === exam.id ? { ...ex, prepStatus: e.target.value as typeof ex.prepStatus } : ex) }))}
                        className="input py-1 text-xs w-32"
                      >
                        <option value="not-started">Not started</option>
                        <option value="in-progress">In progress</option>
                        <option value="ready">Ready</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.lectures.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">Lectures</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {course.lectures.map(lec => (
                    <button
                      key={lec.id}
                      onClick={() => toggleLecture(course.id, lec.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left transition ${lec.studied ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.02] hover:bg-white/[0.04]'}`}
                    >
                      {lec.studied ? <Icon.Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <span className="w-4 h-4 rounded border border-zinc-600 flex-shrink-0" />}
                      <span className={`text-sm truncate ${lec.studied ? 'line-through text-zinc-500' : ''}`}>{lec.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Homeworks</h3>
                <button onClick={() => addHomework(course.id)} className="text-xs text-zinc-400 hover:text-zinc-200"><Icon.Plus className="w-4 h-4 inline" /> Add</button>
              </div>
              <div className="space-y-2">
                {course.homeworks.map(hw => (
                  <div key={hw.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                    <button onClick={() => toggleHomework(course.id, hw.id)} className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${hw.completed ? 'bg-emerald-500' : 'border border-zinc-600'}`}>{hw.completed && <Icon.Check className="w-3 h-3 text-white" />}</button>
                    <span className={`flex-1 text-sm ${hw.completed ? 'line-through text-zinc-500' : ''}`}>{hw.title}</span>
                    {hw.due && <span className="text-xs font-mono text-zinc-500">{hw.due}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
