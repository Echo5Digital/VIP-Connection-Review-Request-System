'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function HomeAuth() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function getRedirectPath(role) {
    return role === 'client' ? '/client/dashboard' : '/admin/dashboard';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/auth/login', { email: trimmedEmail, password });
      router.push(getRedirectPath(res?.user?.role));
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home-auth">
      <section className="home-auth__intro">
        <p className="home-auth__eyebrow">VIP Connection</p>
        <h1>Review Request System</h1>
        <p>A Controlled Feedback Platform to Increase Public Reviews, Capture Private Concerns, and Monitor Driver & Vehicle Performance</p>
        <div className="home-auth__credentials">
          <strong>Default Admin Login</strong>
          <span>Email: admin@gmail.com</span>
          <span>Password: admin123</span>
          {/* <strong style={{ marginTop: '8px' }}>Test Client Login</strong>
          <span>Email: testclient@gmail.com</span>
          <span>Password: test1234</span>     */}
        </div>
      </section>

      <section className="home-auth__panel card">
        <h2>Login</h2>

        <form className="home-auth__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Please wait...' : 'Login'}
          </button>
        </form>
      </section>
    </div>
  );
}
