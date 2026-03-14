import { Link } from 'react-router-dom';
import RsvpButtons from './RsvpButtons';

/**
 * Event card used in the events list.
 */
export default function EventCard({ event, onRsvpChange }) {
  const date = new Date(event.event_date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow">
      {event.event_image && (
        <img
          src={event.event_image}
          alt={event.title}
          className="w-full h-40 object-cover"
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}
      {!event.event_image && (
        <div className="w-full h-40 bg-maroon-800 flex items-center justify-center">
          <span className="text-white text-4xl">🐾</span>
        </div>
      )}

      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 mb-1">{event.title}</h3>
        <p className="text-sm text-gray-500 mb-1">📅 {formattedDate}</p>
        <p className="text-sm text-gray-500 mb-1">🕐 {formattedTime}</p>
        {event.location && (
          <p className="text-sm text-gray-500 mb-3">📍 {event.location}</p>
        )}

        {/* RSVP counters */}
        <div className="flex gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <span className="text-green-600 font-semibold">{event.going_count || 0}</span> Going
          </span>
          <span className="flex items-center gap-1">
            <span className="text-yellow-600 font-semibold">{event.maybe_count || 0}</span> Maybe
          </span>
          <span className="flex items-center gap-1">
            <span className="text-gray-400 font-semibold">{event.not_attending_count || 0}</span> Not Attending
          </span>
        </div>

        <RsvpButtons
          eventId={event.id}
          currentStatus={event.my_rsvp_status}
          onRsvpChange={onRsvpChange}
        />

        <Link
          to={`/events/${event.id}`}
          className="block text-center text-maroon-800 text-sm font-medium mt-3 hover:underline"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
