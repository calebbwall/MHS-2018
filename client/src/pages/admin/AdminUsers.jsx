import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/client';

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [filter, setFilter]   = useState('pending'); // 'pending' | 'approved' | 'all'

  useEffect(() => {
    loadUsers();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function loadUsers() {
    setLoading(true);
    apiFetch('/api/admin/users', { token })
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleApprove(id, name) {
    if (!window.confirm(`Approve ${name}?`)) return;
    try {
      await apiFetch(`/api/admin/users/${id}/approve`, { token, method: 'PATCH' });
      setActionMsg(`${name} approved.`);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReject(id, name) {
    if (!window.confirm(`Reject and delete ${name}'s account? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/users/${id}/reject`, { token, method: 'PATCH' });
      setActionMsg(`${name}'s account removed.`);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = users.filter(u => {
    if (filter === 'pending')  return !u.is_approved;
    if (filter === 'approved') return  u.is_approved;
    return true;
  });

  const pendingCount = users.filter(u => !u.is_approved).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
        <h1 className="page-title">Manage Users</h1>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[['pending','Pending'],['approved','Approved'],['all','All']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === val
                ? 'border-maroon-800 text-maroon-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {val === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-600 text-xs rounded-full px-1.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {actionMsg && (
        <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm mb-4">
          {actionMsg}
        </p>
      )}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading && <p className="text-gray-400">Loading…</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-gray-400 text-center py-12">
          {filter === 'pending' ? 'No pending accounts.' : 'No users found.'}
        </p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Location</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{u.full_name}</div>
                    {u.nickname && <div className="text-gray-400 text-xs">"{u.nickname}"</div>}
                    {u.is_admin && <span className="text-xs text-maroon-700 font-medium">Admin</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {[u.city, u.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {u.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {!u.is_approved && (
                        <>
                          <button onClick={() => handleApprove(u.id, u.full_name)}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                            Approve
                          </button>
                          <button onClick={() => handleReject(u.id, u.full_name)}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                            Reject
                          </button>
                        </>
                      )}
                      <Link to={`/profile/${u.id}`}
                        className="text-xs border border-gray-300 text-gray-600 px-2 py-1 rounded hover:bg-gray-50">
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
