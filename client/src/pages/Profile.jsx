import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { Avatar } from '../components/Navbar';

export default function Profile() {
  const { id }  = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    apiFetch(`/api/users/${id}`, { token })
      .then(setProfile)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Loading…</div>;
  if (error)   return <div className="flex justify-center py-20 text-red-500">{error}</div>;
  if (!profile) return null;

  const social = profile.social_links || {};

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">
        ← Back
      </button>

      <div className="card overflow-hidden">
        {/* Header banner */}
        <div className="bg-maroon-800 h-24" />

        {/* Avatar + basic info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-white flex-shrink-0">
              {profile.profile_photo
                ? <img src={profile.profile_photo} alt={profile.full_name} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                : <Avatar user={profile} size={24} />
              }
            </div>
            <div className="flex-1 min-w-0 sm:pb-2">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{profile.full_name}</h1>
              {profile.nickname && (
                <p className="text-gray-500 text-sm">"{profile.nickname}"</p>
              )}
            </div>
            {isOwnProfile && (
              <Link to="/profile/edit" className="btn-secondary text-sm py-1.5 self-start sm:self-end">
                Edit Profile
              </Link>
            )}
            {!isOwnProfile && (
              <Link to={`/messages/conversation/${profile.id}`} className="btn-primary text-sm py-1.5 self-start sm:self-end">
                💬 Message
              </Link>
            )}
          </div>

          {/* Details grid */}
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mb-6">
            {profile.city || profile.state ? (
              <InfoRow icon="📍" label="Location" value={[profile.city, profile.state].filter(Boolean).join(', ')} />
            ) : null}
            {profile.career ? (
              <InfoRow icon="💼" label="Career" value={`${profile.career}${profile.company ? ` at ${profile.company}` : ''}`} />
            ) : null}
            {profile.email ? (
              <InfoRow icon="✉️" label="Email" value={<a href={`mailto:${profile.email}`} className="text-maroon-800 hover:underline">{profile.email}</a>} />
            ) : null}
            {profile.phone ? (
              <InfoRow icon="📞" label="Phone" value={profile.phone} />
            ) : null}
            <InfoRow icon="🎓" label="Graduation" value={`Class of ${profile.graduation_year}`} />
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <h2 className="section-title mb-2">About</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Social links */}
          {Object.values(social).some(Boolean) && (
            <div>
              <h2 className="section-title mb-3">Connect</h2>
              <div className="flex flex-wrap gap-2">
                {social.instagram && <SocialLink href={`https://instagram.com/${social.instagram.replace('@','')}`} label="Instagram" />}
                {social.linkedin  && <SocialLink href={social.linkedin.startsWith('http') ? social.linkedin : `https://linkedin.com/in/${social.linkedin}`} label="LinkedIn" />}
                {social.facebook  && <SocialLink href={social.facebook.startsWith('http') ? social.facebook : `https://facebook.com/${social.facebook}`} label="Facebook" />}
                {social.twitter   && <SocialLink href={`https://twitter.com/${social.twitter.replace('@','')}`} label="Twitter / X" />}
                {social.website   && <SocialLink href={social.website} label="Website" />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
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

function SocialLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-secondary text-xs py-1 px-3"
    >
      {label} ↗
    </a>
  );
}
