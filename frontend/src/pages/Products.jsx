import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { isAdmin } from '../services/auth';

function Products() {
  const navigate = useNavigate();
  const admin = isAdmin();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [showAddForm, setShowAddForm] = useState(false);
const [formData, setFormData] = useState({
  category_id: '', product_name: '', purchase_price: '', selling_price: '', stock_quantity: '', minimum_stock: ''
});
const [imageFile, setImageFile] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editImageFile, setEditImageFile] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async (searchTerm = '', page = currentPage) => {
    try {
      setLoading(true);
      const res = await api.get(`/products?search=${searchTerm}&page=${page}&limit=8`);
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.currentPage);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      if (imageFile) {
        data.append('image', imageFile);
      }
  
      await api.post('/products', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
  
      setFormData({ category_id: '', product_name: '', purchase_price: '', selling_price: '', stock_quantity: '', minimum_stock: '' });
      setImageFile(null);
      setShowAddForm(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to add product');
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditData({
      category_id: product.category_id,
      product_name: product.product_name,
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      minimum_stock: product.minimum_stock
    });
    setEditImageFile(null);
  };

  const handleUpdate = async (id) => {
    try {
      const data = new FormData();
      Object.keys(editData).forEach((key) => data.append(key, editData[key]));
      if (editImageFile) {
        data.append('image', editImageFile);
      }
  
      await api.put(`/products/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
  
      setEditingId(null);
      setEditImageFile(null);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

   return (
    <div className="page-container">
      <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>

      <h1>📦 Products</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-secondary">Search</button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); fetchProducts('', 1); }} className="btn btn-secondary">Clear</button>
        )}
      </form>

      {admin && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary" style={{ marginBottom: '1rem' }}>
            {showAddForm ? 'Cancel' : '+ Add Product'}
          </button>

          {showAddForm && (
            <form onSubmit={handleAdd} className="form-card">
              <div className="form-row" style={{ marginBottom: '0.7rem' }}>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                  ))}
                </select>
                <input
                  type="text" placeholder="Product Name" required
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                />
              </div>
              <div className="form-row" style={{ marginBottom: '0.7rem' }}>
                <input
                  type="number" placeholder="Purchase Price" required
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
                <input
                  type="number" placeholder="Selling Price" required
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                />
              </div>
              <div className="form-row" style={{ marginBottom: '0.7rem' }}>
                <input
                  type="number" placeholder="Stock Quantity"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                />
                <input
                  type="number" placeholder="Minimum Stock"
                  value={formData.minimum_stock}
                  onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                />
               
              </div>
              <div style={{ marginBottom: '0.7rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                     Product Picture (optional)
                      </label>
                     <input
                       type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                      />
                </div>
              <button type="submit" className="btn btn-success" style={{ width: '100%' }}>Save Product</button>
            </form>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
          <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Purchase</th>
                <th>Selling</th>
                <th>Stock</th>
                {admin && <th>Actions</th>}
              </tr>
          </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  {editingId === p.id ? (
                      <>
                        <td>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditImageFile(e.target.files[0])}
                            style={{ width: '90px', fontSize: '0.7rem' }}
                          />
                        </td>
    <td><input value={editData.product_name} onChange={(e) => setEditData({ ...editData, product_name: e.target.value })} style={{ width: '100%' }} /></td>
                      <td>
                        <select value={editData.category_id} onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                          ))}
                        </select>
                      </td>
                      <td><input type="number" value={editData.purchase_price} onChange={(e) => setEditData({ ...editData, purchase_price: e.target.value })} style={{ width: '80px' }} /></td>
                      <td><input type="number" value={editData.selling_price} onChange={(e) => setEditData({ ...editData, selling_price: e.target.value })} style={{ width: '80px' }} /></td>
                      <td>{p.stock_quantity}</td>
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => handleUpdate(p.id)} className="btn btn-success btn-sm">Save</button>
                        <button onClick={() => setEditingId(null)} className="btn btn-secondary btn-sm">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        {p.image_url ? (
                          <img src={`http://localhost:5000${p.image_url}`} alt={p.product_name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
                        )}
                      </td>
                      <td><strong>{p.product_name}</strong></td>
                      <td>{p.Category?.category_name}</td>
                      <td>{p.purchase_price} tk</td>
                      <td>{p.selling_price} tk</td>
                      <td>{p.stock_quantity}</td>
                      {admin && (
                        <td style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => startEdit(p)} className="btn btn-secondary btn-sm">Edit</button>
                          <button onClick={() => handleDelete(p.id)} className="btn btn-danger btn-sm">Delete</button>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
      )}

       {totalPages > 1 && (
           <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
             <button onClick={() => fetchProducts(search, currentPage - 1)} disabled={currentPage === 1} className="btn btn-secondary btn-sm">← Prev</button>
              <span style={{ padding: '0.4rem 0.8rem', color: 'var(--text-muted)' }}>{currentPage} / {totalPages}</span>
                <button onClick={() => fetchProducts(search, currentPage + 1)} disabled={currentPage === totalPages} className="btn btn-secondary btn-sm">Next →</button>
                </div>
         )}
    </div>
  );
}

export default Products;