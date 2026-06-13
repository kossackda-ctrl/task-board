'use client';

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '削除する',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-4xl text-center mb-2">⚠️</div>
        <h3 className="text-base font-extrabold text-gray-700 text-center mb-2">{title}</h3>
        {message && (
          <p className="text-xs text-gray-500 text-center whitespace-pre-wrap mb-4 leading-relaxed">
            {message}
          </p>
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm transition-colors"
          >
            やめる
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
