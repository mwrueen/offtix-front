import { taskRoleAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const WorkflowRolesManager = ({ projectId, isProjectOwner, users = [] }) => {
  const { showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: '👤',
    defaultAssignees: []
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  useEffect(() => {
    fetchRoles();
  }, [projectId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await taskRoleAPI.getAll(projectId);
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      showToast('Failed to load workflow roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await taskRoleAPI.initializeDefaults(projectId);
      showToast('Default workflow roles created', 'success');
      fetchRoles();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to initialize roles', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await taskRoleAPI.update(projectId, editingRole._id, formData);
        showToast('Role updated successfully', 'success');
      } else {
        await taskRoleAPI.create(projectId, formData);
        showToast('Role created successfully', 'success');
      }
      resetForm();
      fetchRoles();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to save role', 'error');
    }
  };

  const handleDelete = (roleId) => {
    const role = roles.find(r => r._id === roleId);
    setDeleteModal({
      isOpen: true,
      id: roleId,
      name: role?.name || 'this role'
    });
  };

  const confirmDelete = async () => {
    try {
      await taskRoleAPI.delete(projectId, deleteModal.id);
      showToast('Role deleted successfully', 'success');
      setDeleteModal({ isOpen: false, id: null, name: '' });
      fetchRoles();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to delete role', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#6366f1', icon: '👤', defaultAssignees: [] });
    setEditingRole(null);
    setShowAddForm(false);
  };

  const startEdit = (role) => {
    setFormData({
      name: role.name,
      description: role.description || '',
      color: role.color || '#6366f1',
      icon: role.icon || '👤',
      defaultAssignees: role.defaultAssignees?.map(u => u._id) || []
    });
    setEditingRole(role);
    setShowAddForm(true);
  };

  const iconOptions = ['👤', '🎨', '🗄️', '⚙️', '💻', '🧪', '🚀', '📝', '🔧', '📊', '🎯', '🔐'];

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading workflow roles...</div>;
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#172b4d' }}>
          Workflow Roles
        </h3>
        {isProjectOwner && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {roles.length === 0 && (
              <button
                onClick={handleInitializeDefaults}
                style={{
                  padding: '8px 12px', backgroundColor: '#10b981', color: 'white',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px'
                }}
              >
                Initialize Default Roles
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                padding: '8px 12px', backgroundColor: '#0052cc', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px'
              }}
            >
              + Add Role
            </button>
          </div>
        )}
      </div>

      <p style={{ fontSize: '13px', color: '#5e6c84', marginBottom: '16px' }}>
        Define the sequential roles for task workflows. When a task is started, employees assigned to the first role
        will be notified. Upon completion, they can hand off to the next role with comments, files, and URLs.
      </p>

      {roles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#5e6c84', backgroundColor: '#f4f5f7', borderRadius: '4px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
          <p style={{ margin: 0 }}>No workflow roles defined. {isProjectOwner && 'Click "Initialize Default Roles" to get started.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {roles.map((role, index) => (
            <div
              key={role._id}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                backgroundColor: '#ffffff', border: '1px solid #dfe1e6', borderRadius: '4px'
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '4px', backgroundColor: role.color || '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
              }}>
                {role.icon || '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', fontSize: '14px', color: '#172b4d' }}>
                  {index + 1}. {role.name}
                </div>
                {role.description && (
                  <div style={{ fontSize: '12px', color: '#5e6c84' }}>{role.description}</div>
                )}
              </div>
              {isProjectOwner && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => startEdit(role)} style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', border: '1px solid #dfe1e6', borderRadius: '3px', backgroundColor: '#fff' }}>Edit</button>
                  <button onClick={() => handleDelete(role._id)} style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', border: '1px solid #dfe1e6', borderRadius: '3px', backgroundColor: '#fff', color: '#de350b' }}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Role Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', width: '480px', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#172b4d' }}>
              {editingRole ? 'Edit Workflow Role' : 'Add Workflow Role'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px' }}
                  placeholder="e.g., UI/UX Design"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px', minHeight: '60px' }}
                  placeholder="Describe what this role involves"
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={{ width: '100%', height: '36px', border: '1px solid #dfe1e6', borderRadius: '4px', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Icon</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        style={{
                          width: '32px', height: '32px', border: formData.icon === icon ? '2px solid #0052cc' : '1px solid #dfe1e6',
                          borderRadius: '4px', cursor: 'pointer', fontSize: '16px', backgroundColor: '#fff'
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Default Assignees</label>
                <select
                  multiple
                  value={formData.defaultAssignees}
                  onChange={(e) => setFormData({ ...formData, defaultAssignees: Array.from(e.target.selectedOptions, o => o.value) })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px', minHeight: '80px' }}
                >
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                  ))}
                </select>
                <p style={{ fontSize: '11px', color: '#5e6c84', marginTop: '4px' }}>Hold Ctrl/Cmd to select multiple. These will be pre-selected when assigning this role to tasks.</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={resetForm} style={{ padding: '8px 16px', border: '1px solid #dfe1e6', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#fff' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#0052cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Workflow Role"
        message="Are you sure you want to delete this role? This may affect existing tasks that use this workflow."
        itemName={deleteModal.name}
      />
    </div>
  );
};

export default WorkflowRolesManager;

