import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import ProfileCard from '../components/ProfileCard';

// US states for filter dropdown
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

export default function Directory() {
  const { user, token } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [stateFilter, setStateFilter]   = useState('');
  const [careerFilter, setCareerFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input by 300ms
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const fetchUsers = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (stateFilter)     params.set('state', stateFilter);
    if (careerFilter)    params.set('career', careerFilter);

    setLoading(true);
    apiFetch(`/api/users?${params}`, { token })
      .then(data => { setUsers(data); setError(''); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, debouncedSearch, stateFilter, careerFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function clearFilters() {
    setSearch('');
    setStateFilter('');
    setCareerFilter('');
  }

  const hasFilters = search || stateFilter || careerFilter;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Class Directory</h1>
          <p className="text-gray-500 text-sm mt-1">
            {users.length} classmate{users.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/lost" className="btn-ghost text-sm">Lost Classmates</Link>
          <Link to="/map"  className="btn-secondary text-sm">🗺️ Class Map</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="input flex-1"
          />
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="input sm:w-36"
          >
            <option value="">All States</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="text"
            value={careerFilter}
            onChange={e => setCareerFilter(e.target.value)}
            placeholder="Career / field…"
            className="input sm:w-48"
          />
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-sm whitespace-nowrap">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {error && <p className="text-red-600 text-center py-8">{error}</p>}

      {loading && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-5 h-52 animate-pulse bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && users.length === 0 && !error && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>No classmates found matching your search.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-maroon-800 hover:underline text-sm">
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users.map(u => (
            <ProfileCard key={u.id} user={u} currentUserId={user?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
