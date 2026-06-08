'use client';

import { useEffect, useState } from 'react';
import { Task, TaskStatus } from '@/lib/store';
import { useApp } from '@/context/AppContext';

interface CardModalProps {
  task: Task | null;
  projectId: string;
  defaultStatus?: TaskStatus;
  onClose: () => void;
  onComplete: () => void;
}

const EMPTY: Omit<Task, 'id' | 'projectId'> = {
  title: '', assignee: '', startDate: '', endDate: '', memo: '', status: 'todo',
};

export default function CardModal({ task, projectId, defaultStatus = 'todo', onClose, onComplete }: CardModalProps) {
  const { dispatch, state } = useApp();
  const [form, setForm] = useState(task ? { ...task } : { ...EMPTY, status: defaultStatus });

  useEffect(() => {
    setForm(task ? { ...task } : { ...EMPTY, status: defaultStatus });
  }, [task, defaultStatus]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.title.trim()) return;
    if (task) {
      dispatch({ type: 'UPDATE_TASK', payload: { ...form, id: task.id, projectId } as Task });
    } else {
      dispatch({ type: 'ADD_TASK', payload: { ...form, projectId } as Omit<Task, 'id'> });
    }
    onClose();
  };

  const complete = () => {
    if (task) {
      dispatch({ type: 'COMPLETE_TASK', payload: task.id });
      onComplete();
    }
    onClose();
  };

  const del = () => {
    if (task) dispatch({ type: 'DELETE_TASK', payload: task.id });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-extrabold text-indigo-700 mb-4">📝 カードの詳細</h3>

        <label className="block text-xs font-bold text-gray-500 mb-1">タイトル</label>
        <input
          className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 mb-3"
          value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="タスク名を入力"
        />

        <label className="block text-xs font-bold text-gray-500 mb-1">担当者</label>
        {state.members.length > 0 ? (
          <select
            className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 mb-3 cursor-pointer"
            value={form.assignee}
            onChange={e => set('assignee', e.target.value)}
          >
            <option value="">（なし）</option>
            {state.members.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        ) : (
          <input
            className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 mb-3"
            value={form.assignee} onChange={e => set('assignee', e.target.value)}
            placeholder="担当者の名前"
          />
        )}

        <label className="block text-xs font-bold text-gray-500 mb-1">開始日 → 終了日</label>
        <div className="flex gap-2 mb-3">
          <input
            type="date" className="flex-1 border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
            value={form.startDate} onChange={e => set('startDate', e.target.value)}
          />
          <input
            type="date" className="flex-1 border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
            value={form.endDate} onChange={e => set('endDate', e.target.value)}
          />
        </div>

        <label className="block text-xs font-bold text-gray-500 mb-1">メモ・コメント</label>
        <input
          className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 mb-3"
          value={form.memo} onChange={e => set('memo', e.target.value)}
          placeholder="詳細やURLを書こう"
        />

        <label className="block text-xs font-bold text-gray-500 mb-1">列を移動する</label>
        <select
          className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 mb-5 cursor-pointer"
          value={form.status} onChange={e => set('status', e.target.value)}
        >
          <option value="todo">📝 やること</option>
          <option value="doing">🔄 やっている</option>
          <option value="done">✅ おわった</option>
        </select>

        <div className="flex gap-2 flex-wrap justify-end">
          {task && (
            <button onClick={del} className="text-xs text-red-400 hover:text-red-600 px-3 py-2 font-bold">
              削除
            </button>
          )}
          <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl px-4 py-2 text-sm">
            キャンセル
          </button>
          {task && form.status !== 'done' && (
            <button onClick={complete} className="bg-green-400 hover:bg-green-500 text-white font-bold rounded-xl px-4 py-2 text-sm">
              ✅ おわった！
            </button>
          )}
          <button onClick={save} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl px-4 py-2 text-sm">
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
