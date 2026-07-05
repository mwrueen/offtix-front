import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { requirementAPI, getAssetUrl } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { Button, Badge } from '../ui';

const RequirementsTab = ({ projectId, requirements, setRequirements, users, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [viewingRequirement, setViewingRequirement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'functional',
    priority: 'medium',
    status: 'draft',
    assignedTo: '',
    estimatedHours: '',
    acceptanceCriteria: []
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background', 'link'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        assignedTo: formData.assignedTo || undefined
      };

      let requirementId;
      if (editingRequirement) {
        await requirementAPI.update(projectId, editingRequirement._id, data);
        requirementId = editingRequirement._id;
      } else {
        const response = await requirementAPI.create(projectId, data);
        requirementId = response.data._id;
      }

      if (pendingFiles.length > 0 && requirementId) {
        setUploadingFiles(true);
        for (const file of pendingFiles) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          try {
            await requirementAPI.uploadAttachment(projectId, requirementId, fileFormData);
          } catch (fileError) {
            console.error('Error uploading file:', file.name, fileError);
          }
        }
        setUploadingFiles(false);
      }

      await onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving requirement:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'functional',
      priority: 'medium',
      status: 'draft',
      assignedTo: '',
      estimatedHours: '',
      acceptanceCriteria: []
    });
    setShowForm(false);
    setEditingRequirement(null);
    setPendingFiles([]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removePendingFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleEdit = (requirement) => {
    setFormData({
      title: requirement.title,
      description: requirement.description || '',
      type: requirement.type,
      priority: requirement.priority,
      status: requirement.status,
      assignedTo: requirement.assignedTo?._id || '',
      estimatedHours: requirement.estimatedHours || '',
      acceptanceCriteria: requirement.acceptanceCriteria || []
    });
    setEditingRequirement(requirement);
    setShowForm(true);
    setPendingFiles([]);
  };

  const handleDelete = (requirementId) => {
    const req = requirements.find(r => r._id === requirementId);
    if (req?.convertedToTask) {
      alert("Cannot delete a requirement that has been converted to a task.");
      return;
    }
    setDeleteModal({
      isOpen: true,
      id: requirementId,
      name: req?.title || 'this requirement'
    });
  };

  const handleConvertToTask = async (requirementId) => {
    try {
      await requirementAPI.convertToTask(projectId, requirementId);
      await onRefresh();
      setViewingRequirement(null);
    } catch (error) {
      console.error('Error converting requirement to task:', error);
      alert(error.response?.data?.error || 'Failed to convert to task');
    }
  };

  const confirmDelete = async () => {
    try {
      await requirementAPI.delete(projectId, deleteModal.id);
      await onRefresh();
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting requirement:', error);
    }
  };



  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || req.priority === filterPriority;
    const matchesType = filterType === 'all' || req.type === filterType;
    return matchesSearch && matchesPriority && matchesType;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Requirements</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredRequirements.length} of {requirements.length} entries tracked
          </p>
        </div>
        {isProjectOwner && (
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Cancel' : '+ Add Requirement'}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search Requirements</label>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 cursor-pointer font-medium"
            >
              <option value="all">All Types</option>
              <option value="functional">Functional</option>
              <option value="non-functional">Non-Functional</option>
              <option value="business">Business</option>
              <option value="technical">Technical</option>
              <option value="user-story">User Story</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 cursor-pointer font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">📝</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{editingRequirement ? 'Edit Requirement' : 'Add New Requirement'}</h3>
              <p className="text-sm text-slate-500">Document detailed functional specifications.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1">Requirement Title <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g. Exportable Analytics Dashboard"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1">Detailed Documentation</label>
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-inner">
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(content, delta, source, editor) => {
                    if (source === 'user') {
                      setFormData(prev => ({ ...prev, description: content }));
                    }
                  }}
                  modules={quillModules}
                  formats={quillFormats}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none cursor-pointer"
                >
                  <option value="functional">Functional</option>
                  <option value="non-functional">Non-Functional</option>
                  <option value="business">Business</option>
                  <option value="technical">Technical</option>
                  <option value="user-story">User Story</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <label className="text-xs font-bold text-slate-700 ml-1">Attachments</label>
              <div
                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all cursor-pointer shadow-inner"
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" />
                <span className="text-3xl mb-2">📎</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upload relevant project assets</span>
              </div>

              {pendingFiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {pendingFiles.map((file, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📄</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 line-clamp-1">{file.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removePendingFile(index)} className="!text-rose-500 hover:!text-rose-700 !p-1">✕</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={uploadingFiles} loading={uploadingFiles}>
                {uploadingFiles ? 'Saving...' : editingRequirement ? 'Update Requirement' : 'Save Requirement'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRequirements.map(req => (
            <div
              key={req._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col"
              onClick={() => setViewingRequirement(req)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg shadow-inner ring-1 ring-slate-100 italic">RQ</div>
                  <div>
                    <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{req.title}</h3>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {req.convertedToTask ? (
                        <Badge variant="success" size="sm" className="font-black">✓ CONVERTED: {req.convertedToTask.title || 'TASK'}</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">PENDING TASK</Badge>
                      )}
                      <Badge variant={req.priority === 'critical' ? 'danger' : req.priority === 'high' ? 'warning' : req.priority === 'medium' ? 'info' : 'default'} size="sm">{req.priority}</Badge>
                      <Badge variant="default" size="sm">{req.type}</Badge>
                    </div>
                  </div>
                </div>
                {isProjectOwner && (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(req)} className="!text-slate-400 hover:!text-indigo-600 !p-1.5">✎</Button>
                    {!req.convertedToTask && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(req._id)} className="!text-slate-400 hover:!text-rose-600 !p-1.5">✕</Button>
                    )}
                  </div>
                )}
              </div>

              <div className="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed bg-slate-50 p-4 rounded-xl font-medium flex-1 overflow-hidden" dangerouslySetInnerHTML={{ __html: req.description || 'No detailed documentation' }} />

              <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {req.assignedTo && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 italic ring-1 ring-slate-100 px-2 py-1 rounded bg-white">👤 {req.assignedTo.name}</div>}
                </div>
                <div className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">See Details ⮕</div>
              </div>
            </div>
          ))}

          {filteredRequirements.length === 0 && (
            <div className="col-span-full py-24 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-bold text-slate-900">No requirements found</h3>
              <p className="text-sm text-slate-500 mt-1">Adjust filters or create a new requirement.</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilterPriority('all'); setFilterType('all'); }} className="mt-6 !text-indigo-600 hover:underline">Clear Filters</Button>
            </div>
          )}
        </div>
      )}

      {viewingRequirement && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 font-sans" onClick={() => setViewingRequirement(null)}>
          <div className="bg-white rounded-3xl p-10 w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl border border-slate-100">📋</div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-none">{viewingRequirement.title}</h2>
                  <div className="flex items-center gap-3 mt-4">
                    {viewingRequirement.convertedToTask ? (
                      <Badge variant="success" size="sm" className="font-black animate-pulse">✓ CONVERTED: {viewingRequirement.convertedToTask.title || 'TASK'}</Badge>
                    ) : (
                      <Badge variant="warning" size="sm">PENDING TASK CONVERSION</Badge>
                    )}
                    <Badge variant={viewingRequirement.priority === 'critical' ? 'danger' : viewingRequirement.priority === 'high' ? 'warning' : viewingRequirement.priority === 'medium' ? 'info' : 'default'} size="sm">{viewingRequirement.priority}</Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingRequirement(null)} className="!text-slate-400 hover:!text-slate-900 !text-2xl !leading-none !p-2">✕</Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin space-y-10">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Specifications</h4>
                <div className="prose prose-slate prose-sm max-w-none bg-slate-50 p-8 rounded-2xl border border-slate-100 text-slate-700 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: viewingRequirement.description || 'No documentation provided.' }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Assignment & Estimates</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-100 p-4 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Owner</span>
                      <span className="text-sm font-bold text-slate-900">{viewingRequirement.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-xl">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Estimate</span>
                      <span className="text-sm font-bold text-slate-900">{viewingRequirement.estimatedHours || 0} Hours</span>
                    </div>
                  </div>
                </div>

                {viewingRequirement.attachments?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Attachments</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {viewingRequirement.attachments.map((file, i) => (
                        <a key={i} href={getAssetUrl(file.path)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-all font-sans" download>
                          <span className="text-lg">📄</span>
                          <span className="text-[11px] font-bold text-slate-600 line-clamp-1">{file.originalName || file.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isProjectOwner && (
              <div className="mt-10 pt-8 border-t border-slate-100 flex gap-4 flex-shrink-0">
                {!viewingRequirement.convertedToTask && (
                  <Button variant="primary" onClick={() => handleConvertToTask(viewingRequirement._id)} className="flex-[2] !bg-emerald-600 hover:!bg-emerald-700">Convert to Task</Button>
                )}
                <Button variant="secondary" onClick={() => { handleEdit(viewingRequirement); }} className="flex-1">Edit</Button>
                {!viewingRequirement.convertedToTask && (
                  <Button variant="danger" onClick={() => { setViewingRequirement(null); handleDelete(viewingRequirement._id); }} className="flex-1">Delete</Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Requirement"
        message={`Are you sure you want to permanently delete "${deleteModal.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default RequirementsTab;