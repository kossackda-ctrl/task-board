'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { getLevel, getNextLevel, getLevelProgress } from '@/lib/levels';

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function Home() {
  const { state } = useApp();
  const lv = getLevel(state.stars);
  const next = getNextLevel(state.stars);
  const pct = getLevelProgress(state.stars);
  const today = todayString();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-indigo-700">📋 タスクボード</h1>
        <Link
          href="/settings"
          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold px-4 py-2 rounded-full text-sm transition-colors"
        >
          ⚙️ 設定
        </Link>
      </div>

      {/* レベルカード */}
      <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-4xl shrink-0">
          {lv.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-extrabold text-indigo-700">{lv.name}</div>
          <div className="text-sm text-gray-400 my-1">⭐ {state.stars} 個 ゲット！</div>
          <div className="bg-indigo-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {next ? `次のレベルまで あと ${next.min - state.stars} タスク` : '最高レベル！おめでとう！🎊'}
          </div>
        </div>
      </div>

      {/* 管理者メッセージ */}
      {state.adminMessage?.text && (
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border-l-4 border-indigo-400">
          <div className="text-xs font-bold text-indigo-500 mb-2">📢 管理者からのお知らせ</div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{state.adminMessage.text}</p>
          {state.adminMessage.imageUrl && (
            <img
              src={state.adminMessage.imageUrl}
              alt="お知らせ画像"
              className="mt-3 rounded-xl max-w-full"
            />
          )}
        </div>
      )}

      {/* プロジェクト一覧 */}
      <p className="text-base text-gray-500 mb-4 font-semibold">プロジェクトを選んでね 👇</p>

      {state.projects.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          プロジェクトがまだありません。<br />設定から追加してください。
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {state.projects.map(p => {
            const pTasks = state.tasks.filter(t => t.projectId === p.id);
            const doneCount = pTasks.filter(t => t.status === 'done').length;
            const progressPct = pTasks.length > 0 ? Math.round((doneCount / pTasks.length) * 100) : 0;
            const hasOverdue = pTasks.some(t => t.status !== 'done' && t.endDate && t.endDate < today);
            return (
              <Link key={p.id} href={`/board/${p.id}`}>
                <div
                  className="relative rounded-2xl p-6 pb-4 text-center text-white font-bold text-base cursor-pointer shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-150 min-h-25 flex flex-col items-center justify-center gap-2"
                  style={{ background: p.color }}
                >
                  {hasOverdue && (
                    <span className="absolute top-2 right-2 bg-white text-red-500 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow flex items-center gap-0.5">
                      ⚠️ 期限切れ
                    </span>
                  )}
                  <span className="text-3xl">{p.emoji}</span>
                  {p.name}
                  {pTasks.length > 0 && (
                    <div className="w-full mt-1">
                      <div className="flex justify-between text-[10px] text-white/85 font-semibold mb-0.5">
                        <span>進捗</span>
                        <span>{doneCount}/{pTasks.length} ({progressPct}%)</span>
                      </div>
                      <div className="bg-white/30 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link href="/settings">
        <div className="w-full py-5 border-4 border-dashed border-gray-300 rounded-2xl bg-white text-gray-400 text-base font-semibold text-center cursor-pointer hover:border-indigo-400 hover:text-indigo-500 transition-colors">
          ＋ 新しいプロジェクトを作る
        </div>
      </Link>
    </div>
  );
}
