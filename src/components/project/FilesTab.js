import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const FilesTab = ({ project, isProjectOwner, onRefresh }) => {
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, fileId: null, fileName: '' });
  const { showToast } = useToast();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      await projectAPI.uploadAttachment(project._id, formData);
      showToast('File uploaded successfully', 'success');
      onRefresh();
    } catch (error) {
      console.error('Upload Error', error);
      showToast(error.response?.data?.error || 'Failed to upload file', 'error');
    } finally {
      setUploading(false); e.target.value = '';
    }
  };

  const handleDeleteFile = async () => {
    try {
      await projectAPI.deleteAttachment(project._id, deleteModal.fileId);
      showToast('File deleted successfully', 'success');
      onRefresh();
    } catch (error) {
      console.error('Delete Error', error);
      showToast(error.response?.data?.error || 'Failed to delete file', 'error');
    } finally {
      setDeleteModal({ isOpen: false, fileId: null, fileName: '' });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (type) => {
    if (!type) return '📄';
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || type.includes('document')) return '📘';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📙';
    if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) return '📦';
    return '📄';
  };

  const attachments = project.attachments || [];

  return (
    <div className="space-y-8 p-1 animate-in fade-in duration-500 pb-20">
      {/* Upload Header */}
      <div className="bg-slate-900 rounded-3xl p-8 lg:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -mr-48 -mt-48" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-slate-100">📂</div>
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Project Documents</h2>
                <p className="text-slate-500 text-sm mt-1">Manage and store important project assets and documentation.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Storage Status</span>
                <span className="text-white font-bold text-sm">{attachments.length} Files Uploaded</span>
              </div>

              <label className={`px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-2 ${uploading ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-indigo-700'}`}>
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>↑</span>
                )}
                <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Display */}
      {attachments.length === 0 ? (
        <div className="bg-white py-32 rounded-3xl border-2 border-dashed border-slate-200 text-center shadow-sm">
          <div className="text-6xl mb-6 opacity-20">📁</div>
          <h3 className="text-xl font-bold text-slate-900 capitalize">No documents found</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto font-medium">Your document library is currently empty. Upload files to get started with project organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {attachments.map((file) => (
            <div key={file._id} className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-3xl border border-slate-100 shadow-inner shrink-0 italic">
                  {getFileIcon(file.type)}
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <h4 className="font-bold text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition-colors" title={file.name}>
                    {file.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{formatFileSize(file.size)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Uploaded</span>
                    <span className="text-[10px] font-bold text-slate-700 truncate">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">By</span>
                    <span className="text-[10px] font-bold text-slate-700 truncate">{file.uploadedBy?.name || 'System'}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${file.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-slate-950 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest text-center hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
                  >
                    Download
                  </a>
                  {isProjectOwner && (
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, fileId: file._id, fileName: file.name })}
                      className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, fileId: null, fileName: '' })}
        onConfirm={handleDeleteFile}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${deleteModal.fileName}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default FilesTab;
