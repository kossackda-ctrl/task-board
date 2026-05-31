'use client';

import { useState } from 'react';
import { listAllRooms, saveToDB, deleteRoom } from '@/lib/firebase';
import { AppState, DEFAULT_STATE } from '@/lib/store';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '';

export default function AdminPage() {
  const [input, setInput] = useState('');
  const [authed, setAuthed] = useState(false);
  const [rooms, setRooms] = useState<{ roomCode: string; state: AppState }[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // 新規部屋作成
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newMsgText, setNewMsgText] = useState('');
  const [newMsgImg, setNewMsgImg] = useState('');
  const [creating, setCreating] = useState(false);

  // メッセージ編集
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editImg, setEditImg] = useState('');

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

  const handleCreateRoom = async () => {
    const code = newCode.trim().toLowerCase();
    if (!code) { alert('合言葉を入力してください'); return; }
    if (rooms.some(r => r.roomCode === code)) { alert('この合言葉はすでに存在します'); return; }
    setCreating(true);
    const state: AppState = {
      ...DEFAULT_STATE,
      adminMessage: { text: newMsgText.trim(), imageUrl: newMsgImg.trim() },
    };
    await saveToDB(code, state);
    setRooms(r => [...r, { roomCode: code, state }]);
    setNewCode('');
    setNewMsgText('');
    setNewMsgImg('');
    setShowCreate(false);
    setCreating(false);
  };

  const startEditMessage = (roomCode: string, state: AppState) => {
    setEditingRoom(roomCode);
    setEditText(state.adminMessage?.text ?? '');
    setEditImg(state.adminMessage?.imageUrl ?? '');
  };

  const handleSaveMessage = async (roomCode: string) => {
    const room = rooms.find(r => r.roomCode === roomCode);
    if (!room) return;
    const newState = { ...room.state, adminMessage: { text: editText.trim(), imageUrl: editImg.trim() } };
    await saveToDB(roomCode, newState);
    setRooms(r => r.map(x => x.roomCode === roomCode ? { ...x, state: newState } : x));
    setEditingRoom(null);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-700">🔐 管理者パネル</h1>
          <p className="text-sm text-gray-400 mt-0.5">全 {rooms.length} 部屋</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          ＋ 新しい部屋を作る
        </button>
      </div>

      {/* 新規作成フォーム */}
      {showCreate && (
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border-2 border-indigo-200">
          <h2 className="text-sm font-extrabold text-indigo-700 mb-4">➕ 新しい部屋を作る</h2>

          <label className="text-xs font-bold text-gray-500 block mb-1">合言葉</label>
          <input
            className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 mb-4"
            placeholder="例: class2024"
            value={newCode}
            onChange={e => setNewCode(e.target.value)}
          />

          <label className="text-xs font-bold text-gray-500 block mb-1">管理者メッセージ（任意）</label>
          <textarea
            className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 mb-3 resize-none"
            rows={3}
            placeholder="ユーザーに表示するメッセージを入力..."
            value={newMsgText}
            onChange={e => setNewMsgText(e.target.value)}
          />

          <label className="text-xs font-bold text-gray-500 block mb-1">画像URL（任意）</label>
          <input
            className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 mb-4"
            placeholder="https://..."
            value={newMsgImg}
            onChange={e => setNewMsgImg(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {creating ? '作成中...' : '作成する'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 部屋一覧 */}
      {rooms.length === 0 ? (
        <div className="text-center py-12 text-gray-400">部屋がありません</div>
      ) : (
        <div className="flex flex-col gap-4">
          {rooms.map(({ roomCode, state }) => (
            <div key={roomCode} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* 部屋ヘッダー */}
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
                    onClick={() => startEditMessage(roomCode, state)}
                    className="text-xs font-bold bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    メッセージ
                  </button>
                  <button
                    onClick={() => handleDelete(roomCode)}
                    className="text-xs font-bold bg-red-100 hover:bg-red-500 hover:text-white text-red-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>

              {/* メッセージ編集 */}
              {editingRoom === roomCode && (
                <div className="border-t border-gray-100 px-5 py-4 bg-yellow-50">
                  <div className="text-xs font-bold text-yellow-700 mb-3">📢 管理者メッセージを編集</div>
                  <textarea
                    className="w-full border-2 border-yellow-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 mb-3 resize-none bg-white"
                    rows={3}
                    placeholder="ユーザーに表示するメッセージ..."
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                  />
                  <input
                    className="w-full border-2 border-yellow-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 mb-3 bg-white"
                    placeholder="画像URL（任意）https://..."
                    value={editImg}
                    onChange={e => setEditImg(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveMessage(roomCode)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-xl text-sm transition-colors"
                    >
                      保存する
                    </button>
                    <button
                      onClick={() => setEditingRoom(null)}
                      className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}

              {/* 詳細展開 */}
              {expanded === roomCode && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  {state.adminMessage?.text && (
                    <div className="mb-4 bg-indigo-50 rounded-xl px-4 py-3 text-xs text-gray-600 border-l-4 border-indigo-300">
                      <div className="font-bold text-indigo-600 mb-1">📢 メッセージ</div>
                      {state.adminMessage.text}
                    </div>
                  )}
                  {state.projects.length === 0 ? (
                    <div className="text-xs text-gray-400">プロジェクトなし（ユーザーが追加できます）</div>
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
