import React from 'react';

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "DATA_EXCISION_REQUIRED",
  message = "This protocol is irreversible. Tactical data will be permanently purged.",
  itemName,
  itemDescription,
  confirmButtonText = "AUTHORIZE_PURGE",
  icon = "⚠️"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[5000] p-8 animate-in fade-in duration-500 italic">
      <div
        className="bg-white rounded-[4rem] w-full max-w-lg shadow-24 border-8 border-slate-950 overflow-hidden relative animate-in zoom-in-95 slide-in-from-bottom-24 duration-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-12 text-[120px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none">EXIT</div>

        <div className="p-12 text-center relative z-10">
          <div className="text-8xl mb-8 drop-shadow-2xl grayscale transition-all group-hover:grayscale-0 group-hover:scale-110">
            {icon}
          </div>
          <h3 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter leading-none mb-6">
            {title.toUpperCase()}
          </h3>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] leading-relaxed max-w-sm mx-auto underline underline-offset-8 decoration-slate-100 italic">
            {message.toUpperCase()}
          </p>
        </div>

        {itemName && (
          <div className="mx-12 mb-10 p-8 bg-rose-50 rounded-[2.5rem] border-4 border-rose-100 shadow-inner group/item">
            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest italic mb-3 opacity-60">TARGET_ENTITY_ID:</p>
            <div className="text-2xl font-black text-rose-600 uppercase italic tracking-tighter truncate drop-shadow-sm group-hover/item:scale-105 transition-transform duration-700">
              {itemName}
            </div>
            {itemDescription && (
              <div className="text-[10px] font-bold text-rose-400/60 leading-relaxed uppercase italic mt-2 line-clamp-2">
                {itemDescription}
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-50 p-10 flex gap-6 relative z-10 border-t-4 border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-5 bg-white text-slate-400 border-4 border-slate-100 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] italic transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 shadow-sm"
          >
            ABORT_SIGNAL
          </button>
          <button
            onClick={onConfirm}
            className="flex-[1.5] py-5 bg-rose-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] italic shadow-24 hover:bg-rose-950 transition-all active:scale-95 group relative overflow-hidden"
          >
            <span className="relative z-10">{confirmButtonText.toUpperCase()}</span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;