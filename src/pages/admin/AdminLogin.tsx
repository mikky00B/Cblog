import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { authApi, setAdminToken } from '../../lib/api';

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(email, password);
      setAdminToken(response.access_token);
      navigate((location.state as { from?: string } | null)?.from ?? '/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md flex items-center justify-center px-margin-mobile">
      <form onSubmit={handleSubmit} className="w-full max-w-[420px] border border-outline-variant bg-surface-container-lowest rounded-sm p-stack-lg">
        <div className="flex items-center gap-2 mb-stack-md">
          <Lock className="w-5 h-5 text-primary" />
          <h1 className="font-headline-sm text-primary">Admin Login</h1>
        </div>
        {error && <p className="font-body-md text-secondary mb-stack-md">API error: {error}</p>}
        <label className="block mb-stack-md">
          <span className="font-label-caps text-secondary block mb-2">Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="AdminInput" required />
        </label>
        <label className="block mb-stack-md">
          <span className="font-label-caps text-secondary block mb-2">Password</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="AdminInput" required />
        </label>
        <button disabled={loading} className="w-full bg-primary text-on-primary px-4 py-3 font-label-caps rounded-sm disabled:opacity-50">
          {loading ? 'Signing in' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
