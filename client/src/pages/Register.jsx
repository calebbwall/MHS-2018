import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

export default function Register() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]   = useState(1); // 1 = credentials, 2 = pick name
  const [form, setForm]   = useState({ email: '', password: '', confirm: '', roster_id: '' });
  const [roster, setRoster] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in
  if (user?.is_approved) return <Navigate to="/directory" replace />;
  if (user) return <Navigate to="/pending" replace />;

  // Load unclaimed roster when reaching step 2
  useEffect(() => {
    if (step === 2) {
      apiFetch('/api/users/roster/unclaimed')
        .then(setRoster)
        .catch(() => setError('Failed to load class roster. Please refresh.'));
    }
  }, [step]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  function handleStep1(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.roster_id) {
      setError('Please select your name from the roster');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: { email: form.email, password: form.password, roster_id: parseInt(form.roster_id) },
      });
      // Auto-login after register (user will be redirected to /pending by auth context)
      const loginData = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email: form.email, password: form.password },
      });
      login(loginData.token, loginData.user);
      navigate('/pending');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const filteredRoster = roster.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐾</div>
          <h1 className="text-2xl font-bold text-gray-900">Join the Hub</h1>
          <p className="text-gray-500 text-sm mt-1">MHS Class of 2018 Alumni Hub</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= n ? 'bg-maroon-800 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {n}
              </div>
              {n < 2 && <div className={`h-0.5 w-8 ${step > n ? 'bg-maroon-800' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="section-title mb-4">Create your account</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  required autoComplete="email" className="input" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  required className="input" placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
                  required className="input" placeholder="••••••••" />
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
              <button type="submit" className="btn-primary w-full py-2.5">Next →</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600">←</button>
                <h2 className="section-title">Find your name</h2>
              </div>
              <p className="text-sm text-gray-600">
                Select your name from the MHS Class of 2018 roster to claim your account.
              </p>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input"
                placeholder="Search your name…"
              />
              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {filteredRoster.length === 0 && (
                  <p className="text-sm text-gray-400 p-4 text-center">
                    {roster.length === 0 ? 'Loading…' : 'No matching names found'}
                  </p>
                )}
                {filteredRoster.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, roster_id: r.id })); setError(''); }}
                    className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-0 transition-colors ${
                      form.roster_id === r.id
                        ? 'bg-maroon-50 text-maroon-800 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {r.full_name}
                    {form.roster_id === r.id && ' ✓'}
                  </button>
                ))}
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
              <button type="submit" disabled={loading || !form.roster_id} className="btn-primary w-full py-2.5">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-maroon-800 font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
