'use client';

import { useState } from 'react';
import { listAllRooms, saveToDB, deleteRoom, loadFromDB, getAdminPassword, setAdminPassword } from '@/lib/firebase';
import { AppState, DEFAULT_STATE, TrashItem, purgeTrash, TRASH_RETENTION_MS } from '@/lib/store';

function trashLabel(item: TrashItem): string {
  if (item.kind === 'project') {
    return `📁 プロジェクト「${item.project.emoji} ${item.project.name}」（タスク${item.tasks.length}件・メモ${item.memos.length}件を含む）`;
  }
  if (item.kind === 'task') return `📝 タスク「${item.task.title}」`;
  return `📋 議事録「${item.minute.title}」`;
}

function remainingLabel(item: TrashItem): string {
  const msLeft = new Date(item.deletedAt).getTime() + TRASH_RETENTION_MS - Date.now();
  if (msLeft <= 0) return 'まもなく消去';
  const hours = Math.floor(msLeft / (60 * 60 * 1000));
  const minutes = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
  return hours > 0 ? `あと約${hours}時間` : `あと約${minutes}分`;
}

const ENV_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '';
const COLORS = ['#ef5350','#42a5f5','#66bb6a','#ffa726','#ab47bc','#26c6da','#ec407a','#8d6e63'];
const EMOJIS = ['📚','🏠','🔬','⭐','🎯','📌','🎨','🚀','💡','🏆','🦄','🌈'];

export default function AdminPage() {
  const [input, setInput] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
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

  // メンバー管理
  const [memberRoom, setMemberRoom] = useState<string | null>(null);
  const [newMember, setNewMember] = useState('');

  // ゴミ箱（削除データの復旧）
  const [trashRoom, setTrashRoom] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  // パスワード変更
  const [showPwChange, setShowPwChange] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const login = async () => {
    setLoggingIn(true);
    const stored = await getAdminPassword();
    const effective = stored ?? ENV_PASSWORD;
    if (!effective || input !== effective) {
      alert('パスワードが違います');
      setLoggingIn(false);
      return;
    }
    setAuthed(true);
    setLoading(true);
    const data = await listAllRooms();
    setRooms(data);
    setLoading(false);
    setLoggingIn(false);
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
    setNewCode(''); setNewMsgText(''); setNewMsgImg('');
    setShowCreate(false);
    setCreating(false);
  };

  const handleSaveMessage = async (roomCode: string) => {
    const room = rooms.find(r => r.roomCode === roomCode);
    if (!room) return;
    const newState = { ...room.state, adminMessage: { text: editText.trim(), imageUrl: editImg.trim() } };
    await saveToDB(roomCode, newState);
    setRooms(r => r.map(x => x.roomCode === roomCode ? { ...x, state: newState } : x));
    setEditingRoom(null);
  };

  const handleAddMember = async (roomCode: string) => {
    const name = newMember.trim();
    if (!name) return;
    const room = rooms.find(r => r.roomCode === roomCode);
    if (!room) return;
    if (room.state.members.includes(name)) { alert('同じ名前がすでにあります'); return; }
    const newState = { ...room.state, members: [...room.state.members, name] };
    await saveToDB(roomCode, newState);
    setRooms(r => r.map(x => x.roomCode === roomCode ? { ...x, state: newState } : x));
    setNewMember('');
  };

  const handleDeleteMember = async (roomCode: string, name: string) => {
    const room = rooms.find(r => r.roomCode === roomCode);
    if (!room) return;
    const newState = { ...room.state, members: room.state.members.filter(m => m !== name) };
    await saveToDB(roomCode, newState);
    setRooms(r => r.map(x => x.roomCode === roomCode ? { ...x, state: newState } : x));
  };

  const handleRestore = async (roomCode: string, itemId: string) => {
    setRestoring(itemId);
    try {
      // ユーザー側の最新状態を取得してから復元する（古い画面表示による上書きを防ぐ）
      const fresh = await loadFromDB(roomCode);
      if (!fresh) { alert('部屋のデータが見つかりませんでした'); return; }
      const item = (fresh.trash ?? []).find(t => t.id === itemId);
      if (!item) { alert('この項目はすでに消去されたか、復元できません'); return; }

      const newState: AppState = { ...fresh };
      if (item.kind === 'project') {
        newState.projects = [...fresh.projects, item.project];
        newState.tasks = [...fresh.tasks, ...item.tasks];
        newState.memos = [...item.memos, ...fresh.memos];
      } else if (item.kind === 'task') {
        if (!fresh.projects.some(p => p.id === item.task.projectId)) {
          alert('このタスクのプロジェクトが削除されています。先にプロジェクトを復旧してください。');
          return;
        }
        newState.tasks = [...fresh.tasks, item.task];
      } else {
        newState.minutes = [item.minute, ...(fresh.minutes ?? [])];
      }
      newState.trash = (fresh.trash ?? []).filter(t => t.id !== item.id);

      await saveToDB(roomCode, newState);
      setRooms(r => r.map(x => x.roomCode === roomCode ? { ...x, state: newState } : x));
      alert('復旧しました！');
    } finally {
      setRestoring(null);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPw.trim()) { alert('パスワードを入力してください'); return; }
    if (newPw !== confirmPw) { alert('パスワードが一致しません'); return; }
    await setAdminPassword(newPw.trim());
    alert('パスワードを変更しました');
    setNewPw(''); setConfirmPw('');
    setShowPwChange(false);
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
            disabled={loggingIn}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {loggingIn ? '確認中...' : 'ログイン'}
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowPwChange(!showPwChange)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            🔑 PW変更
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            ＋ 新しい部屋
          </button>
        </div>
      </div>

      {/* パスワード変更 */}
      {showPwChange && (
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border-2 border-gray-200">
          <h2 className="text-sm font-extrabold text-gray-700 mb-4">🔑 パスワードを変更する</h2>
          <input
            type="password"
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 mb-3"
            placeholder="新しいパスワード"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
          />
          <input
            type="password"
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 mb-4"
            placeholder="もう一度入力"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handlePasswordChange} className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
              変更する
            </button>
            <button onClick={() => setShowPwChange(false)} className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}

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
            placeholder="ユーザーに表示するメッセージ..."
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
            <button onClick={handleCreateRoom} disabled={creating} className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
              {creating ? '作成中...' : '作成する'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors">
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
              {/* ヘッダー */}
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="font-bold text-gray-700">🔑 {roomCode}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    プロジェクト {state.projects.length}件・タスク {state.tasks.length}件・メンバー {state.members?.length ?? 0}人
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button onClick={() => setExpanded(expanded === roomCode ? null : roomCode)} className="text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg transition-colors">
                    {expanded === roomCode ? '閉じる' : '詳細'}
                  </button>
                  <button onClick={() => { setEditingRoom(roomCode); setEditText(state.adminMessage?.text ?? ''); setEditImg(state.adminMessage?.imageUrl ?? ''); }} className="text-xs font-bold bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1.5 rounded-lg transition-colors">
                    メッセージ
                  </button>
                  <button onClick={() => setMemberRoom(memberRoom === roomCode ? null : roomCode)} className="text-xs font-bold bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors">
                    メンバー
                  </button>
                  <button onClick={() => setTrashRoom(trashRoom === roomCode ? null : roomCode)} className="text-xs font-bold bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-lg transition-colors">
                    🗑 ゴミ箱{purgeTrash(state.trash ?? []).length > 0 ? ` (${purgeTrash(state.trash ?? []).length})` : ''}
                  </button>
                  <button onClick={() => handleDelete(roomCode)} className="text-xs font-bold bg-red-100 hover:bg-red-500 hover:text-white text-red-600 px-3 py-1.5 rounded-lg transition-colors">
                    削除
                  </button>
                </div>
              </div>

              {/* メッセージ編集 */}
              {editingRoom === roomCode && (
                <div className="border-t border-gray-100 px-5 py-4 bg-yellow-50">
                  <div className="text-xs font-bold text-yellow-700 mb-3">📢 管理者メッセージを編集</div>
                  <textarea className="w-full border-2 border-yellow-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 mb-3 resize-none bg-white" rows={3} value={editText} onChange={e => setEditText(e.target.value)} placeholder="メッセージ..." />
                  <input className="w-full border-2 border-yellow-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 mb-3 bg-white" value={editImg} onChange={e => setEditImg(e.target.value)} placeholder="画像URL（任意）" />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveMessage(roomCode)} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-xl text-sm transition-colors">保存する</button>
                    <button onClick={() => setEditingRoom(null)} className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors">キャンセル</button>
                  </div>
                </div>
              )}

              {/* メンバー管理 */}
              {memberRoom === roomCode && (
                <div className="border-t border-gray-100 px-5 py-4 bg-green-50">
                  <div className="text-xs font-bold text-green-700 mb-3">👥 メンバーを管理する</div>
                  <div className="flex gap-2 mb-3">
                    <input
                      className="flex-1 border-2 border-green-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400 bg-white"
                      placeholder="名前を入力..."
                      value={newMember}
                      onChange={e => setNewMember(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddMember(roomCode); }}
                    />
                    <button onClick={() => handleAddMember(roomCode)} className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 rounded-xl text-sm transition-colors">追加</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(state.members ?? []).length === 0 ? (
                      <span className="text-xs text-gray-400">メンバーなし</span>
                    ) : (state.members ?? []).map(m => (
                      <div key={m} className="flex items-center gap-1 bg-white border border-green-200 rounded-lg px-3 py-1">
                        <span className="text-sm text-gray-700">{m}</span>
                        <button onClick={() => handleDeleteMember(roomCode, m)} className="text-gray-400 hover:text-red-500 text-xs font-bold ml-1">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ゴミ箱（削除データの復旧） */}
              {trashRoom === roomCode && (
                <div className="border-t border-gray-100 px-5 py-4 bg-orange-50">
                  <div className="text-xs font-bold text-orange-700 mb-1">🗑 ゴミ箱（削除から24時間以内のデータを復旧できます）</div>
                  {purgeTrash(state.trash ?? []).length === 0 ? (
                    <div className="text-xs text-gray-400 mt-2">削除されたデータはありません</div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-3">
                      {purgeTrash(state.trash ?? []).map(item => (
                        <div key={item.id} className="flex items-center gap-2 bg-white border border-orange-200 rounded-xl px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-700 font-semibold truncate">{trashLabel(item)}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(item.deletedAt).toLocaleString('ja-JP')} に削除・{remainingLabel(item)}で消去
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestore(roomCode, item.id)}
                            disabled={restoring !== null}
                            className="text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors shrink-0"
                          >
                            {restoring === item.id ? '復旧中...' : '復旧する'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    <div className="text-xs text-gray-400">プロジェクトなし</div>
                  ) : state.projects.map(p => (
                    <div key={p.id} className="mb-4">
                      <div className="inline-flex items-center gap-1.5 text-white font-bold px-3 py-1 rounded-lg text-xs mb-2" style={{ background: p.color }}>
                        {p.emoji} {p.name}
                      </div>
                      <div className="flex flex-col gap-1">
                        {state.tasks.filter(t => t.projectId === p.id).map(t => (
                          <div key={t.id} className="flex items-center gap-2 text-xs text-gray-600 bg-white rounded-lg px-3 py-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'done' ? 'bg-green-400' : t.status === 'doing' ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                            {t.title}
                            {(t.assignees?.length ?? 0) > 0 && (
                              <span className="text-gray-400 ml-auto">{t.assignees.join('・')}</span>
                            )}
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
