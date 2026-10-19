import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Sales() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [member, setMember] = useState(null);
  const [memberError, setMemberError] = useState('');
  const [redeemPoints, setRedeemPoints] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const fetchProducts = async (page = 1, searchTerm = search, categoryId = selectedCategory) => {
    try {
      setLoading(true);
      let url = `/products?page=${page}&limit=6&search=${encodeURIComponent(searchTerm)}`;
      if (categoryId !== '' && categoryId !== null && categoryId !== undefined) {
        url += `&category_id=${categoryId}`;
      }
      const res = await api.get(url);
      setProducts(res.data.products);
      setProductPage(res.data.currentPage);
      setProductTotalPages(res.data.totalPages);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesHistory = async (page = 1, searchTerm = historySearch) => {
    try {
      setHistoryLoading(true);
      const res = await api.get(`/sales?page=${page}&limit=10&search=${encodeURIComponent(searchTerm)}`);
      setSalesHistory(res.data.sales);
      setHistoryPage(res.data.currentPage);
      setHistoryTotalPages(res.data.totalPages);
    } catch (err) {
      setError('Failed to load sales history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchInvoiceDetail = async (id) => {
    try {
      const res = await api.get(`/sales/${id}`);
      setSelectedInvoice(res.data);
    } catch (err) {
      setError('Failed to load invoice');
    }
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.product_id === product.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.product_name,
        selling_price: parseFloat(product.selling_price),
        image_url: product.image_url,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map((item) =>
      item.product_id === productId ? { ...item, quantity: newQty } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };
  const lookupMember = async () => {
    if (!cardNumber.trim()) return;
    setMemberError('');
    try {
      const res = await api.get(`/members/${encodeURIComponent(cardNumber.trim())}`);
      setMember(res.data);
    } catch (err) {
      setMember(null);
      setMemberError('Member not found');
    }
  };
  
  const clearMember = () => {
    setMember(null);
    setCardNumber('');
    setRedeemPoints('');
    setMemberError('');
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    fetchProducts(1, e.target.value, selectedCategory);
  };

  const handleHistorySearchChange = (e) => {
    setHistorySearch(e.target.value);
    fetchSalesHistory(1, e.target.value);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchProducts(1, search, categoryId);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const discountAmount = discountType === 'percentage'
  ? (cartTotal * (parseFloat(discountValue) || 0)) / 100
  : parseFloat(discountValue) || 0;
  const redeemDiscount = (parseInt(redeemPoints) || 0) * 0.10; // must match backend POINTS_REDEEM_VALUE
  const finalTotal = Math.max(0, cartTotal - discountAmount - redeemDiscount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const items = cart.map((item) => ({ product_id: item.product_id, quantity: item.quantity }));
      const res = await api.post('/sales', {
        items,
        discount: discountAmount,
          customer_mobile: customerMobile || null,
        member_id: member ? member.id : null,
        redeem_points: redeemPoints || 0
      });
      setInvoiceModal({
        invoice_no: res.data.invoice_no,
        total_amount: res.data.total_amount,
        discount: discountAmount,
        redeem_discount: redeemDiscount,
        points_earned: res.data.points_earned,
        points_redeemed: res.data.points_redeemed,
        customer_mobile: customerMobile || null,
        member_name: member ? member.name : null,
        items: cart
      });
      setDiscountValue('');
      setCustomerMobile('');
      setCart([]);
      setMember();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete sale');
    } finally {
      setSubmitting(false);
    }
  };
  const registerMember = async () => {
    if (!cardNumber.trim() || !newMemberName.trim()) {
      setMemberError('Card number and name are required');
      return;
    }
    setRegistering(true);
    setMemberError('');
    try {
      const res = await api.post('/members', {
        card_number: cardNumber.trim(),
        name: newMemberName.trim(),
        phone: newMemberPhone || null
      });
      setMember(res.data.member);
      setShowRegisterForm(false);
      setNewMemberName('');
      setNewMemberPhone('');
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to register member');
    } finally {
      setRegistering(false);
    }
  };
      const categoryIconMap = {
        'electronics': '📱',
        'vegetables': '🥦',
        'perfumes': '🌸',
        'home appliance': '🏠',
        'fruits': '🍎',
        'clothing': '👗',
        'medicine': '💊',
        'food': '🍔',
        'drinks': '🥤',
        'stationery': '✏️',
      };
      const getCategoryIcon = (name) => {
        return categoryIconMap[name.toLowerCase()] || '📦';
      };

  return (
    <div className="page-container" style={{ padding: '1rem' }}>
      <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>

      {/* Tab buttons */}
      <div style={{ display: 'flex', gap: '0.6rem', margin: '1rem 0' }}>
        <button
          onClick={() => { setShowHistory(false); }}
          className={`btn btn-sm ${!showHistory ? 'btn-primary' : 'btn-secondary'}`}>
          🛒 New Sale
        </button>
        <button
          onClick={() => { setShowHistory(true); fetchSalesHistory(1); }}
          className={`btn btn-sm ${showHistory ? 'btn-primary' : 'btn-secondary'}`}>
          📋 Sales History
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Invoice Modal */}
      {invoiceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
                         justifyContent: 'center', zIndex: 1000 }}>
          <div className="printable-invoice" style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '2rem', minWidth: '380px', maxWidth: '500px', width: '90%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '0.3rem' }}>✅ Sale Complete</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{invoiceModal.invoice_no}</p>
            {(invoiceModal.member_name || invoiceModal.customer_mobile) && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {invoiceModal.member_name && `👤 ${invoiceModal.member_name}`}
                    {invoiceModal.member_name && invoiceModal.customer_mobile && ' · '}
                    {invoiceModal.customer_mobile && `📱 ${invoiceModal.customer_mobile}`}
                  </p>
                )}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceModal.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.selling_price} tk</td>
                      <td>{item.selling_price * item.quantity} tk</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invoiceModal.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', color: 'var(--danger)' }}>
                  <span>Discount</span>
                  <span>-Tk {invoiceModal.discount.toFixed(2)}</span>
                </div>
              )}
              {invoiceModal.redeem_discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', color: 'var(--danger)' }}>
                  <span>Points Redeemed ({invoiceModal.points_redeemed})</span>
                  <span>-Tk {invoiceModal.redeem_discount.toFixed(2)}</span>
                </div>
              )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', fontWeight: 700, fontSize: '1.1rem' }}>
              <span>Total</span>
              <span style={{ color: 'var(--success)' }}>{invoiceModal.total_amount} tk</span>
            </div>
            {invoiceModal.points_earned > 0 && (
              <p style={{ textAlign: 'center', color: 'var(--success)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                +{invoiceModal.points_earned} points earned
              </p>
            )}
            <div className="no-print" style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}> <button onClick={() => window.print()} className="btn btn-secondary" style={{ flex: 1 }}>🖨️ Print</button>
            <button onClick={() => setInvoiceModal(null)} className="btn btn-primary" style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Invoice Detail Modal */}
      {selectedInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="printable-invoice" style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '2rem', minWidth: '380px', maxWidth: '500px', width: '90%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '0.3rem' }}>🧾 Invoice</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{selectedInvoice.invoice_no}</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.SaleDetails.map((detail, idx) => (
                    <tr key={idx}>
                      <td>{detail.Product.product_name}</td>
                      <td>{detail.quantity}</td>
                      <td>{detail.unit_price} tk</td>
                      <td>{detail.unit_price * detail.quantity} tk</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem', fontWeight: 700, fontSize: '1.1rem' }}>
              <span>Total</span>
              <span style={{ color: 'var(--success)' }}>{selectedInvoice.total_amount} tk</span>
            </div>
            <div className="no-print" style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}> <button onClick={() => window.print()} className="btn btn-secondary" style={{ flex: 1 }}>🖨️ Print</button>
            <button onClick={() => setSelectedInvoice(null)} className="btn btn-primary" style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showHistory ? (
  <div>
    {/* Search */}
    <input
      type="text"
      placeholder="🔍 Search by invoice no or mobile..."
      value={historySearch}
      onChange={handleHistorySearchChange}
      style={{ width: '100%', marginBottom: '1rem', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', fontSize: '0.95rem' }}
    />

    {historyLoading ? (
      <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
    ) : (
      <>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SL</th>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {salesHistory.map((sale, idx) => (
                <tr key={sale.id}>
                  <td>{(historyPage - 1) * 10 + idx + 1}</td>
                  <td><strong>{sale.invoice_no}</strong></td>
                  <td>{sale.sale_date}</td>
                  <td>{sale.total_amount} tk</td>
                  <td>
                    <button onClick={() => fetchInvoiceDetail(sale.id)} className="btn btn-primary btn-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {historyTotalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
            <button onClick={() => fetchSalesHistory(historyPage - 1)} disabled={historyPage === 1} className="btn btn-secondary btn-sm">← Prev</button>
            <span style={{ padding: '0.4rem 0.8rem', color: 'var(--text-muted)' }}>{historyPage} / {historyTotalPages}</span>
            <button onClick={() => fetchSalesHistory(historyPage + 1)} disabled={historyPage === historyTotalPages} className="btn btn-secondary btn-sm">Next →</button>
          </div>
        )}
      </>
    )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

          {/* LEFT: Products */}
          <div>
            {/* Search */}
            <input
              type="text"
              placeholder="🔍 Search items here..."
              value={search}
              onChange={handleSearchChange}
              style={{ width: '100%', marginBottom: '1rem', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', fontSize: '0.95rem' }}
            />

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleCategoryChange('')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                  padding: '0.5rem 1rem', borderRadius: '10px', border: '2px solid',
                  borderColor: selectedCategory === '' ? 'var(--primary)' : 'var(--border)',
                  background: selectedCategory === '' ? 'var(--primary)' : 'var(--card-bg)',
                  color: selectedCategory === '' ? '#fff' : 'var(--text)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, minWidth: '60px'
                }}>
                <span style={{ fontSize: '1.3rem' }}>🛒</span>
                All
              </button>
              {categories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                    padding: '0.5rem 1rem', borderRadius: '10px', border: '2px solid',
                    borderColor: selectedCategory === cat.id ? 'var(--primary)' : 'var(--border)',
                    background: selectedCategory === cat.id ? 'var(--primary)' : 'var(--card-bg)',
                    color: selectedCategory === cat.id ? '#fff' : 'var(--text)',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, minWidth: '60px'
                  }}>
                  <span style={{ fontSize: '1.3rem' }}>{getCategoryIcon(cat.category_name)}</span>
                  {cat.category_name}
                </button>
              ))}
            </div>

            <h3 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Choose Items</h3>

            {/* Product Grid */}
            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                {products.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--card-bg)', borderRadius: '14px', padding: '0.8rem',
                      border: '1px solid var(--border)', opacity: p.stock_quantity <= 0 ? 0.5 : 1,
                      position: 'relative'
                    }}>
                    {p.image_url ? (
                      <img src={`http://localhost:5000${p.image_url}`} alt={p.product_name}
                        style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '10px', marginBottom: '0.6rem' }} />
                    ) : (
                      <div style={{ width: '100%', height: '90px', borderRadius: '10px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '0.6rem' }}>📦</div>
                    )}
                    <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '0.2rem' }}>{p.product_name}</strong>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Stock: {p.stock_quantity}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '1rem' }}>{p.selling_price} tk</span>
                      <button
                        onClick={() => p.stock_quantity > 0 && addToCart(p)}
                        disabled={p.stock_quantity <= 0}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                          background: p.stock_quantity > 0 ? 'var(--primary)' : 'var(--border)',
                          color: '#fff', fontSize: '1.2rem', cursor: p.stock_quantity > 0 ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                        }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {productTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
                <button onClick={() => fetchProducts(productPage - 1)} disabled={productPage === 1} className="btn btn-secondary btn-sm">← Prev</button>
                <span style={{ padding: '0.4rem 0.8rem', color: 'var(--text-muted)' }}>{productPage} / {productTotalPages}</span>
                <button onClick={() => fetchProducts(productPage + 1)} disabled={productPage === productTotalPages} className="btn btn-secondary btn-sm">Next →</button>
              </div>
            )}
          </div>

          {/* RIGHT: Bills Panel */}
          <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '1.2rem', border: '1px solid var(--border)', position: 'sticky', top: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>🧾 Bills</h3>

            {cart.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Cart is empty. Click + on a product to add.</p>
            ) : (
              <>
                {/* Cart Items */}
                <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '1rem' }}>
                  {cart.map((item) => (
                    <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border)' }}>
                      {item.image_url ? (
                        <img src={`http://localhost:5000${item.image_url}`} alt={item.product_name}
                          style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>📦</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.selling_price} tk</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="qty-btn">−</button>
                        <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '0.85rem' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="qty-btn">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.product_id)}
                        style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Membership Card */}
                <div style={{ marginBottom: '0.6rem' }}>
                  {!member ? (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input
                        type="text"
                        placeholder="Membership card no."
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && lookupMember()}
                        style={{ flex: 1, padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem' }}
                      />
                      <button onClick={lookupMember} className="btn btn-secondary btn-sm">Find</button>
                    </div>
                  ) : (
                    <div style={{ padding: '0.6rem', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{member.name}</strong>
                        <button onClick={clearMember} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Points balance: {member.points_balance}
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={member.points_balance}
                        placeholder="Redeem points"
                        value={redeemPoints}
                        onChange={(e) => setRedeemPoints(e.target.value)}
                        style={{ width: '100%', marginTop: '0.4rem', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}
                    {memberError && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <p style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{memberError}</p>
                        {memberError === 'Member not found' && !showRegisterForm && (
                          <button
                            onClick={() => setShowRegisterForm(true)}
                            className="btn btn-secondary btn-sm"
                            style={{ marginTop: '0.3rem' }}>
                            + Register this card
                          </button>
                        )}
                      </div>
                    )}

                    {showRegisterForm && (
                      <div style={{ marginTop: '0.5rem', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                          Card: <strong>{cardNumber}</strong>
                        </p>
                        <input
                          type="text"
                          placeholder="Member name"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          style={{ width: '100%', marginBottom: '0.4rem', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', fontSize: '0.8rem' }}
                        />
                        <input
                          type="text"
                          placeholder="Phone (optional)"
                          value={newMemberPhone}
                          onChange={(e) => setNewMemberPhone(e.target.value)}
                          style={{ width: '100%', marginBottom: '0.4rem', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', fontSize: '0.8rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={registerMember} disabled={registering} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                            {registering ? 'Saving...' : 'Save Member'}
                          </button>
                          <button onClick={() => setShowRegisterForm(false)} className="btn btn-secondary btn-sm">Cancel</button>
                        </div>
                      </div>
                    )}                </div>

                {/* Customer Mobile */}
                <input
                  type="text"
                  placeholder="Customer Mobile (optional)"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  style={{ width: '100%', marginBottom: '0.6rem', padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem' }}
                />

                {/* Discount */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem' }}>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    style={{ padding: '0.45rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem' }}>
                    <option value="fixed">tk Fixed</option>
                    <option value="percentage">% Percent</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Discount"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    style={{ flex: 1, padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem' }}
                  />
                </div>



                {/* Totals */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Sub Total</span>
                    <span>{cartTotal} tk</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--danger)' }}>
                      <span>Discount</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {redeemDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--danger)' }}>
                      <span>Points redeemed ({redeemPoints})</span>
                      <span>-${redeemDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 700, fontSize: '1.05rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--primary-dark)' }}>{finalTotal} tk</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="btn btn-success"
                  style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', borderRadius: '10px' }}>
                  {submitting ? 'Processing...' : 'Place Order'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;