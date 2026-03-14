import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/client';

export default function AdminAnnouncements() {
  const { token } = useAuth();
  const [form, setForm]   = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [msg, setMsg]     = useState('');
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setMsg('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!window.confirm(`Send this announcement to all approved members?`)) return;
    setSending(true);
    setMsg('');
    setError('');
    try {
      const data = await apiFetch('/api/admin/announcements', {
        token, method: 'POST', body: form,
      });
      setMsg(data.message);
      setForm({ subject: '', body: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
        <h1 className="page-title">Send Announcement</h1>
      </div>

      <div className="card p-6">
        <p className="text-sm text-gray-500 mb-6">
          This will send a BCC email to all approved classmates. Use sparingly — for reunion updates,
          important announcements, or reminders.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              required
              className="input"
              placeholder="MHS 2018 Reunion Update"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              name="body"
              value={form.body}
              onChange={handleChange}
              required
              rows={10}
              className="input resize-y font-mono text-sm"
              placeholder="Write your announcement here…"
            />
          </div>

          {/* Preview */}
          {form.body && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Preview</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{form.body}</p>
            </div>
          )}

          {msg   && <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">{msg}</p>}
          {error && <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">{error}</p>}

          <button type="submit" disabled={sending || !form.subject || !form.body} className="btn-primary">
            {sending ? 'Sending…' : '📢 Send to All Members'}
          </button>
        </form>
      </div>
    </div>
  );
}
