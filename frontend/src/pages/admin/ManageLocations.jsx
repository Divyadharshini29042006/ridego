const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import { MapPin, Edit2, Trash2, Download, Search } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import 'react-confirm-alert/src/react-confirm-alert.css';
import styles from '../../styles/ManageLocations.module.css';

// Leaflet imports
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to update map center dynamically
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Marker component with event handlers for drag/click
function LocationMarker({ lat, lng, radius, onChange }) {
  const markerRef = useRef(null);
  
  // Handle click on map to move marker
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  // Handle marker dragend
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onChange(latLng.lat, latLng.lng);
        }
      },
    }),
    [onChange]
  );

  return (
    <>
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={[lat, lng]}
        ref={markerRef}
      />
      <Circle
        center={[lat, lng]}
        radius={radius * 111320} // roughly convert degrees to meters (1 degree lat ≈ 111.32km)
        pathOptions={{ color: '#e74c3c', fillColor: '#e74c3c', fillOpacity: 0.15 }}
      />
    </>
  );
}

function ManageLocations() {
  const [form, setForm] = useState({ 
    name: '', 
    city: '', 
    state: '', 
    managerId: '', 
    lat: 13.0827, 
    lng: 80.2707, 
    radius: 0.02 
  });
  const [locations, setLocations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchCity, setSearchCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 5;

  const userRole = localStorage.getItem('role') || '';

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/locations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const locationsWithManager = res.data.map(loc => ({
        ...loc,
        managerId: loc.managerId || null
      }));
      setLocations(locationsWithManager);
    } catch (err) {
      toast.error('Error fetching locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/users?role=manager`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setManagers(res.data);
    } catch (err) {
      toast.error('Error fetching managers');
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchManagers();
  }, []);

  useEffect(() => {
    if (editingId) {
      setTimeout(() => {
        const formEl = document.querySelector('form');
        if (formEl) {
          formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [editingId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarkerMove = (newLat, newLng) => {
    setForm(prev => ({
      ...prev,
      lat: parseFloat(newLat.toFixed(6)),
      lng: parseFloat(newLng.toFixed(6))
    }));
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(searchQuery)}`);
      if (res.data && res.data.length > 0) {
        const first = res.data[0];
        const newLat = parseFloat(first.lat);
        const newLng = parseFloat(first.lon);
        
        const addr = first.address || {};
        const detectedCity = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
        const detectedState = addr.state || '';
        
        setForm(prev => ({
          ...prev,
          lat: newLat,
          lng: newLng,
          name: prev.name || first.display_name.split(',')[0],
          city: prev.city || detectedCity,
          state: prev.state || detectedState
        }));
        toast.success(`Location found: ${first.display_name.split(',')[0]}`);
      } else {
        toast.error('Location not found');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      toast.error('Error searching for location');
    }
  };

  const resetForm = () => {
    setForm({ name: '', city: '', state: '', managerId: '', lat: 13.0827, lng: 80.2707, radius: 0.02 });
    setEditingId(null);
    setSearchQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`${backendUrl}/api/locations/${editingId}`, form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        toast.success('Location updated');
      } else {
        await axios.post(`${backendUrl}/api/locations/create`, form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        toast.success('Location created');
      }
      resetForm();
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving location');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (loc) => {
    setForm({
      name: loc.name || '',
      city: loc.city || '',
      state: loc.state || '',
      managerId: loc.managerId?._id || '',
      lat: loc.lat !== undefined ? loc.lat : 13.0827,
      lng: loc.lng !== undefined ? loc.lng : 80.2707,
      radius: loc.radius !== undefined ? loc.radius : 0.02
    });
    setEditingId(loc._id);
  };

  const handleDelete = (id) => {
    confirmAlert({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this location?',
      buttons: [
        {
          label: 'Yes',
          onClick: () => deleteLocation(id)
        },
        {
          label: 'No'
        }
      ]
    });
  };

  const deleteLocation = async (id) => {
    try {
      await axios.delete(`${backendUrl}/api/locations/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.info('Location deleted');
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting location');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'City', 'State', 'Manager', 'Latitude', 'Longitude', 'Radius'];
    const rows = locations.map(loc => [
      loc.name,
      loc.city,
      loc.state || '',
      loc.managerId?.name || '',
      loc.lat !== undefined ? loc.lat : '',
      loc.lng !== undefined ? loc.lng : '',
      loc.radius !== undefined ? loc.radius : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'locations.csv';
    link.click();
  };

  const filteredLocations = locations
    .filter((loc) => loc.city.toLowerCase().includes(searchCity.toLowerCase()))
    .sort((a, b) => a.city.localeCompare(b.city));
  const paginatedLocations = filteredLocations.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={styles.container}>
      <ToastContainer />
      <h2>
        <MapPin />
        {editingId ? 'Edit Location' : 'Create Location'}
      </h2>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Location Name" value={form.name} onChange={handleChange} required />
        <input name="city" placeholder="City" value={form.city} onChange={handleChange} required />
        <input name="state" placeholder="State" value={form.state} onChange={handleChange} />
        <select name="managerId" value={form.managerId} onChange={handleChange}>
          <option value="">Select Manager (optional)</option>
          {managers.map((manager) => (
            <option key={manager._id} value={manager._id}>
              {manager.name} ({manager.email})
            </option>
          ))}
        </select>

        {/* Map Coordinates & Search */}
        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #eee', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: '#2c2c2c', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} /> Map Coordinates & Coverage
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '0.5rem', display: 'block' }}>Latitude</label>
              <input type="number" step="any" name="lat" value={form.lat} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '0.5rem', display: 'block' }}>Longitude</label>
              <input type="number" step="any" name="lng" value={form.lng} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '0.5rem', display: 'block' }}>Radius (Degrees)</label>
              <input type="number" step="any" name="radius" value={form.radius} onChange={handleChange} required />
            </div>
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              placeholder="Search address/city on map to auto-fill (e.g., White Town, Puducherry)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchLocation(); } }}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={handleSearchLocation} style={{ background: '#3a3a3a', color: 'white', padding: '0 1.5rem', textTransform: 'none', letterSpacing: '0', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '100%', borderRadius: '12px' }}>
              <Search size={16} /> Search
            </button>
          </div>

          {/* Interactive Map */}
          <div style={{ height: '350px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '2px solid #e5e5e5', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)', position: 'relative', zIndex: 0 }}>
            <MapContainer center={[form.lat, form.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapController center={[form.lat, form.lng]} />
              <LocationMarker lat={form.lat} lng={form.lng} radius={form.radius} onChange={handleMarkerMove} />
            </MapContainer>
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 1000, color: '#333' }}>
              ℹ️ Click on map or drag the pin to adjust coordinates
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" style={{ flex: 1 }}>{editingId ? 'Update Location' : 'Create Location'}</button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ flex: 1 }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3>
        <MapPin />
        Existing Locations
      </h3>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Search by city"
        value={searchCity}
        onChange={(e) => {
          setSearchCity(e.target.value);
          setPage(1);
        }}
      />

      {userRole === 'admin' && (
        <button className={styles.exportBtn} onClick={exportToCSV}>
          <Download />
          Export to CSV
        </button>
      )}

      {loading ? (
        <div className={styles.spinner}>Loading...</div>
      ) : !paginatedLocations.length ? (
        <div className={styles.emptyState}>No locations found for "{searchCity}"</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>State</th>
              <th>Manager</th>
              <th>Map Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLocations.map((loc) => (
              <tr key={loc._id}>
                <td data-label="Name">{loc.name}</td>
                <td data-label="City">{loc.city}</td>
                <td data-label="State">{loc.state || '—'}</td>
                <td data-label="Manager">{loc.managerId?.name || '—'}</td>
                <td data-label="Map Location">
                  {loc.lat && loc.lng ? (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'none', fontWeight: 600 }}
                    >
                      <MapPin size={12} />
                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </a>
                  ) : '—'}
                </td>
                <td data-label="Actions">
                  <div className={styles.actionButtons}>
                    <button
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      onClick={() => handleEdit(loc)}
                      aria-label="Edit location"
                    >
                      <Edit2 />
                    </button>
                    {userRole === 'admin' && (
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(loc._id)}
                        aria-label="Delete location"
                      >
                        <Trash2 />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className={styles.pagination}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>◀ Prev</button>
        <button disabled={page * pageSize >= filteredLocations.length} onClick={() => setPage(page + 1)}>Next ▶</button>
      </div>
    </div>
  );
}

export default ManageLocations;