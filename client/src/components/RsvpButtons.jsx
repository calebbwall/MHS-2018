import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

const OPTIONS = [
  { value: 'going',        label: '✅ Going',        active: 'bg-green-600 text-white border-green-600' },
  { value: 'maybe',        label: '🤔 Maybe',        active: 'bg-yellow-500 text-white border-yellow-500' },
  { value: 'not_attending', label: '❌ Not Attending', active: 'bg-gray-400 text-white border-gray-400' },
];

export default function RsvpButtons({ eventId, currentStatus, onRsvpChange }) {
  const { token } = useAuth();
  const [status, setStatus]   = useState(currentStatus || null);
  const [loading, setLoading] = useState(false);

  async function handleClick(newStatus) {
    if (loading) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/rsvps/${eventId}`, {
        token,
        method: 'POST',
        body: { status: newStatus },
      });
      setStatus(newStatus);
      if (onRsvpChange) onRsvpChange(eventId, newStatus, data.counts);
    } catch (err) {
      console.error('RSVP failed:', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => handleClick(opt.value)}
          disabled={loading}
          className={`text-xs border rounded-full px-3 py-1 font-medium transition-colors ${
            status === opt.value
              ? opt.active
              : 'border-gray-300 text-gray-600 hover:border-maroon-600 hover:text-maroon-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
