import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [unreadCount, setUnread]  = useState(0);

  // Poll for unread message count every 60 seconds
  useEffect(() => {
    if (!user?.is_approved) return;
    const fetchUnread = () => {
      apiFetch('/api/messages/unread-count', { token })
        .then(data => setUnread(data.count))
        .catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 60000);
    return () => clearInterval(id);
  }, [user, token]);

  function handleLogout() {
    logout();
    navigate('/');
    setMenuOpen(false);
  }

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-white underline underline-offset-4' : 'text-maroon-100 hover:text-white'
    }`;

  return (
    <nav className="bg-maroon-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="text-2xl">🐾</span>
            <span className="hidden sm:inline">MHS Class of '18</span>
            <span className="sm:hidden">MHS '18</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {!user && (
              <>
                <NavLink to="/login"    className={navLinkClass}>Log In</NavLink>
                <NavLink to="/register" className="btn-primary text-sm py-1.5 px-4">Join the Hub</NavLink>
              </>
            )}

            {user && !user.is_approved && (
              <>
                <span className="text-maroon-200 text-sm">Account pending approval</span>
                <button onClick={handleLogout} className="btn-ghost text-maroon-100 text-sm">Log Out</button>
              </>
            )}

            {user?.is_approved && (
              <>
                <NavLink to="/directory"       className={navLinkClass}>Directory</NavLink>
                <NavLink to="/events"          className={navLinkClass}>Events</NavLink>
                <NavLink to="/messages/inbox"  className={`${navLinkClass({ isActive: false })} relative`}>
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </NavLink>
                <NavLink to="/map"             className={navLinkClass}>Map</NavLink>
                {user.is_admin && (
                  <NavLink to="/admin"         className={navLinkClass}>Admin</NavLink>
                )}
                <div className="relative group">
                  <button className="flex items-center gap-2 text-maroon-100 hover:text-white text-sm font-medium transition-colors">
                    <Avatar user={user} size={7} />
                    <span>{user.full_name.split(' ')[0]}</span>
                    <span className="text-xs">▾</span>
                  </button>
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover:block z-50">
                    <Link to={`/profile/${user.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      View Profile
                    </Link>
                    <Link to="/profile/edit" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Edit Profile
                    </Link>
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Log Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-maroon-900 px-4 py-3 space-y-2">
          {!user && (
            <>
              <NavLink to="/login"    onClick={() => setMenuOpen(false)} className="block text-maroon-100 py-2">Log In</NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)} className="block text-white font-medium py-2">Join the Hub</NavLink>
            </>
          )}
          {user && !user.is_approved && (
            <p className="text-maroon-200 text-sm py-2">Account pending approval</p>
          )}
          {user?.is_approved && (
            <>
              <NavLink to="/directory"      onClick={() => setMenuOpen(false)} className="block text-maroon-100 py-2">Directory</NavLink>
              <NavLink to="/events"         onClick={() => setMenuOpen(false)} className="block text-maroon-100 py-2">Events</NavLink>
              <NavLink to="/messages/inbox" onClick={() => setMenuOpen(false)} className="block text-maroon-100 py-2">
                Messages {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{unreadCount}</span>}
              </NavLink>
              <NavLink to="/map"            onClick={() => setMenuOpen(false)} className="block text-maroon-100 py-2">Class Map</NavLink>
              <NavLink to={`/profile/${user.id}`} onClick={() => setMenuOpen(false)} className="block text-maroon-100 py-2">My Profile</NavLink>
              <NavLink to="/profile/edit"   onClick={() => setMenuOpen(false)} className="block text-maroon-100 py-2">Edit Profile</NavLink>
              {user.is_admin && (
                <NavLink to="/admin"        onClick={() => setMenuOpen(false)} className="block text-maroon-100 py-2">Admin</NavLink>
              )}
            </>
          )}
          {user && (
            <button onClick={handleLogout} className="block text-maroon-200 py-2 text-left w-full">Log Out</button>
          )}
        </div>
      )}
    </nav>
  );
}

/** Reusable avatar — shows profile photo or initials */
export function Avatar({ user, size = 10 }) {
  if (user?.profile_photo) {
    return (
      <img
        src={user.profile_photo}
        alt={user.full_name}
        className={`w-${size} h-${size} rounded-full object-cover`}
        onError={e => { e.target.style.display = 'none'; }}
      />
    );
  }
  const initials = (user?.full_name || '?')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className={`w-${size} h-${size} rounded-full bg-maroon-700 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}
