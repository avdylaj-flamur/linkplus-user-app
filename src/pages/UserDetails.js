import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

// shows one user's info. tries redux first, else fetches one.
export default function UserDetails() {
  const { id } = useParams();              // :id from the route
  const userFromStore = useSelector(s =>
    s.users.items.find(u => String(u.id) === String(id))
  );

  const [user, setUser] = useState(userFromStore || null);
  const [loading, setLoading] = useState(!userFromStore); // only load if we don't have it
  const [error, setError] = useState('');

  useEffect(() => {
    if (userFromStore) return; 
    let stop = false;

    async function loadOne() {
      try {
        const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);
        if (!res.ok) throw new Error('bad status');
        const data = await res.json();
        if (!stop) setUser(data);
      } catch (e) {
        if (!stop) setError('Failed to load user');
      } finally {
        if (!stop) setLoading(false);
      }
    }

    loadOne();
    return () => { stop = true; };
  }, [id, userFromStore]);

  if (loading) return <main className="container">Loading…</main>;
  if (error)   return <main className="container">{error}</main>;
  if (!user)   return <main className="container">User not found.</main>;

  const address = user.address
    ? `${user.address.street}, ${user.address.suite}, ${user.address.city} (${user.address.zipcode})`
    : '—';

  return (
    <main className="container">
      <header className="title" style={{ marginBottom: 12 }}>
        LinkPlus — User Manager
      </header>

      <div style={{ marginBottom: 12 }}>
        <Link to="/" className="rowLink">← Back</Link>
      </div>

      <h2 className="title" style={{ marginBottom: 4 }}>{user.name}</h2>
      <div className="subtle" style={{ marginBottom: 16 }}>ID: {user.id}</div>

      <p><strong>Email:</strong> <a href={`mailto:${user.email}`} className="rowLink">{user.email}</a></p>
      <p><strong>Phone:</strong> {user.phone || '—'}</p>
      <p><strong>Website:</strong> {user.website ? <a href={`http://${user.website}`} className="rowLink">{user.website}</a> : '—'}</p>
      <p><strong>Company:</strong> {user.company?.name || '—'}</p>
      <p><strong>Address:</strong> {address}</p>
    </main>
  );
}
