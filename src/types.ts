export interface Task {
  id: string;
  title: string;
  category: 'course' | 'project' | 'ec' | 'career' | 'personal' | 'capture' | 'daily';
  course?: string;
  priority: 'high' | 'medium' | 'low';
  due?: string;
  completed: boolean;
  pomodoros: number;
  tags: string[];
  recurrence?: 'daily' | 'weekly' | 'none';
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  goalId?: string;
  subtasks: ProjectSubtask[];
  createdAt: string;
}

export interface ProjectSubtask {
  id: string;
  title: string;
  completed: boolean;
  due?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  exams: Exam[];
  lectures: Lecture[];
  homeworks: Homework[];
}

export interface Exam {
  id: string;
  title: string;
  date: string;
  prepStatus: 'not-started' | 'in-progress' | 'ready' | 'done';
}

export interface Lecture {
  id: string;
  title: string;
  studied: boolean;
  notes?: string;
}

export interface Homework {
  id: string;
  title: string;
  due?: string;
  completed: boolean;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: 'saved' | 'applied' | 'oa' | 'interview' | 'offer' | 'rejected';
  dateApplied?: string;
  notes?: string;
}

export interface GymSession {
  id: string;
  date: string;
  dayType: 'push' | 'pull' | 'legs' | 'cardio';
  exercises: GymExercise[];
  duration?: number;
}

export interface GymExercise {
  id: string;
  name: string;
  sets: { reps: number; weight?: number }[];
}

export interface Extracurricular {
  id: string;
  name: string;
  role?: string;
  tasks: { id: string; title: string; completed: boolean }[];
}

export interface Goal {
  id: string;
  title: string;
  category: 'career' | 'project' | 'gym' | 'study' | 'personal';
  progress: number;
  target: number;
  unit: string;
  source?: 'project' | 'career' | 'manual';
  projectId?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  history: string[];
  target: number;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  duration: number;
  completedAt: string;
  category: string;
}

export interface QuickCapture {
  id: string;
  text: string;
  createdAt: string;
  processed: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'meeting' | 'focus' | 'personal';
}

export interface AppState {
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  sessions: FocusSession[];
  captures: QuickCapture[];
  events: CalendarEvent[];
  projects: Project[];
  courses: Course[];
  jobApplications: JobApplication[];
  gymSessions: GymSession[];
  extracurriculars: Extracurricular[];
  dailies: { id: string; title: string; icon: string }[];
  dailyCompletions: { [date: string]: string[] };
  strategies: string[];
  motivationalQuotes?: string[];
}
