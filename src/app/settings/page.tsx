'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { getLevel } from '@/lib/levels';

const COLORS = [
  '#ef5350','#42a5f5','#66bb6a','#ffa726','#ab47bc','#26c6da','#ec407a','#8d6e63',
];
const EMOJIS = ['📚','🏠','🔬','⭐','🎯','📌','🎨','🚀','💡','🏆','🦄','🌈'];

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const lv = getLevel(state.stars);

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [colNames, setColNames] = useState({ ...state.columnNames });

  const addProject = () => {
    const n = name.trim();
    if (!n) return;
    dispatch({ type: 'ADD_PROJECT', payload: { name: n, color, emoji } });
    setName('');
  };

  const saveColNames = () => {
    dispatch({ type: 'SET_COLUMN_NAMES', payload: colNames });
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-2xl px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors text-indigo-700">←</Link>
        <h1 className="text-xl font-extrabold text-indigo-700">⚙️ 設定</h1>
      </div>

      {/* プロジェクト追加 */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-indigo-700 mb-4 pb-2 border-b-2 border-indigo-100">
          📁 プロジェクトを管理する
        </h2>

        <label className="text-xs font-bold text-gray-500 block mb-1">プロジェクト名</label>
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
            value={name} onChange={e => setName(e.target.value)}
            placeholder="プロジェクト名を入力..."
            onKeyDown={e => { if (e.key === 'Enter') addProject(); }}
          />
          <button
            onClick={addProject}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            追加
          </button>
        </div>

        <label className="text-xs font-bold text-gray-500 block mb-2">色を選ぶ</label>
        <div className="flex gap-2 flex-wrap mb-3">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-offset-1 ring-gray-700' : 'hover:scale-105'}`}
              style={{ background: c }}
            />
          ))}
        </div>

        <label className="text-xs font-bold text-gray-500 block mb-2">絵文字を選ぶ</label>
        <div className="flex gap-2 flex-wrap mb-4">
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`text-xl w-9 h-9 rounded-lg transition-all ${emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'hover:bg-gray-100'}`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* プレビュー */}
        {name && (
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 mb-1">プレビュー</div>
            <div
              className="inline-flex items-center gap-2 text-white font-bold px-4 py-2 rounded-xl text-sm"
              style={{ background: color }}
            >
              {emoji} {name}
            </div>
          </div>
        )}

        {/* 既存プロジェクト一覧 */}
        <div className="flex flex-col gap-2">
          {state.projects.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-indigo-50 rounded-xl px-3 py-2.5">
              <span className="text-sm font-semibold">
                <span className="mr-1">{p.emoji}</span>{p.name}
              </span>
              <button
                onClick={() => dispatch({ type: 'DELETE_PROJECT', payload: p.id })}
                className="text-xs font-bold bg-red-100 hover:bg-red-500 hover:text-white text-red-600 px-3 py-1 rounded-lg transition-colors"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* スターリセット */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-indigo-700 mb-4 pb-2 border-b-2 border-indigo-100">
          ⭐ レベルをリセットする
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-700">{lv.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">⭐ {state.stars} 個</div>
          </div>
          <button
            onClick={() => { if (confirm('スターを0にリセットしますか？')) dispatch({ type: 'RESET_STARS' }); }}
            className="text-xs font-bold bg-red-100 hover:bg-red-500 hover:text-white text-red-600 px-4 py-2 rounded-xl transition-colors"
          >
            リセット
          </button>
        </div>
      </div>

      {/* 列名カスタマイズ */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-indigo-700 mb-4 pb-2 border-b-2 border-indigo-100">
          📊 列の名前を変える
        </h2>
        {(['todo','doing','done'] as const).map(k => (
          <div key={k} className="mb-3">
            <label className="text-xs font-bold text-gray-400 block mb-1">
              {k === 'todo' ? '📝 1列目' : k === 'doing' ? '🔄 2列目' : '✅ 3列目'}
            </label>
            <input
              className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500"
              value={colNames[k]}
              onChange={e => setColNames(n => ({ ...n, [k]: e.target.value }))}
            />
          </div>
        ))}
        <button
          onClick={saveColNames}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
        >
          保存する
        </button>
      </div>
    </div>
  );
}
