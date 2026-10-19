import { useNavigate } from 'react-router-dom';
import { getUserFromToken, isAdmin, logout } from '../services/auth';

function Dashboard() {
  const navigate = useNavigate();
  const admin = isAdmin();

  return (
    <div className="page-container">
      <div className="top-bar">
        <h1>POS Dashboard</h1>
        <div className="user-pill">
          <span className={admin ? 'role-tag' : 'role-tag'} style={{ background: admin ? undefined : 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            {admin ? 'Admin' : 'Cashier'}
          </span>
          <button onClick={logout} className="btn btn-danger btn-sm">Logout</button>
        </div>
      </div>

      <div className="grid">
        <DashboardCard icon="🛒" title="Sales" description="Process a new sale" onClick={() => navigate('/sales')} />
        <DashboardCard icon="📦" title="Products" description="View product catalog" onClick={() => navigate('/products')} />
        <DashboardCard icon="🏷️" title="Categories" description="View categories" onClick={() => navigate('/categories')} />
        <DashboardCard icon="📊" title="Inventory" description="Check stock levels" onClick={() => navigate('/inventory')} />

        {admin && (
          <>
            <DashboardCard icon="💰" title="Accounting" description="Income, expenses, profit" onClick={() => navigate('/accounting')} />
            <DashboardCard icon="👥" title="User Management" description="Manage staff accounts" onClick={() => navigate('/users')} />
          </>
        )}
      </div>
    </div>
  );
}

function DashboardCard({ icon, title, description, onClick }) {
  return (
    <div onClick={onClick} className="nav-card">
      <div style={{ fontSize: '1.8rem', marginBottom: '0.6rem' }}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default Dashboard;