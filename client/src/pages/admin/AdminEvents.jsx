import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/client';

const EMPTY_FORM = {
  title: '', description: '', event_date: '', location: '',
  map_link: '', ticket_link: '', event_image: '',
};

export default function AdminEvents() {
  const { token } = useAuth();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  useEffect(() => { loadEvents(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function loadEvents() {
    apiFetch('/api/events', { token })
      .then(setEvents)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setMsg('');
  }

  function openEdit(event) {
    // Convert DB timestamp to datetime-local format
    const dt = new Date(event.event_date);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setForm({
      title:       event.title       || '',
      description: event.description || '',
      event_date:  local,
      location:    event.location    || '',
      map_link:    event.map_link    || '',
      ticket_link: event.ticket_link || '',
      event_image: event.event_image || '',
    });
    setEditingId(event.id);
    setShowForm(true);
    setMsg('');
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/events/${id}`, { token, method: 'DELETE' });
      setMsg('Event deleted.');
      loadEvents();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      if (editingId) {
        await apiFetch(`/api/events/${editingId}`, { token, method: 'PUT', body: form });
        setMsg('Event updated!');
      } else {
        await apiFetch('/api/events', { token, method: 'POST', body: form });
        setMsg('Event created!');
      }
      setShowForm(false);
      loadEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
          <h1 className="page-title">Manage Events</h1>
        </div>
        {!showForm && (
          <button onClick={openCreate} className="btn-primary text-sm">+ Create Event</button>
        )}
      </div>

      {msg   && <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm mb-4">{msg}</p>}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="section-title mb-4">{editingId ? 'Edit Event' : 'New Event'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required className="input" placeholder="10-Year Reunion" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                <input type="datetime-local" name="event_date" value={form.event_date} onChange={handleChange} required className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input name="location" value={form.location} onChange={handleChange} className="input" placeholder="Magnolia Event Center" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                <input name="map_link" value={form.map_link} onChange={handleChange} className="input" placeholder="https://maps.google.com/…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Link</label>
                <input name="ticket_link" value={form.ticket_link} onChange={handleChange} className="input" placeholder="https://eventbrite.com/…" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Image URL</label>
                <input name="event_image" value={form.event_image} onChange={handleChange} className="input" placeholder="https://…/image.jpg" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  rows={4} className="input resize-none" placeholder="Tell classmates about the event…" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Event'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Events list */}
      {loading && <p className="text-gray-400">Loading…</p>}
      {!loading && events.length === 0 && <p className="text-gray-400 text-center py-12">No events yet.</p>}
      <div className="space-y-3">
        {events.map(ev => (
          <div key={ev.id} className="card p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{ev.title}</h3>
              <p className="text-sm text-gray-500">
                {new Date(ev.event_date).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}
                {ev.location && ` · ${ev.location}`}
              </p>
              <div className="text-xs text-gray-400 mt-0.5">
                {ev.going_count || 0} going · {ev.maybe_count || 0} maybe
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(ev)} className="btn-secondary text-xs py-1">Edit</button>
              <button onClick={() => handleDelete(ev.id, ev.title)}
                className="text-xs border border-red-300 text-red-600 px-2 py-1 rounded hover:bg-red-50">
                Delete
              </button>
              <Link to={`/events/${ev.id}`} className="text-xs border border-gray-300 text-gray-600 px-2 py-1 rounded hover:bg-gray-50">
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
