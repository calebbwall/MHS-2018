import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

export default function EditProfile() {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState(null);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const sl = user.social_links || {};
      setForm({
        nickname: user.nickname || '',
        phone:    user.phone    || '',
        city:     user.city     || '',
        state:    user.state    || '',
        career:   user.career   || '',
        company:  user.company  || '',
        bio:      user.bio      || '',
        profile_photo: user.profile_photo || '',
        instagram: sl.instagram || '',
        linkedin:  sl.linkedin  || '',
        facebook:  sl.facebook  || '',
        twitter:   sl.twitter   || '',
        website:   sl.website   || '',
      });
    }
  }, [user]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const social_links = {
        instagram: form.instagram,
        linkedin:  form.linkedin,
        facebook:  form.facebook,
        twitter:   form.twitter,
        website:   form.website,
      };
      await apiFetch(`/api/users/${user.id}`, {
        token,
        method: 'PUT',
        body: {
          nickname: form.nickname,
          phone:    form.phone,
          city:     form.city,
          state:    form.state,
          career:   form.career,
          company:  form.company,
          bio:      form.bio,
          profile_photo: form.profile_photo,
          social_links,
        },
      });
      await refreshUser();
      setSuccess('Profile updated!');
      setTimeout(() => navigate(`/profile/${user.id}`), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!form) return <div className="flex justify-center py-20 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">
        ← Back
      </button>

      <h1 className="page-title mb-2">Edit Profile</h1>
      <p className="text-gray-500 text-sm mb-6">Updating as <strong>{user?.full_name}</strong></p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Basic Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nickname" name="nickname" value={form.nickname} onChange={handleChange} placeholder='e.g. "Bear"' />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" type="tel" />
            <Field label="City" name="city" value={form.city} onChange={handleChange} placeholder="Houston" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select name="state" value={form.state} onChange={handleChange} className="input">
                <option value="">-- Select state --</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Field label="Career / Job Title" name="career" value={form.career} onChange={handleChange} placeholder="Software Engineer" />
            <Field label="Company" name="company" value={form.company} onChange={handleChange} placeholder="Acme Corp" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              className="input resize-none"
              placeholder="Tell your classmates what you've been up to…"
            />
          </div>
        </div>

        {/* Profile Photo */}
        <div className="card p-6">
          <h2 className="section-title mb-1">Profile Photo</h2>
          <p className="text-xs text-gray-500 mb-3">Paste a URL to your photo (e.g. from Google Photos, LinkedIn, etc.)</p>
          <Field label="Photo URL" name="profile_photo" value={form.profile_photo} onChange={handleChange} placeholder="https://…" type="url" />
          {form.profile_photo && (
            <img src={form.profile_photo} alt="Preview" className="mt-3 w-20 h-20 rounded-full object-cover border"
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </div>

        {/* Social Links */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Social Links</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Instagram" name="instagram" value={form.instagram} onChange={handleChange} placeholder="@username" />
            <Field label="LinkedIn"  name="linkedin"  value={form.linkedin}  onChange={handleChange} placeholder="linkedin.com/in/username" />
            <Field label="Facebook"  name="facebook"  value={form.facebook}  onChange={handleChange} placeholder="facebook.com/username" />
            <Field label="Twitter / X" name="twitter" value={form.twitter}   onChange={handleChange} placeholder="@username" />
            <Field label="Website"   name="website"   value={form.website}   onChange={handleChange} placeholder="https://yoursite.com" type="url" />
          </div>
        </div>

        {error   && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
        {success && <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3">{success}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary px-8">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange}
        className="input" placeholder={placeholder} />
    </div>
  );
}
