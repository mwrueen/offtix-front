import React from 'react';
import { Modal, Button } from '../ui';

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Record",
  message = "This action is irreversible. Are you sure you want to delete this data?",
  itemName,
  confirmButtonText = "Delete Permanently",
  icon = "⚠️"
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <span className="text-3xl shrink-0">{icon}</span>
          <p className="text-sm font-medium text-amber-800 leading-relaxed">
            {message}
          </p>
        </div>

        {itemName && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Entity</p>
            <p className="text-base font-bold text-slate-900 truncate">
              {itemName}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            className="flex-1" 
            onClick={onConfirm}
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;