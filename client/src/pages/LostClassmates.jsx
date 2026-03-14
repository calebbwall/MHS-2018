import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

export default function LostClassmates() {
  const { token } = useAuth();
  const [roster, setRoster]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  useEffect(() => {
    apiFetch('/api/users/roster/unclaimed', { token })
      .then(setRoster)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = roster.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  // Copy a shareable link to clipboard
  function copyInviteLink() {
    navigator.clipboard.writeText(window.location.origin + '/register')
      .then(() => alert('Invite link copied! Share it with your classmates.'))
      .catch(() => {});
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="page-title mb-2">Lost Classmates</h1>
      <p className="text-gray-500 text-sm mb-6">
        These classmates haven't registered yet. Know how to reach them? Share the link!
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="input flex-1"
        />
        <button onClick={copyInviteLink} className="btn-primary text-sm whitespace-nowrap">
          📋 Copy Invite Link
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          {search
            ? <p>No names matching "{search}"</p>
            : <p className="text-green-600 font-medium">🎉 All classmates have registered!</p>
          }
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <p className="text-sm text-gray-400 mb-3">{filtered.length} unregistered</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map(r => (
              <div key={r.id} className="card px-4 py-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-semibold flex-shrink-0">
                  {r.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">{r.full_name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
