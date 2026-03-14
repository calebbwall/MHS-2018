import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { Avatar } from '../components/Navbar';

export default function Messages() {
  const { token } = useAuth();
  const [inbox, setInbox]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    apiFetch('/api/messages/inbox', { token })
      .then(setInbox)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Loading…</div>;
  if (error)   return <div className="flex justify-center py-20 text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Messages</h1>
        <Link to="/directory" className="btn-secondary text-sm">+ New Message</Link>
      </div>

      {inbox.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">💬</div>
          <p>Your inbox is empty.</p>
          <p className="text-sm mt-1">
            <Link to="/directory" className="text-maroon-800 hover:underline">Browse the directory</Link>
            {' '}to start a conversation.
          </p>
        </div>
      )}

      <div className="card divide-y divide-gray-100">
        {inbox.map(conv => (
          <Link
            key={conv.id}
            to={`/messages/conversation/${conv.id}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <Avatar user={conv} size={12} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <span className={`font-medium text-gray-900 ${conv.unread_count > 0 ? 'font-semibold' : ''}`}>
                  {conv.full_name}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {new Date(conv.last_message_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                {conv.unread_count > 0 && (
                  <span className="flex-shrink-0 bg-maroon-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
