import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { isAdmin } from '../services/auth';

function Inventory() {
  const navigate = useNavigate();
  const admin = isAdmin();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showStockIn, setShowStockIn] = useState(null);
  const [stockQty, setStockQty] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setInventory(res.data || []);
    } catch (err) {
      setError('Failed to load inventory');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStockIn = async (productId) => {
    if (!stockQty || stockQty <= 0) {
      setError('Enter a valid quantity');
      return;
    }

    try {
      const res = await api.post('/inventory/stock-in', { product_id: productId, quantity: stockQty });
      setSuccess(`Added ${res.data.added_quantity} units to ${res.data.product_name}. New total: ${res.data.new_quantity}`);
      setError('');
      setStockQty('');
      setShowStockIn(null);
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock');
    }
  };

  return (
    <div className="page-container">
      <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>

      <h1>📊 Inventory</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Min Stock</th>
                <th>Status</th>
                {admin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const low = item.stock_quantity <= item.minimum_stock;
                return (
                  <tr key={item.id}>
                    <td><strong>{item.product_name}</strong></td>
                    <td>{item.category_name}</td>
                    <td>{item.stock_quantity}</td>
                    <td>{item.minimum_stock}</td>
                    <td>
                      <span className={low ? 'badge badge-danger' : 'badge badge-success'}>
                        {low ? 'Low Stock' : 'OK'}
                      </span>
                    </td>
                    {admin && (
                      <td>
                        {showStockIn === item.id ? (
                          <span style={{ display: 'flex', gap: '0.4rem' }}>
                            <input
                              type="number"
                              placeholder="Qty"
                              value={stockQty}
                              onChange={(e) => setStockQty(e.target.value)}
                              style={{ width: '70px' }}
                            />
                            <button onClick={() => handleStockIn(item.id)} className="btn btn-success btn-sm">Add</button>
                            <button onClick={() => { setShowStockIn(null); setStockQty(''); }} className="btn btn-secondary btn-sm">Cancel</button>
                          </span>
                        ) : (
                          <button onClick={() => setShowStockIn(item.id)} className="btn btn-primary btn-sm">Stock In</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Inventory;