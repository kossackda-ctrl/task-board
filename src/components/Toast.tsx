'use client';

import { useEffect, useState } from 'react';
import { getLevel } from '@/lib/levels';

interface ToastProps {
  stars: number;
  visible: boolean;
  onHide: () => void;
}

export default function Toast({ stars, visible, onHide }: ToastProps) {
  const [show, setShow] = useState(false);
  const lv = getLevel(stars);
  const prevLv = getLevel(stars - 1);
  const levelUp = lv.min !== prevLv.min;

  useEffect(() => {
    if (visible) {
      setShow(true);
      const t = setTimeout(() => { setShow(false); onHide(); }, 2200);
      return () => clearTimeout(t);
    }
  }, [visible, onHide]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className={`bg-white rounded-3xl px-10 py-8 text-center shadow-2xl transition-transform duration-300 ${show ? 'scale-100' : 'scale-0'}`}
      >
        <div className="text-5xl mb-2">{levelUp ? '🎉' : '🌟'}</div>
        <div className="text-xl font-extrabold text-indigo-700">
          {levelUp ? 'レベルアップ！！' : 'タスク完了！'}
        </div>
        <div className="text-sm text-gray-400 mt-1">
          {levelUp ? `${lv.name} になった！` : 'やった！ スターを1個ゲット！'}
        </div>
        <div className="text-2xl mt-3 tracking-widest">
          {'⭐'.repeat(Math.min(stars, 10))}
        </div>
      </div>
    </div>
  );
}
