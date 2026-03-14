import { Link } from 'react-router-dom';
import { Avatar } from './Navbar';

/**
 * Classmate card used in the directory grid.
 */
export default function ProfileCard({ user, currentUserId }) {
  return (
    <div className="card p-5 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow">
      <Avatar user={user} size={20} />

      <div>
        <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
        {user.nickname && (
          <p className="text-sm text-gray-500">"{user.nickname}"</p>
        )}
      </div>

      {(user.city || user.state) && (
        <p className="text-sm text-gray-500">
          📍 {[user.city, user.state].filter(Boolean).join(', ')}
        </p>
      )}

      {(user.career || user.company) && (
        <p className="text-sm text-gray-600">
          {user.career}
          {user.career && user.company && ' · '}
          {user.company}
        </p>
      )}

      <div className="flex gap-2 mt-auto pt-2 w-full">
        <Link
          to={`/profile/${user.id}`}
          className="btn-secondary flex-1 text-sm py-1.5 text-center"
        >
          View Profile
        </Link>
        {currentUserId !== user.id && (
          <Link
            to={`/messages/conversation/${user.id}`}
            className="btn-primary flex-1 text-sm py-1.5 text-center"
          >
            Message
          </Link>
        )}
      </div>
    </div>
  );
}
