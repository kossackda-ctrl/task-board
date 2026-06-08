'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Task, TaskStatus } from '@/lib/store';
import { getLevel } from '@/lib/levels';
import TaskCard from '@/components/TaskCard';
import CardModal from '@/components/CardModal';
import GanttChart from '@/components/GanttChart';
import MemoSection from '@/components/MemoSection';
import Toast from '@/components/Toast';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, dispatch } = useApp();

  const project = state.projects.find(p => p.id === id);
  const tasks = state.tasks.filter(t => t.projectId === id);
  const memos = state.memos.filter(m => m.projectId === id);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');
  const [modalOpen, setModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const openNew = (status: TaskStatus) => {
    setSelectedTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleComplete = useCallback(() => {
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => setToastVisible(false), []);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        プロジェクトが見つかりません。
        <Link href="/" className="ml-2 text-indigo-500 underline">ホームへ</Link>
      </div>
    );
  }

  const lv = getLevel(state.stars);
  const cols: { status: TaskStatus; label: string; icon: string }[] = [
    { status: 'todo',  label: state.columnNames.todo,  icon: '📝' },
    { status: 'doing', label: state.columnNames.doing, icon: '🔄' },
    { status: 'done',  label: state.columnNames.done,  icon: '✅' },
  ];

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ヘッダー */}
      <div className="shrink-0" style={{ background: project.color }}>
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <Link href="/" className="text-2xl px-2 py-1 rounded-lg hover:bg-white/20 transition-colors">←</Link>
          <h1 className="font-extrabold text-lg">{project.emoji} {project.name}</h1>
          <div className="bg-white/20 rounded-full px-3 py-1.5 text-sm font-bold flex items-center gap-2">
            ⭐ {state.stars}
            <span className="bg-white/25 rounded-full px-2 py-0.5 text-xs">{lv.label}</span>
          </div>
        </div>
        {/* 進捗バー */}
        <div className="px-4 pb-3">
          <div className="text-xs text-white/80 font-semibold mb-1">
            {doneCount} / {totalCount} タスク完了 ({pct}%)
          </div>
          <div className="bg-white/25 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* メインエリア */}
      <div className="flex flex-1 min-h-0">
        {/* カラム */}
        <div className="flex gap-3 p-3 overflow-x-auto flex-1 md:flex-none md:shrink-0">
          {cols.map(col => {
            const colTasks = tasks.filter(t => t.status === col.status);
            return (
              <div
                key={col.status}
                className={`rounded-2xl w-52 min-w-52 flex flex-col max-h-full transition-colors ${dragOverStatus === col.status ? 'bg-indigo-200 ring-2 ring-indigo-400' : 'bg-indigo-100'}`}
                onDragOver={e => { e.preventDefault(); setDragOverStatus(col.status); }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={e => {
                  e.preventDefault();
                  if (draggingId) {
                    const task = tasks.find(t => t.id === draggingId);
                    if (task && task.status !== col.status) {
                      dispatch({ type: 'UPDATE_TASK', payload: { ...task, status: col.status } });
                    }
                  }
                  setDraggingId(null);
                  setDragOverStatus(null);
                }}
              >
                <div className="flex items-center justify-between px-3 py-2.5 font-bold text-sm text-indigo-700 border-b-2 border-indigo-200">
                  <span>{col.icon} {col.label}</span>
                  <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">{colTasks.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                  {colTasks.map(t => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDraggingId(t.id)}
                      onDragEnd={() => { setDraggingId(null); setDragOverStatus(null); }}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <TaskCard task={t} onClick={() => openEdit(t)} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => openNew(col.status)}
                  className="m-2 mt-0 py-2 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-500 text-xs font-bold hover:bg-indigo-200 transition-colors"
                >
                  ＋ カードを追加
                </button>
              </div>
            );
          })}
        </div>

        {/* メモ欄 (PC: カンバンとガントの間) */}
        <div className="flex-1 min-w-48 border-l-2 border-indigo-100 bg-white hidden md:flex flex-col overflow-hidden">
          <MemoSection projectId={id} memos={memos} fullHeight />
        </div>

        {/* ガントチャート */}
        <div className="w-80 min-w-80 border-l-2 border-indigo-100 bg-white hidden md:flex flex-col overflow-hidden">
          <GanttChart tasks={tasks} />
        </div>
      </div>

      {/* メモ欄 (モバイルのみ) */}
      <div className="md:hidden">
        <MemoSection projectId={id} memos={memos} />
      </div>

      {/* モーダル */}
      {modalOpen && (
        <CardModal
          task={selectedTask}
          projectId={id}
          defaultStatus={defaultStatus}
          onClose={closeModal}
          onComplete={handleComplete}
        />
      )}

      {/* トースト */}
      <Toast stars={state.stars} visible={toastVisible} onHide={hideToast} />
    </div>
  );
}
