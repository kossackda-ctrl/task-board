'use client';

import { Task } from '@/lib/store';

interface Props {
  tasks: Task[];
}

const STATUS_COLOR: Record<string, string> = {
  todo: '#7986cb',
  doing: '#ffa726',
  done: '#66bb6a',
};

function toMs(dateStr: string) {
  return dateStr ? new Date(dateStr).getTime() : 0;
}

function fmtLabel(ms: number) {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function GanttChart({ tasks }: Props) {
  const dated = tasks.filter(t => t.startDate && t.endDate);

  if (dated.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 font-bold text-sm text-indigo-700 bg-indigo-50 border-b border-indigo-100">
          📅 スケジュール
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-6 text-center">
          カードに開始日・終了日を<br />入力するとここに表示されます
        </div>
      </div>
    );
  }

  const allStarts = dated.map(t => toMs(t.startDate));
  const allEnds   = dated.map(t => toMs(t.endDate));
  const rangeStart = Math.min(...allStarts);
  const rangeEnd   = Math.max(...allEnds);
  const totalMs    = rangeEnd - rangeStart || 1;
  const today      = Date.now();

  const todayPct = Math.max(0, Math.min(100, ((today - rangeStart) / totalMs) * 100));

  // build tick labels (≤8 ticks)
  const ticks: number[] = [];
  const step = totalMs / 7;
  for (let i = 0; i <= 7; i++) ticks.push(rangeStart + step * i);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 font-bold text-sm text-indigo-700 bg-indigo-50 border-b border-indigo-100 flex-shrink-0">
        📅 スケジュール
      </div>

      {/* tick header */}
      <div className="flex pl-28 pr-2 py-1 bg-indigo-50 flex-shrink-0">
        {ticks.map((t, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-gray-400 font-semibold">
            {fmtLabel(t)}
          </div>
        ))}
      </div>

      <div className="overflow-y-auto flex-1">
        {dated.map(task => {
          const leftPct  = ((toMs(task.startDate) - rangeStart) / totalMs) * 100;
          const widthPct = ((toMs(task.endDate) - toMs(task.startDate)) / totalMs) * 100;

          return (
            <div key={task.id} className="flex items-center min-h-[36px] border-b border-gray-50">
              <div className="w-28 min-w-[7rem] text-[10px] text-gray-500 font-semibold px-2 truncate" title={task.title}>
                {task.title}
              </div>
              <div className="flex-1 relative h-5 mr-2">
                {/* today line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-60 z-10"
                  style={{ left: `${todayPct.toFixed(1)}%` }}
                />
                {/* bar */}
                <div
                  className="absolute top-0.5 h-4 rounded-full opacity-85"
                  style={{
                    left: `${Math.max(0, leftPct).toFixed(1)}%`,
                    width: `${Math.max(2, widthPct).toFixed(1)}%`,
                    background: STATUS_COLOR[task.status] ?? '#7986cb',
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* legend */}
        <div className="flex gap-3 p-2 text-[10px] text-gray-400 flex-wrap border-t border-gray-100 mt-1">
          {[['#7986cb','やること'],['#ffa726','やっている'],['#66bb6a','おわった']].map(([c,l]) => (
            <span key={l} className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-full" style={{ background: c }} />
              {l}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="inline-block w-0.5 h-3 bg-red-400 rounded" />今日
          </span>
        </div>
      </div>
    </div>
  );
}
