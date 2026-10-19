import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { isAdmin } from '../services/auth';

function Categories() {
  const navigate = useNavigate();
  const admin = isAdmin();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await api.post('/categories', { category_name: newCategoryName });
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleUpdate = async (id) => {
    try {
      await api.put(`/categories/${id}`, { category_name: editingName });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="page-container narrow">
      <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>

      <h1>🏷️ Categories</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {admin && (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">+ Add</button>
        </form>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                {admin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{cat.id}</td>
                  <td>
                    {editingId === cat.id ? (
                      <input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                    ) : (
                      <strong>{cat.category_name}</strong>
                    )}
                  </td>
                  {admin && (
                    <td>
                      {editingId === cat.id ? (
                        <span style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => handleUpdate(cat.id)} className="btn btn-success btn-sm">Save</button>
                          <button onClick={() => setEditingId(null)} className="btn btn-secondary btn-sm">Cancel</button>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => { setEditingId(cat.id); setEditingName(cat.category_name); }} className="btn btn-secondary btn-sm">Edit</button>
                          <button onClick={() => handleDelete(cat.id)} className="btn btn-danger btn-sm">Delete</button>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Categories;