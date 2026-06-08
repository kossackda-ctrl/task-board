'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { MinuteEntry } from '@/lib/store';

export default function MinutesPage() {
  const { state, dispatch } = useApp();
  const minutes = state.minutes ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MinuteEntry | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTitle('');
    setFormContent('');
    setModalOpen(true);
  };

  const openEdit = (m: MinuteEntry) => {
    setEditing(m);
    setFormDate(m.date);
    setFormTitle(m.title);
    setFormContent(m.content);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;
    if (editing) {
      dispatch({ type: 'UPDATE_MINUTE', payload: { ...editing, date: formDate, title: formTitle.trim(), content: formContent } });
    } else {
      dispatch({ type: 'ADD_MINUTE', payload: { date: formDate, title: formTitle.trim(), content: formContent } });
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('この議事録を削除しますか？')) return;
    dispatch({ type: 'DELETE_MINUTE', payload: id });
  };

  const sorted = [...minutes].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-2xl px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors text-indigo-700">←</Link>
        <h1 className="text-xl font-extrabold text-indigo-700 flex-1">📝 議事録</h1>
        <button
          onClick={openNew}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          ＋ 新規作成
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📋</div>
          <div className="text-sm font-semibold">まだ議事録がありません</div>
          <div className="text-xs mt-1">「新規作成」から活動記録を追加しましょう</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(m => (
            <div key={m.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-indigo-50 transition-colors"
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
              >
                <div className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2 py-1 rounded-lg shrink-0">
                  {m.date}
                </div>
                <div className="flex-1 font-bold text-gray-700 text-sm truncate">{m.title}</div>
                <div className="text-gray-400 text-sm shrink-0">{expandedId === m.id ? '▲' : '▼'}</div>
              </button>

              {expandedId === m.id && (
                <div className="px-5 pb-4 border-t border-indigo-50">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap mt-3 font-sans leading-relaxed">
                    {m.content || <span className="text-gray-400 italic">内容なし</span>}
                  </pre>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      onClick={() => openEdit(m)}
                      className="text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      ✏️ 編集
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-xs font-bold bg-red-100 hover:bg-red-500 hover:text-white text-red-600 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* モーダル */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-extrabold text-indigo-700">
                {editing ? '✏️ 議事録を編集' : '📝 新しい議事録'}
              </h2>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              <label className="text-xs font-bold text-gray-500 block mb-1">日付</label>
              <input
                type="date"
                className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 mb-4"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
              />

              <label className="text-xs font-bold text-gray-500 block mb-1">タイトル</label>
              <input
                className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 mb-4"
                placeholder="例）第3回ミーティング"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
              />

              <label className="text-xs font-bold text-gray-500 block mb-1">内容</label>
              <textarea
                className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 resize-none h-48 font-sans"
                placeholder="活動内容、決定事項、次回の予定などを記入..."
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={!formTitle.trim()}
                className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
