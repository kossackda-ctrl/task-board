'use client';

import { Task } from '@/lib/store';

interface Props {
  task: Task;
  onClick: () => void;
}

const TAG_COLORS = [
  'bg-red-100 text-red-700',
  'bg-blue-100 text-blue-700',
  'bg-orange-100 text-orange-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
];

function assigneeColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + h * 31;
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
}

function fmtDate(d: string) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${parseInt(m)}/${parseInt(day)}`;
}

export default function TaskCard({ task, onClick }: Props) {
  const isDone = task.status === 'done';
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-3 shadow-sm cursor-pointer border-l-4 transition-shadow hover:shadow-md
        ${isDone ? 'border-green-400 opacity-70' : 'border-indigo-400'}`}
    >
      <div className="text-sm font-semibold text-gray-700 mb-1">{task.title}</div>
      <div className="flex flex-wrap gap-1 items-center">
        {isDone && (
          <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ 完了</span>
        )}
        {task.assignee && !isDone && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${assigneeColor(task.assignee)}`}>
            {task.assignee}
          </span>
        )}
        {(task.startDate || task.endDate) && (
          <span className="text-xs text-gray-400">
            📅 {fmtDate(task.startDate)}{task.endDate ? ` → ${fmtDate(task.endDate)}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
