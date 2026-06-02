'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MemoEntry } from '@/lib/store';

interface Props {
  projectId: string;
  memos: MemoEntry[];
}

function isUrl(text: string) {
  return text.startsWith('http://') || text.startsWith('https://');
}

export default function MemoSection({ projectId, memos }: Props) {
  const { dispatch, state } = useApp();
  const [text, setText] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [nameError, setNameError] = useState(false);

  const save = () => {
    const t = text.trim();
    if (!t) return;
    if (state.members.length > 0 && !selectedMember) {
      setNameError(true);
      return;
    }
    setNameError(false);
    dispatch({ type: 'ADD_MEMO', payload: { projectId, text: t, memberName: selectedMember } });
    setText('');
  };

  return (
    <div className="border-t-2 border-indigo-100 bg-white px-4 py-3 shrink-0">
      <div className="text-sm font-bold text-indigo-600 mb-2">📌 メモ・URL・コメント</div>
      <div className="flex gap-2">
        {state.members.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <select
              className={`border-2 rounded-xl px-2 py-1 text-xs outline-none bg-white text-gray-600 ${nameError ? 'border-red-400 focus:border-red-400' : 'border-indigo-200 focus:border-indigo-500'}`}
              value={selectedMember}
              onChange={e => { setSelectedMember(e.target.value); setNameError(false); }}
            >
              <option value="">名前を選ぶ ＊</option>
              {state.members.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {nameError && <span className="text-red-500 text-xs font-bold">名前を選んでね</span>}
          </div>
        )}
        <textarea
          className="flex-1 border-2 border-indigo-200 rounded-xl px-3 py-2 text-xs resize-none h-14 outline-none focus:border-indigo-500 font-sans text-gray-600"
          placeholder="URLやコメントをここに書こう！"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) save(); }}
        />
        <button
          onClick={save}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl px-4 text-xs transition-colors"
        >
          保存
        </button>
      </div>
      {memos.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5 max-h-20 overflow-y-auto">
          {memos.map(m => (
            <div key={m.id} className="bg-indigo-50 rounded-lg px-3 py-1.5 text-xs text-gray-600 break-all flex gap-1.5 items-start">
              {m.memberName && (
                <span className="font-bold text-indigo-700 shrink-0">{m.memberName}:</span>
              )}
              {isUrl(m.text)
                ? <span>📎 <a href={m.text} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">{m.text}</a></span>
                : <span>💬 {m.text}</span>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
