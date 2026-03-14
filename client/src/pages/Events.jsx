import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import EventCard from '../components/EventCard';

export default function Events() {
  const { token } = useAuth();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    apiFetch('/api/events', { token })
      .then(setEvents)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  function handleRsvpChange(eventId, newStatus, counts) {
    setEvents(prev =>
      prev.map(ev =>
        ev.id === parseInt(eventId)
          ? {
              ...ev,
              my_rsvp_status:      newStatus,
              going_count:         counts.going_count,
              maybe_count:         counts.maybe_count,
              not_attending_count: counts.not_attending_count,
            }
          : ev
      )
    );
  }

  const upcoming = events.filter(e => new Date(e.event_date) >= new Date());
  const past     = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="page-title mb-2">Reunion Hub</h1>
      <p className="text-gray-500 text-sm mb-8">RSVP for events and see which classmates are coming.</p>

      {error && <p className="text-red-500 mb-6">{error}</p>}

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-72 animate-pulse bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && events.length === 0 && !error && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-lg">No events scheduled yet.</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mb-12">
          <h2 className="section-title mb-4">Upcoming Events</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map(ev => (
              <EventCard key={ev.id} event={ev} onRsvpChange={handleRsvpChange} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="section-title mb-4 text-gray-500">Past Events</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
            {past.map(ev => (
              <EventCard key={ev.id} event={ev} onRsvpChange={handleRsvpChange} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
