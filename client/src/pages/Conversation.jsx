import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import MessageThread from '../components/MessageThread';
import { Avatar } from '../components/Navbar';

export default function Conversation() {
  const { userId }  = useParams();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner]   = useState(null);
  const [body, setBody]         = useState('');
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const pollRef = useRef(null);

  function fetchMessages() {
    apiFetch(`/api/messages/conversation/${userId}`, { token })
      .then(setMessages)
      .catch(err => setError(err.message));
  }

  useEffect(() => {
    // Load partner profile
    apiFetch(`/api/users/${userId}`, { token })
      .then(setPartner)
      .catch(() => {});

    // Load messages
    fetchMessages();
    setLoading(false);

    // Poll for new messages every 30 seconds
    pollRef.current = setInterval(fetchMessages, 30000);
    return () => clearInterval(pollRef.current);
  }, [userId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const msg = await apiFetch('/api/messages/send', {
        token,
        method: 'POST',
        body: { receiver_id: userId, body: body.trim() },
      });
      setMessages(prev => [...prev, { ...msg, sender_name: user.full_name }]);
      setBody('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/messages/inbox" className="text-gray-400 hover:text-gray-600 text-sm">← Inbox</Link>
        {partner && (
          <>
            <Avatar user={partner} size={9} />
            <div>
              <Link to={`/profile/${partner.id}`} className="font-semibold text-gray-900 hover:text-maroon-800">
                {partner.full_name}
              </Link>
              {(partner.city || partner.state) && (
                <p className="text-xs text-gray-400">{[partner.city, partner.state].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {/* Thread */}
      <div className="flex-1 card overflow-hidden flex flex-col min-h-0">
        {loading
          ? <div className="flex-1 flex items-center justify-center text-gray-400">Loading…</div>
          : <MessageThread messages={messages} currentUserId={user?.id} />
        }

        {/* Send form */}
        <form onSubmit={handleSend} className="border-t border-gray-100 p-3 flex gap-2">
          <input
            type="text"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Type a message…"
            className="input flex-1"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!body.trim() || sending}
            className="btn-primary px-5 py-2"
          >
            {sending ? '…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
