import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function UserManagement() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'cashier' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Existing users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Membership card state
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberError, setMemberError] = useState('');
  const [memberSuccess, setMemberSuccess] = useState('');
  const [memberForm, setMemberForm] = useState({ card_number: '', name: '', phone: '' });
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchMembers();
  }, []);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const toggleUserActive = async (user) => {
    try {
      const action = user.is_active ? 'deactivate' : 'reactivate';
      await api.patch(`/auth/users/${user.id}/${action}`);
      fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      const res = await api.get('/members');
      setMembers(res.data);
    } catch (err) {
      setMemberError('Failed to load membership cards');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await api.post('/auth/register', formData);
      setSuccess(`User "${formData.username}" created successfully as ${formData.role}`);
      setFormData({ username: '', email: '', password: '', role: 'cashier' });
      fetchUsers();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        setError(errors.map((e) => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to create user');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetMemberForm = () => {
    setMemberForm({ card_number: '', name: '', phone: '' });
    setEditingMemberId(null);
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    setMemberError('');
    setMemberSuccess('');
    setMemberSubmitting(true);

    try {
      if (editingMemberId) {
        await api.put(`/members/${editingMemberId}`, memberForm);
        setMemberSuccess(`Card "${memberForm.card_number}" updated successfully`);
      } else {
        await api.post('/members', memberForm);
        setMemberSuccess(`Card "${memberForm.card_number}" registered successfully`);
      }
      resetMemberForm();
      fetchMembers();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        setMemberError(errors.map((e) => e.msg).join(', '));
      } else {
        setMemberError(err.response?.data?.message || 'Failed to save membership card');
      }
    } finally {
      setMemberSubmitting(false);
    }
  };

  const startEditMember = (member) => {
    setEditingMemberId(member.id);
    setMemberForm({ card_number: member.card_number, name: member.name, phone: member.phone || '' });
    setMemberError('');
    setMemberSuccess('');
  };

  const toggleMemberActive = async (member) => {
    try {
      const action = member.is_active ? 'deactivate' : 'reactivate';
      await api.patch(`/members/${member.id}/${action}`);
      fetchMembers();
    } catch (err) {
      setMemberError('Failed to update card status');
    }
  };

  return (
    <div className="page-container">
      <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>

      <h1>👥 User Management</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.2rem' }}>Create new staff accounts (admin or cashier).</p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <input
          type="text" placeholder="Username" required
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        <input
          type="email" placeholder="Email" required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <input
          type="password" placeholder="Password (min 6 characters)" required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        >
          <option value="cashier">Cashier</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '0.7rem' }}>
          {submitting ? 'Creating...' : 'Create User'}
        </button>
      </form>

      <h3 style={{ marginTop: '2rem', marginBottom: '0.8rem' }}>Existing Staff Accounts</h3>
      {usersLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : (
        <div className="table-wrap" style={{ marginBottom: '2rem' }}>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleUserActive(u)}
                      className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                    >
                      {u.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h1 style={{ marginTop: '2.5rem' }}>💳 Membership Cards</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.2rem' }}>Register, edit, or deactivate customer membership cards.</p>

      {memberError && <div className="alert alert-error">{memberError}</div>}
      {memberSuccess && <div className="alert alert-success">{memberSuccess}</div>}

      <form onSubmit={handleMemberSubmit} className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <input
          type="text" placeholder="Card Number" required
          value={memberForm.card_number}
          onChange={(e) => setMemberForm({ ...memberForm, card_number: e.target.value })}
        />
        <input
          type="text" placeholder="Member Name" required
          value={memberForm.name}
          onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
        />
        <input
          type="text" placeholder="Phone (optional)"
          value={memberForm.phone}
          onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
        />

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button type="submit" disabled={memberSubmitting} className="btn btn-primary" style={{ flex: 1, padding: '0.7rem' }}>
            {memberSubmitting ? 'Saving...' : editingMemberId ? 'Update Card' : 'Register Card'}
          </button>
          {editingMemberId && (
            <button type="button" onClick={resetMemberForm} className="btn btn-secondary" style={{ padding: '0.7rem 1rem' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {membersLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Card No.</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Points</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} style={{ opacity: member.is_active ? 1 : 0.5 }}>
                  <td><strong>{member.card_number}</strong></td>
                  <td>{member.name}</td>
                  <td>{member.phone || '—'}</td>
                  <td>{member.points_balance}</td>
                  <td>
                    <span className={`badge ${member.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button onClick={() => startEditMember(member)} className="btn btn-secondary btn-sm">Edit</button>
                    <button
                      onClick={() => toggleMemberActive(member)}
                      className={`btn btn-sm ${member.is_active ? 'btn-danger' : 'btn-success'}`}
                    >
                      {member.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserManagement;