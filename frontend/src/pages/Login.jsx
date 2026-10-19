import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('refreshToken', res.data.refreshToken);

      const tokenRes = await api.post('/auth/refresh-token', {
        refreshToken: res.data.refreshToken
      });
      localStorage.setItem('accessToken', tokenRes.data.accessToken);

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '340px', padding: '2.2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>🛍️</div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>POS System</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.3rem 0 0 0' }}>Sign in to continue</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '0.8rem' }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '1.2rem' }}
        />

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default Login;