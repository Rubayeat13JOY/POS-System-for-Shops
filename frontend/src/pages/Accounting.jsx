import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Accounting() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [categoryReport, setCategoryReport] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', expense_date: '' });
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });
  const [activePreset, setActivePreset] = useState('all');
  const [basketPairs, setBasketPairs] = useState([]);
  const [basketLoading, setBasketLoading] = useState(true);
  const [salesReport, setSalesReport] = useState([]);
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [reportLoading, setReportLoading] = useState(true);
  const [detailDate, setDetailDate] = useState(new Date().toISOString().split('T')[0]);
  const [detailPeriodType, setDetailPeriodType] = useState('day');
  const [periodDetail, setPeriodDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
 
  const fetchAll = async (range = dateRange) => {
  try {
    setLoading(true);

    const params = (range.start_date && range.end_date)
      ? `?start_date=${range.start_date}&end_date=${range.end_date}`
      : '';

    const [summaryRes, categoryRes, expensesRes] = await Promise.all([
      api.get(`/accounting/summary${params}`),
      api.get(`/accounting/category-sales${params}`),
      api.get('/expenses')
    ]);
    setSummary(summaryRes.data);
    setCategoryReport(categoryRes.data.category_report);
    setExpenses(expensesRes.data);
  } catch (err) {
    setError('Failed to load accounting data');
  } finally {
    setLoading(false);
  }
};

const fetchPeriodDetail = async (periodType = detailPeriodType, date = detailDate) => {
  try {
    setDetailLoading(true);
    const res = await api.get(`/accounting/period-detail?period_type=${periodType}&date=${date}`);
    setPeriodDetail(res.data);
  } catch (err) {
    setError('Failed to load sales breakdown');
  } finally {
    setDetailLoading(false);
  }
};

useEffect(() => {
  fetchAll();
  fetchBasket();
  fetchSalesReport();
  fetchPeriodDetail();
}, []);

const fetchBasket = async () => {
  try {
    setBasketLoading(true);
    const res = await api.get('/market-basket/analyze');
    setBasketPairs(res.data.pairs || []);
  } catch (err) {
    setError('Failed to load market basket analysis');
  } finally {
    setBasketLoading(false);
  }
};

const fetchSalesReport = async (period = reportPeriod) => {
  try {
    setReportLoading(true);
    const res = await api.get(`/accounting/sales-report?period=${period}`);
    setSalesReport(res.data.report);
  } catch (err) {
    setError('Failed to load sales report');
  } finally {
    setReportLoading(false);
  }
};

const changeReportPeriod = (period) => {
  setReportPeriod(period);
  fetchSalesReport(period);
};

const formatPeriodLabel = (row) => {
  const start = new Date(row.period_start);
  const end = new Date(row.period_end);

  if (reportPeriod === 'yearly') {
    return row.period;
  }
  if (reportPeriod === 'monthly') {
    return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} – ${endStr}`;
};

// Format a Date object as YYYY-MM-DD for the API
const formatDate = (date) => date.toISOString().split('T')[0];

const applyPreset = (preset) => {
  setActivePreset(preset);
  const today = new Date();
  let start, end;

  if (preset === 'week') {
    start = new Date(today);
    start.setDate(today.getDate() - 6); // last 7 days including today
    end = today;
  } else if (preset === 'month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1); // 1st of this month
    end = today;
  } else {
    // 'all' preset - clear the range
    const cleared = { start_date: '', end_date: '' };
    setDateRange(cleared);
    fetchAll(cleared);
    return;
  }

  const newRange = { start_date: formatDate(start), end_date: formatDate(end) };
  setDateRange(newRange);
  fetchAll(newRange);
};

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', expenseForm);
      setExpenseForm({ description: '', amount: '', expense_date: '' });
      setShowExpenseForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchAll();
    } catch (err) {
      setError('Failed to delete expense');
    }
  };

  if (loading) return <div className="page-container"><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>;

  return (
    <div className="page-container">
      <button onClick={() => navigate('/dashboard')} className="back-btn">← Back to Dashboard</button>

      <h1>💰 Accounting</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="summary-card">
            <p className="label">Total Income</p>
            <h2 className="value" style={{ color: 'var(--success)' }}>{summary.total_income} tk</h2>
          </div>
          <div className="summary-card">
            <p className="label">Total Expenses</p>
            <h2 className="value" style={{ color: 'var(--danger)' }}>{summary.total_expenses} tk</h2>
          </div>
          <div className="summary-card">
            <p className="label">Profit</p>
            <h2 className="value" style={{ color: summary.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{summary.profit} tk</h2>
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: '0.8rem' }}>Category-wise Sales</h3>
      <div className="table-wrap" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Quantity Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {categoryReport.map((cat, idx) => (
              <tr key={idx}>
                <td><strong>{cat.category_name}</strong></td>
                <td>{cat.total_quantity_sold}</td>
                <td>{cat.total_revenue} tk</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
            
      
      <div className="printable-section" style={{ marginBottom: '2rem' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
    <h3>📊 Sales Report</h3>
    <div className="no-print" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      <select
        value={detailPeriodType}
        onChange={(e) => { setDetailPeriodType(e.target.value); fetchPeriodDetail(e.target.value, detailDate); }}
        style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
      >
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
      </select>
      <input
        type="date"
        value={detailDate}
        onChange={(e) => { setDetailDate(e.target.value); fetchPeriodDetail(detailPeriodType, e.target.value); }}
        style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
      />
      <button onClick={() => window.print()} className="btn btn-secondary btn-sm">🖨️ Print</button>
    </div>
  </div>

  {detailLoading ? (
    <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
  ) : !periodDetail ? (
    <p style={{ color: 'var(--text-muted)' }}>No data.</p>
  ) : (
    <>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        {periodDetail.start_date === periodDetail.end_date
          ? periodDetail.start_date
          : `${periodDetail.start_date} to ${periodDetail.end_date}`}
      </p>

      <h4 style={{ marginBottom: '0.6rem' }}>Sales Summary</h4>
      <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
        <table>
          <thead>
            <tr>
              <th>Sales Count</th>
              <th>Total Income</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{periodDetail.sales_count}</td>
              <td>{periodDetail.total_income} tk</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 style={{ marginBottom: '0.6rem' }}>Sales by Category</h4>
      {periodDetail.category_breakdown.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No sales in this period.</p>
      ) : (
        <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {periodDetail.category_breakdown.map((cat, idx) => (
                <tr key={idx}>
                  <td><strong>{cat.category_name}</strong></td>
                  <td>{cat.quantity_sold}</td>
                  <td>{cat.revenue} tk</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h4 style={{ marginBottom: '0.6rem' }}>Sales by Product</h4>
      {periodDetail.product_breakdown.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No sales in this period.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {periodDetail.product_breakdown.map((p, idx) => (
                <tr key={idx}>
                  <td><strong>{p.product_name}</strong></td>
                  <td>{p.category_name}</td>
                  <td>{p.quantity_sold}</td>
                  <td>{p.revenue} tk</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )}
</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
        <h3>Expenses</h3>
        <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="btn btn-primary btn-sm">
          {showExpenseForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {showExpenseForm && (
        <form onSubmit={handleAddExpense} className="form-card" style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
          <input
            type="text" placeholder="Description" required
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            style={{ flex: 2, minWidth: '180px' }}
          />
          <input
            type="number" placeholder="Amount" required
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            style={{ flex: 1, minWidth: '100px' }}
          />
          <input
            type="date"
            value={expenseForm.expense_date}
            onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
            style={{ flex: 1, minWidth: '140px' }}
          />
          <button type="submit" className="btn btn-success">Save</button>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id}>
                <td>{exp.description}</td>
                <td>{exp.amount} tk</td>
                <td>{exp.expense_date}</td>
                <td><button onClick={() => handleDeleteExpense(exp.id)} className="btn btn-danger btn-sm">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 style={{ marginTop: '2rem', marginBottom: '0.8rem' }}>🛒 Frequently Bought Together</h3>
{basketLoading ? (
  <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
) : basketPairs.length === 0 ? (
  <p style={{ color: 'var(--text-muted)' }}>Not enough sales data yet to find patterns.</p>
) : (
  <div className="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Pattern</th>
          <th>Confidence</th>
          <th>Support</th>
          <th>Times Together</th>
        </tr>
      </thead>
      <tbody>
        {basketPairs.map((pair, idx) => (
          <tr key={idx}>
            <td>{pair.insight}</td>
            <td>
              <span className="badge badge-success">
                {Math.max(pair.confidence_a_to_b_percent, pair.confidence_b_to_a_percent)}%
              </span>
            </td>
            <td>{pair.support_percent}%</td>
            <td>{pair.times_bought_together}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
    </div>
  );
}

export default Accounting;