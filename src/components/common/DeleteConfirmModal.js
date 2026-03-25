import React from 'react';

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  message = "This action cannot be undone.",
  itemName,
  itemDescription,
  confirmButtonText = "Delete",
  icon = "⚠️"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 transition-all duration-300">
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-[420px] shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4 drop-shadow-md">
            {icon}
          </div>
          <h3 className="m-0 mb-2 text-xl font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="m-0 text-slate-500 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Item Details */}
        {itemName && (
          <div className="p-5 bg-red-50/50 rounded-xl mb-6 border border-red-100">
            <p className="m-0 mb-2 text-sm text-slate-600 font-medium">
              Are you sure you want to delete:
            </p>
            <div className="font-bold text-slate-900 text-base mb-1 truncate">
              {itemName}
            </div>
            {itemDescription && (
              <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                {itemDescription}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-semibold text-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 min-w-[100px]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-red-500 text-white border-none rounded-xl font-bold text-sm shadow-lg shadow-red-200 transition-all hover:bg-red-600 hover:shadow-red-300 active:scale-95 min-w-[110px]"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;