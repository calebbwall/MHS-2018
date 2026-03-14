import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

/**
 * Class Map — shows classmates on a US map using react-leaflet.
 * Since we don't store lat/lng, we use a free geocoding lookup via
 * the Nominatim API (no API key required, rate-limited to 1 req/s).
 * Classmates without city/state are shown in a "Can't locate" list.
 */
export default function ClassMap() {
  const { token } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [MapComponents, setMapComponents] = useState(null);
  const [geocoded, setGeocoded] = useState([]);
  const [unlocated, setUnlocated] = useState([]);

  // Dynamically import react-leaflet to avoid SSR issues
  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl]) => {
      setMapComponents({
        MapContainer:  rl.MapContainer,
        TileLayer:     rl.TileLayer,
        Marker:        rl.Marker,
        Popup:         rl.Popup,
      });
      setMapReady(true);
    }).catch(console.error);
  }, []);

  // Load users
  useEffect(() => {
    apiFetch('/api/users', { token })
      .then(data => {
        setUsers(data);
        geocodeUsers(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function geocodeUsers(users) {
    const withLocation = users.filter(u => u.city && u.state);
    const without      = users.filter(u => !u.city || !u.state);
    setUnlocated(without);

    // Deduplicate city+state pairs to minimize API calls
    const unique = {};
    withLocation.forEach(u => {
      const key = `${u.city},${u.state}`;
      if (!unique[key]) unique[key] = [];
      unique[key].push(u);
    });

    const results = [];
    for (const [key, groupUsers] of Object.entries(unique)) {
      const [city, state] = key.split(',');
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=US&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data.length > 0) {
          results.push({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), users: groupUsers, city, state });
        } else {
          setUnlocated(prev => [...prev, ...groupUsers]);
        }
        // Nominatim rate limit: 1 req/s
        await new Promise(r => setTimeout(r, 1100));
      } catch {
        setUnlocated(prev => [...prev, ...groupUsers]);
      }
    }
    setGeocoded(results);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="page-title mb-2">Class Map</h1>
      <p className="text-gray-500 text-sm mb-6">
        See where the MHS Class of 2018 has landed.
        {geocoded.length > 0 && ` Showing ${users.filter(u=>u.city&&u.state).length} classmates with a known location.`}
      </p>

      {loading && <div className="text-gray-400 text-center py-10">Loading classmates…</div>}

      {!loading && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 card overflow-hidden" style={{ height: 500 }}>
            {!mapReady && (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Loading map…
              </div>
            )}
            {mapReady && MapComponents && (
              <MapComponents.MapContainer
                center={[38, -96]}
                zoom={4}
                style={{ width: '100%', height: '100%' }}
              >
                <MapComponents.TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                />
                {geocoded.map((loc, i) => (
                  <MapComponents.Marker key={i} position={[loc.lat, loc.lng]}>
                    <MapComponents.Popup>
                      <strong>{loc.city}, {loc.state}</strong>
                      <ul className="mt-1 space-y-1">
                        {loc.users.map(u => (
                          <li key={u.id}>
                            <a href={`/profile/${u.id}`} className="text-maroon-800 hover:underline text-sm">
                              {u.full_name}
                            </a>
                            {u.career && <span className="text-gray-500 text-xs"> · {u.career}</span>}
                          </li>
                        ))}
                      </ul>
                    </MapComponents.Popup>
                  </MapComponents.Marker>
                ))}
              </MapComponents.MapContainer>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Geocoding in progress notice */}
            {geocoded.length === 0 && !loading && (
              <div className="card p-4 text-sm text-gray-500">
                Geocoding classmate locations… this may take a moment.
              </div>
            )}

            {/* Classmates without location */}
            {unlocated.length > 0 && (
              <div className="card p-4">
                <h2 className="section-title text-sm mb-2 text-gray-500">
                  📍 No location listed ({unlocated.length})
                </h2>
                <ul className="space-y-1 max-h-60 overflow-y-auto">
                  {unlocated.map(u => (
                    <li key={u.id}>
                      <Link to={`/profile/${u.id}`} className="text-sm text-gray-600 hover:text-maroon-800">
                        {u.full_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card p-4 text-xs text-gray-400">
              Map data © <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> contributors.
              Locations are approximate city-level only.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
