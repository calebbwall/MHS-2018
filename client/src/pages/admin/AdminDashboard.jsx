import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/client';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin/stats', { token })
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const sections = [
    {
      to: '/admin/users',
      icon: '👥',
      title: 'Manage Users',
      desc: 'Approve or reject new accounts, edit profiles.',
      badge: stats?.pending_approval || 0,
      badgeLabel: 'pending',
    },
    {
      to: '/admin/events',
      icon: '🎉',
      title: 'Manage Events',
      desc: 'Create, edit, or delete reunion events.',
    },
    {
      to: '/admin/announcements',
      icon: '📢',
      title: 'Announcements',
      desc: 'Send a class-wide email to all approved members.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">🔧</span>
        <h1 className="page-title">Admin Dashboard</h1>
      </div>
      <p className="text-gray-500 text-sm mb-8">Manage the MHS Class of 2018 Alumni Hub</p>

      {/* Stat cards */}
      {!loading && stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard value={stats.total_approved}  label="Approved Members" color="maroon" />
          <StatCard value={stats.pending_approval} label="Pending Approval" color={stats.pending_approval > 0 ? 'red' : 'green'} />
          <StatCard value={stats.upcoming_events}  label="Upcoming Events"  color="blue" />
        </div>
      )}

      {/* Section cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {sections.map(s => (
          <Link key={s.to} to={s.to} className="card p-6 hover:shadow-md transition-shadow group">
            <div className="text-3xl mb-3">{s.icon}</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-maroon-800 flex items-center gap-2">
              {s.title}
              {s.badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {s.badge} {s.badgeLabel}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>

      {/* Export CSV */}
      <div className="mt-8 card p-6 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Export Contact Data</h2>
          <p className="text-sm text-gray-500">Download a CSV of all approved members.</p>
        </div>
        <a
          href="/api/admin/users/export"
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => {
            // Manually attach auth header isn't possible with anchor — use fetch+blob instead
            e.preventDefault();
            fetch('/api/admin/users/export', { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.blob())
              .then(blob => {
                const url = URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href    = url;
                a.download = 'mhs2018-classmates.csv';
                a.click();
                URL.revokeObjectURL(url);
              })
              .catch(console.error);
          }}
          className="btn-secondary text-sm"
        >
          ⬇️ Download CSV
        </a>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }) {
  const colors = {
    maroon: 'bg-maroon-800 text-white',
    red:    'bg-red-500 text-white',
    green:  'bg-green-600 text-white',
    blue:   'bg-blue-600 text-white',
  };
  return (
    <div className={`rounded-xl p-5 text-center ${colors[color] || colors.maroon}`}>
      <div className="text-3xl font-bold">{value ?? '—'}</div>
      <div className="text-sm mt-1 opacity-90">{label}</div>
    </div>
  );
}
