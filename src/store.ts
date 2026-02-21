import { AppState } from './types';

const STORAGE_KEY = 'nexus_data';

const today = () => new Date().toISOString().split('T')[0];

const defaultState: AppState = {
  tasks: [],
  goals: [
    { id: 'g1', title: 'Land Summer 2026 Internship', category: 'career', progress: 0, target: 5, unit: 'offers', source: 'career' },
    { id: 'g2', title: 'Complete Vibration Isolation Project', category: 'project', progress: 0, target: 100, unit: '%', source: 'project', projectId: 'p1' },
    { id: 'g3', title: 'Applications Sent', category: 'career', progress: 0, target: 100, unit: 'apps', source: 'career' },
    { id: 'g4', title: 'Gym This Semester', category: 'gym', progress: 0, target: 50, unit: 'sessions', source: 'manual' },
  ],
  habits: [
    { id: 'h1', name: 'Wake up by 7AM', icon: '🌅', streak: 0, history: [], target: 7 },
    { id: 'h2', name: 'Study Block', icon: '📚', streak: 0, history: [], target: 7 },
    { id: 'h3', name: 'No Phone First Hour', icon: '📵', streak: 0, history: [], target: 7 },
  ],
  dailies: [
    { id: 'd1', title: 'Review today\'s schedule', icon: '📋' },
    { id: 'd2', title: 'Check deadlines', icon: '⏰' },
    { id: 'd3', title: '1 pomodoro on top task', icon: '🍅' },
    { id: 'd4', title: 'Update job applications', icon: '💼' },
    { id: 'd5', title: 'Evening review', icon: '📝' },
  ],
  dailyCompletions: {},
  projects: [
    {
      id: 'p1',
      name: 'Vibration Isolation Module',
      description: 'Project with skills to stand out',
      goalId: 'g2',
      subtasks: [
        { id: 'ps1', title: 'Research & spec', completed: true },
        { id: 'ps2', title: 'CAD design', completed: false },
        { id: 'ps3', title: 'Prototype', completed: false },
        { id: 'ps4', title: 'Testing & iteration', completed: false },
      ],
      createdAt: today(),
    },
    {
      id: 'p2',
      name: 'Productivity Device',
      description: 'Side quest project',
      subtasks: [
        { id: 'ps5', title: 'Define concept', completed: false },
        { id: 'ps6', title: 'Build MVP', completed: false },
      ],
      createdAt: today(),
    },
  ],
  courses: [
    {
      id: 'c1',
      code: 'MA 30300',
      name: 'Differential Equations',
      exams: [{ id: 'e1', title: 'Midterm', date: today(), prepStatus: 'not-started' }],
      lectures: [
        { id: 'l1', title: 'Lec 1-3: Intro', studied: true },
        { id: 'l2', title: 'Lec 4-6: ODEs', studied: false },
      ],
      homeworks: [{ id: 'hw1', title: 'HW 3', due: today(), completed: false }],
    },
    {
      id: 'c2',
      code: 'ME 30800',
      name: 'Fluid Mechanics',
      exams: [],
      lectures: [],
      homeworks: [{ id: 'hw2', title: 'Problem Set 2', due: today(), completed: false }],
    },
    {
      id: 'c3',
      code: 'ME 36500',
      name: 'Systems & Control',
      exams: [],
      lectures: [],
      homeworks: [{ id: 'hw3', title: 'Lab Report', due: today(), completed: false }],
    },
    {
      id: 'c4',
      code: 'ME 32300',
      name: 'Mechanics of Materials',
      exams: [],
      lectures: [],
      homeworks: [],
    },
    {
      id: 'c5',
      code: 'GER 10200',
      name: 'German II',
      exams: [],
      lectures: [],
      homeworks: [],
    },
  ],
  jobApplications: [
    { id: 'j1', company: 'Tesla', role: 'ME Intern', status: 'applied', dateApplied: today() },
    { id: 'j2', company: 'Rivian', role: 'ME Intern', status: 'saved' },
    { id: 'j3', company: 'Cummins', role: 'Intern', status: 'applied' },
  ],
  gymSessions: [],
  extracurriculars: [
    {
      id: 'ec1',
      name: 'ASME Racing',
      role: 'Powertrains',
      tasks: [
        { id: 'ect1', title: 'CVT Mount Design Review', completed: false },
        { id: 'ect2', title: 'Exhaust mount', completed: false },
      ],
    },
    {
      id: 'ec2',
      name: 'PASE',
      role: 'Board - PD Committee',
      tasks: [{ id: 'ect3', title: 'Mock Career Fair prep', completed: false }],
    },
  ],
  sessions: [],
  captures: [],
  events: [
    { id: 'ev1', title: 'MA 30300', day: 'MWF', startTime: '08:30', endTime: '09:20', type: 'class' },
    { id: 'ev2', title: 'ME 36500 Lec', day: 'MW', startTime: '09:30', endTime: '10:20', type: 'class' },
    { id: 'ev3', title: 'GER 10200', day: 'MWF', startTime: '11:30', endTime: '12:20', type: 'class' },
    { id: 'ev4', title: 'ME 30800', day: 'MWF', startTime: '12:30', endTime: '13:20', type: 'class' },
    { id: 'ev5', title: 'ME 32300', day: 'MWF', startTime: '13:30', endTime: '14:20', type: 'class' },
    { id: 'ev6', title: 'ME 36500 Lab', day: 'T', startTime: '14:30', endTime: '17:20', type: 'class' },
    { id: 'ev7', title: 'ME 32301 Lab', day: 'R', startTime: '13:30', endTime: '17:20', type: 'class' },
    { id: 'ev8', title: 'ASME Racing', day: 'R', startTime: '18:30', endTime: '20:30', type: 'meeting' },
    { id: 'ev9', title: 'PASE Meeting', day: 'W', startTime: '19:00', endTime: '20:00', type: 'meeting' },
  ],
  motivationalQuotes: [
    "The best time to start was yesterday. The next best time is now.",
    "Small steps lead to big changes.",
    "Focus on progress, not perfection.",
    "Discipline is choosing what you want most over what you want now.",
    "Done is better than perfect.",
  ],
  strategies: [
    "Use morning energy (7-9AM) for hardest tasks before classes",
    "Time-block TR free periods for deep work on projects",
    "Batch similar tasks: all homework in one session",
    "2-minute rule: if it takes <2 min, do it now",
    "Plan tomorrow's top 3 priorities before bed",
  ],
};

export const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('momentum_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      return migrateAndMerge(defaultState, parsed);
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return defaultState;
};

function migrateAndMerge(defaults: AppState, saved: Record<string, unknown>): AppState {
  const merged = { ...defaults };
  if (saved.tasks && Array.isArray(saved.tasks) && saved.tasks.length > 0) {
    merged.tasks = saved.tasks as AppState['tasks'];
  }
  if (saved.habits && Array.isArray(saved.habits)) merged.habits = saved.habits as AppState['habits'];
  if (saved.events && Array.isArray(saved.events)) merged.events = saved.events as AppState['events'];
  if (saved.sessions && Array.isArray(saved.sessions)) merged.sessions = saved.sessions as AppState['sessions'];
  if (saved.captures && Array.isArray(saved.captures)) merged.captures = saved.captures as AppState['captures'];
  if (saved.strategies && Array.isArray(saved.strategies)) merged.strategies = saved.strategies as AppState['strategies'];
  if (saved.motivationalQuotes && Array.isArray(saved.motivationalQuotes)) merged.motivationalQuotes = saved.motivationalQuotes as string[];
  if (saved.projects && Array.isArray(saved.projects)) merged.projects = saved.projects as AppState['projects'];
  if (saved.courses && Array.isArray(saved.courses)) merged.courses = saved.courses as AppState['courses'];
  if (saved.jobApplications && Array.isArray(saved.jobApplications)) merged.jobApplications = saved.jobApplications as AppState['jobApplications'];
  if (saved.gymSessions && Array.isArray(saved.gymSessions)) merged.gymSessions = saved.gymSessions as AppState['gymSessions'];
  if (saved.extracurriculars && Array.isArray(saved.extracurriculars)) merged.extracurriculars = saved.extracurriculars as AppState['extracurriculars'];
  if (saved.dailies && Array.isArray(saved.dailies)) merged.dailies = saved.dailies as AppState['dailies'];
  if (saved.dailyCompletions && typeof saved.dailyCompletions === 'object') merged.dailyCompletions = saved.dailyCompletions as AppState['dailyCompletions'];
  if (saved.goals && Array.isArray(saved.goals)) merged.goals = saved.goals as AppState['goals'];
  return merged;
}

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
};

export const genId = () => Math.random().toString(36).substr(2, 9);
