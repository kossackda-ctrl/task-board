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
  const { dispatch } = useApp();
  const [text, setText] = useState('');

  const save = () => {
    const t = text.trim();
    if (!t) return;
    dispatch({ type: 'ADD_MEMO', payload: { projectId, text: t } });
    setText('');
  };

  return (
    <div className="border-t-2 border-indigo-100 bg-white px-4 py-3 flex-shrink-0">
      <div className="text-sm font-bold text-indigo-600 mb-2">📌 メモ・URL・コメント</div>
      <div className="flex gap-2">
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
            <div key={m.id} className="bg-indigo-50 rounded-lg px-3 py-1.5 text-xs text-gray-600 break-all">
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
