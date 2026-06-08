'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { getLevel } from '@/lib/levels';

const COLORS = [
  '#ef5350','#42a5f5','#66bb6a','#ffa726','#ab47bc','#26c6da','#ec407a','#8d6e63',
];
const EMOJIS = ['📚','🏠','🔬','⭐','🎯','📌','🎨','🚀','💡','🏆','🦄','🌈'];

export default function SettingsPage() {
  const { state, dispatch, roomCode } = useApp();
  const lv = getLevel(state.stars);

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [colNames, setColNames] = useState({ ...state.columnNames });
  const [scheduleUrl, setScheduleUrl] = useState(state.annualScheduleUrl ?? '');
  const [scheduleFileName, setScheduleFileName] = useState('');
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScheduleFile = useCallback((file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) return;
    setScheduleFileName(file.name);
    if (isImage) {
      const img = new window.Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 1400;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setScheduleUrl(canvas.toDataURL('image/jpeg', 0.82));
        URL.revokeObjectURL(objUrl);
      };
      img.src = objUrl;
    } else {
      const reader = new FileReader();
      reader.onload = e => setScheduleUrl((e.target?.result as string) ?? '');
      reader.readAsDataURL(file);
    }
  }, []);

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const imgItem = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
      if (imgItem) {
        const file = imgItem.getAsFile();
        if (file) { setScheduleFileName('クリップボードから貼り付け'); handleScheduleFile(file); }
      }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [handleScheduleFile]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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
            <div key={p.id} className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2.5">
              {editingId === p.id ? (
                <>
                  <span className="mr-1">{p.emoji}</span>
                  <input
                    className="flex-1 border-2 border-indigo-300 rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-500"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && editingName.trim()) {
                        dispatch({ type: 'RENAME_PROJECT', payload: { id: p.id, name: editingName.trim() } });
                        setEditingId(null);
                      }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (editingName.trim()) dispatch({ type: 'RENAME_PROJECT', payload: { id: p.id, name: editingName.trim() } });
                      setEditingId(null);
                    }}
                    className="text-xs font-bold bg-indigo-500 text-white px-3 py-1 rounded-lg transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold flex-1">
                    <span className="mr-1">{p.emoji}</span>{p.name}
                  </span>
                  <button
                    onClick={() => { setEditingId(p.id); setEditingName(p.name); }}
                    className="text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-600 px-3 py-1 rounded-lg transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_PROJECT', payload: p.id })}
                    className="text-xs font-bold bg-red-100 hover:bg-red-500 hover:text-white text-red-600 px-3 py-1 rounded-lg transition-colors"
                  >
                    削除
                  </button>
                </>
              )}
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

      {/* 合言葉 */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-indigo-700 mb-4 pb-2 border-b-2 border-indigo-100">
          🔑 合言葉
        </h2>
        <div className="text-sm font-bold text-gray-700">{roomCode}</div>
        <div className="text-xs text-gray-400 mt-0.5">現在の合言葉</div>
      </div>

      {/* 年間予定 */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-indigo-700 mb-4 pb-2 border-b-2 border-indigo-100">
          📅 年間予定の画像・PDF
        </h2>

        {/* ドラッグ&ドロップゾーン */}
        <div
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors mb-3 ${
            draggingOver
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
          onDragOver={e => { e.preventDefault(); setDraggingOver(true); }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDraggingOver(false);
            const file = e.dataTransfer.files[0];
            if (file) { setScheduleFileName(file.name); handleScheduleFile(file); }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-3xl mb-2">📎</div>
          <div className="text-sm font-bold text-gray-600">
            {scheduleFileName || 'ここにファイルをドラッグ&ドロップ'}
          </div>
          <div className="text-xs text-gray-400 mt-1">クリックして選択 ／ 画像のコピペ（Ctrl+V）も対応</div>
          <div className="text-xs text-gray-400">JPG・PNG・PDF</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) { setScheduleFileName(file.name); handleScheduleFile(file); }
              e.target.value = '';
            }}
          />
        </div>

        {/* URL で指定（補助） */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-bold shrink-0">または URL で指定</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <input
          className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 mb-3"
          value={scheduleUrl.startsWith('data:') ? '' : scheduleUrl}
          onChange={e => { setScheduleUrl(e.target.value); setScheduleFileName(''); }}
          placeholder="https://..."
        />

        {/* プレビュー */}
        {scheduleUrl && (
          <div className="mb-3">
            <div className="text-xs font-bold text-gray-400 mb-1">プレビュー</div>
            {scheduleUrl.startsWith('data:application/pdf') || (!scheduleUrl.startsWith('data:') && scheduleUrl.toLowerCase().includes('.pdf')) ? (
              <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                📄 PDFファイルが設定されています
              </div>
            ) : (
              <img src={scheduleUrl} alt="プレビュー" className="max-h-32 rounded-lg border border-gray-200 object-contain" />
            )}
          </div>
        )}

        <button
          onClick={() => dispatch({ type: 'SET_ANNUAL_SCHEDULE', payload: scheduleUrl })}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
        >
          保存する
        </button>
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
