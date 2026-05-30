'use client';

import { useState } from 'react';

interface Props {
  onEnter: (code: string) => void;
}

export default function RoomEntry({ onEnter }: Props) {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    const normalized = code.trim().toLowerCase();
    if (!normalized) return;
    onEnter(normalized);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50 px-4">
      <div className="bg-white rounded-3xl p-8 shadow-md w-full max-w-sm text-center">
        <div className="text-6xl mb-4">🔑</div>
        <h1 className="text-xl font-extrabold text-indigo-700 mb-2">タスクボードへようこそ</h1>
        <p className="text-sm text-gray-400 mb-6">グループの合言葉を入力してね</p>
        <input
          className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-center text-lg font-bold outline-none focus:border-indigo-500 mb-4"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="合言葉を入力..."
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold py-3 rounded-xl text-lg transition-colors"
        >
          はじめる 🚀
        </button>
      </div>
    </div>
  );
}
