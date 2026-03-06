'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function HomeAuth() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function getRedirectPath(role) {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'manager' || role === 'dispatcher') return '/staff/dashboard';
    return '/';
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
      <section className="home-auth__panel">
        <div className="home-auth__brand">
          <Image
            src="/images/vip-logo.png"
            alt="VIP Connection"
            width={72}
            height={72}
            className="home-auth__logo-img"
            priority
          />
          <div className="home-auth__brand-name">
            <em>VIP</em> CONNECTION
          </div>
        </div>

        <div className="home-auth__intro-block">
          <h1 className="home-auth__welcome">Welcome Back!</h1>
          <p className="home-auth__desc">
            A Controlled Feedback Platform to Increase Public Reviews, Capture Private Concerns, and Monitor Driver &amp; Vehicle Performance
          </p>
        </div>

        <div className="home-auth__divider" />

        <h2 className="home-auth__form-title">Login to your account</h2>

        <form className="home-auth__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn home-auth__btn" disabled={loading}>
            {loading ? 'Please wait...' : 'Login'}
          </button>
        </form>
      </section>
    </div>
  );
}
