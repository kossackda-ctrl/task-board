'use client';

import { useState } from 'react';
import { listAllRooms, deleteRoom } from '@/lib/firebase';
import { AppState } from '@/lib/store';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '';

export default function AdminPage() {
  const [input, setInput] = useState('');
  const [authed, setAuthed] = useState(false);
  const [rooms, setRooms] = useState<{ roomCode: string; state: AppState }[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const login = async () => {
    if (!ADMIN_PASSWORD || input !== ADMIN_PASSWORD) {
      alert('パスワードが違います');
      return;
    }
    setAuthed(true);
    setLoading(true);
    const data = await listAllRooms();
    setRooms(data);
    setLoading(false);
  };

  const handleDelete = async (roomCode: string) => {
    if (!confirm(`「${roomCode}」の部屋を削除しますか？\nこの操作は取り消せません。`)) return;
    await deleteRoom(roomCode);
    setRooms(r => r.filter(x => x.roomCode !== roomCode));
  };

  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-2xl p-8 shadow-md w-80">
          <h1 className="text-lg font-extrabold text-gray-700 mb-6 text-center">🔐 管理者ログイン</h1>
          <input
            type="password"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 mb-4"
            placeholder="パスワードを入力..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') login(); }}
          />
          <button
            onClick={login}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            ログイン
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-indigo-400 text-lg font-bold animate-pulse">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-extrabold text-gray-700 mb-2">🔐 管理者パネル</h1>
      <p className="text-sm text-gray-400 mb-6">全 {rooms.length} 部屋</p>

      {rooms.length === 0 ? (
        <div className="text-center py-12 text-gray-400">部屋がありません</div>
      ) : (
        <div className="flex flex-col gap-4">
          {rooms.map(({ roomCode, state }) => (
            <div key={roomCode} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="font-bold text-gray-700">🔑 {roomCode}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    プロジェクト {state.projects.length}件・タスク {state.tasks.length}件・⭐ {state.stars}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExpanded(expanded === roomCode ? null : roomCode)}
                    className="text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {expanded === roomCode ? '閉じる' : '詳細'}
                  </button>
                  <button
                    onClick={() => handleDelete(roomCode)}
                    className="text-xs font-bold bg-red-100 hover:bg-red-500 hover:text-white text-red-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>

              {expanded === roomCode && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  {state.projects.length === 0 ? (
                    <div className="text-xs text-gray-400">プロジェクトなし</div>
                  ) : state.projects.map(p => (
                    <div key={p.id} className="mb-4">
                      <div
                        className="inline-flex items-center gap-1.5 text-white font-bold px-3 py-1 rounded-lg text-xs mb-2"
                        style={{ background: p.color }}
                      >
                        {p.emoji} {p.name}
                      </div>
                      <div className="flex flex-col gap-1">
                        {state.tasks.filter(t => t.projectId === p.id).map(t => (
                          <div key={t.id} className="flex items-center gap-2 text-xs text-gray-600 bg-white rounded-lg px-3 py-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              t.status === 'done' ? 'bg-green-400' : t.status === 'doing' ? 'bg-yellow-400' : 'bg-gray-300'
                            }`} />
                            {t.title}
                            {t.assignee && <span className="text-gray-400 ml-auto">{t.assignee}</span>}
                          </div>
                        ))}
                        {state.tasks.filter(t => t.projectId === p.id).length === 0 && (
                          <div className="text-xs text-gray-400 px-1">タスクなし</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
