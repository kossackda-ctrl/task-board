'use client';

export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assignee: string;
  startDate: string;
  endDate: string;
  memo: string;
  status: TaskStatus;
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface MemoEntry {
  id: string;
  projectId: string;
  text: string;
  createdAt: string;
}

export interface ColumnNames {
  todo: string;
  doing: string;
  done: string;
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  memos: MemoEntry[];
  stars: number;
  columnNames: ColumnNames;
}

const DEFAULT_STATE: AppState = {
  projects: [
    { id: '1', name: '夏休みの宿題', emoji: '📚', color: '#ef5350' },
    { id: '2', name: 'お手伝いリスト', emoji: '🏠', color: '#42a5f5' },
    { id: '3', name: '自由研究', emoji: '🔬', color: '#66bb6a' },
  ],
  tasks: [
    { id: 't1', projectId: '1', title: '算数プリント10枚', assignee: '田中', startDate: '2025-07-15', endDate: '2025-07-20', memo: '', status: 'todo' },
    { id: 't2', projectId: '1', title: '読書感想文を書く', assignee: '佐藤', startDate: '2025-07-18', endDate: '2025-07-25', memo: '', status: 'todo' },
    { id: 't3', projectId: '1', title: '絵日記をつける', assignee: '', startDate: '2025-07-01', endDate: '2025-08-31', memo: '', status: 'todo' },
    { id: 't4', projectId: '1', title: '理科の観察日記', assignee: '鈴木', startDate: '2025-07-10', endDate: '2025-07-30', memo: '', status: 'doing' },
    { id: 't5', projectId: '1', title: '計算ドリル 1〜20ページ', assignee: '田中', startDate: '2025-07-01', endDate: '2025-07-10', memo: '', status: 'done' },
    { id: 't6', projectId: '1', title: '漢字練習ノート', assignee: '佐藤', startDate: '2025-07-05', endDate: '2025-07-12', memo: '', status: 'done' },
  ],
  memos: [
    { id: 'm1', projectId: '1', text: 'https://www.nhk.or.jp/school/', createdAt: '2025-07-01T00:00:00Z' },
    { id: 'm2', projectId: '1', text: '8月10日までに理科の観察を終わらせること！', createdAt: '2025-07-02T00:00:00Z' },
  ],
  stars: 2,
  columnNames: { todo: 'やること', doing: 'やっている', done: 'おわった' },
};

const KEY = 'task-board-v1';

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
