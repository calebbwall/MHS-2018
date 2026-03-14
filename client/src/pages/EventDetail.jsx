import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import RsvpButtons from '../components/RsvpButtons';
import { Avatar } from '../components/Navbar';

export default function EventDetail() {
  const { id }   = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    apiFetch(`/api/events/${id}`, { token })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  function handleRsvpChange(_, newStatus, counts) {
    setData(prev => ({
      ...prev,
      event: {
        ...prev.event,
        my_rsvp_status:      newStatus,
        going_count:         counts.going_count,
        maybe_count:         counts.maybe_count,
        not_attending_count: counts.not_attending_count,
      },
    }));
  }

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Loading…</div>;
  if (error)   return <div className="flex justify-center py-20 text-red-500">{error}</div>;
  if (!data)   return null;

  const { event, attendees } = data;
  const date = new Date(event.event_date);
  const going       = attendees.filter(a => a.status === 'going');
  const maybe       = attendees.filter(a => a.status === 'maybe');
  const notAttending = attendees.filter(a => a.status === 'not_attending');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">
        ← Back to Events
      </button>

      {/* Event image */}
      {event.event_image && (
        <img src={event.event_image} alt={event.title}
          className="w-full h-64 object-cover rounded-xl mb-6"
          onError={e => e.target.style.display='none'} />
      )}
      {!event.event_image && (
        <div className="w-full h-40 bg-maroon-800 rounded-xl mb-6 flex items-center justify-center">
          <span className="text-white text-5xl">🐾</span>
        </div>
      )}

      {/* Event details */}
      <div className="card p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>
        <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
          <InfoItem icon="📅" label="Date" value={date.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} />
          <InfoItem icon="🕐" label="Time" value={date.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })} />
          {event.location && <InfoItem icon="📍" label="Location" value={event.location} />}
          {event.map_link && (
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">🗺️</span>
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide block">Map</span>
                <a href={event.map_link} target="_blank" rel="noopener noreferrer" className="text-maroon-800 hover:underline">
                  View on Google Maps ↗
                </a>
              </div>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap mb-6">
            {event.description}
          </p>
        )}

        {event.ticket_link && (
          <a
            href={event.ticket_link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block mb-4"
          >
            🎟️ Get Tickets
          </a>
        )}

        {/* RSVP */}
        <div className="border-t border-gray-100 pt-4">
          <h2 className="section-title mb-3">Your RSVP</h2>
          <RsvpButtons eventId={event.id} currentStatus={event.my_rsvp_status} onRsvpChange={handleRsvpChange} />
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span><span className="font-semibold text-green-600">{event.going_count || 0}</span> Going</span>
            <span><span className="font-semibold text-yellow-600">{event.maybe_count || 0}</span> Maybe</span>
            <span><span className="font-semibold text-gray-400">{event.not_attending_count || 0}</span> Not Attending</span>
          </div>
        </div>
      </div>

      {/* Attendee list */}
      {attendees.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">Who's Coming</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <AttendeeGroup title="✅ Going" people={going} color="green" />
            <AttendeeGroup title="🤔 Maybe" people={maybe} color="yellow" />
            <AttendeeGroup title="❌ Not Attending" people={notAttending} color="gray" />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-base mt-0.5">{icon}</span>
      <div>
        <span className="text-xs text-gray-400 uppercase tracking-wide block">{label}</span>
        <span className="text-sm text-gray-700">{value}</span>
      </div>
    </div>
  );
}

function AttendeeGroup({ title, people, color }) {
  const colors = { green: 'text-green-700', yellow: 'text-yellow-700', gray: 'text-gray-500' };
  return (
    <div>
      <h3 className={`text-sm font-semibold mb-2 ${colors[color]}`}>{title} ({people.length})</h3>
      {people.length === 0 && <p className="text-xs text-gray-400">No one yet</p>}
      <ul className="space-y-2">
        {people.map(p => (
          <li key={p.id}>
            <Link to={`/profile/${p.id}`} className="flex items-center gap-2 hover:text-maroon-800">
              <Avatar user={p} size={6} />
              <span className="text-sm text-gray-700 hover:text-maroon-800">{p.full_name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
