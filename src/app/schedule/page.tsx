'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';

export default function SchedulePage() {
  const { state } = useApp();
  const url = state.annualScheduleUrl ?? '';
  const isPdf = url.toLowerCase().includes('.pdf');

  return (
    <div className="flex flex-col h-screen">
      <div className="shrink-0 bg-indigo-600 text-white px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-2xl px-2 py-1 rounded-lg hover:bg-white/20 transition-colors">←</Link>
        <h1 className="font-extrabold text-base flex-1">📅 年間予定</h1>
        <Link
          href="/settings"
          className="text-xs bg-white/20 hover:bg-white/30 font-bold px-3 py-1.5 rounded-lg transition-colors"
        >
          ⚙️ 変更
        </Link>
      </div>

      <div className="flex-1 min-h-0 bg-gray-100 overflow-hidden">
        {!url ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 px-6 text-center">
            <div className="text-6xl">📅</div>
            <div className="text-base font-bold text-gray-500">年間予定がまだ設定されていません</div>
            <div className="text-sm">設定ページから画像またはPDFのURLを入力してください</div>
            <Link
              href="/settings"
              className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              設定を開く
            </Link>
          </div>
        ) : isPdf ? (
          <iframe
            src={url}
            className="w-full h-full border-none"
            title="年間予定"
          />
        ) : (
          <img
            src={url}
            alt="年間予定"
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
