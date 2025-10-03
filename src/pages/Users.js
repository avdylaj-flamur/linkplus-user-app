// src/pages/Users.js
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUsers, addUser, deleteUser, updateUser } from '../features/usersSlice';

export default function Users() {
  const users = useSelector(s => s.users.items);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [query, setQuery]     = useState('');

  // default to "Recently added" so new items show at the top
  const [sortBy, setSortBy]   = useState('added'); // added  nam, email,  company

  // add form state
  const [form, setForm]         = useState({ name: '', email: '', company: '' });
  const [formErrors, setErrors] = useState({});

  // inline edit state
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]     = useState({ name: '', email: '', company: '' });
  const [editErrors, setEditErrors] = useState({});

  // fetch once, then drop data into redux
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const res = await fetch('https://jsonplaceholder.typicode.com/users');
        if (!res.ok) throw new Error('bad status');
        const data = await res.json();
        if (!stop) dispatch(setUsers(data));
      } catch {
        if (!stop) setError('Failed to load users');
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [dispatch]);

  // filter first, then sort
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = !q ? users : users.filter(u =>
      (u.name  || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );

    // simple A–Z key
    const getVal = (u) => {
      if (sortBy === 'email')   return (u.email || '').toLowerCase();
      if (sortBy === 'company') return (u.company?.name || '').toLowerCase();
      return (u.name || '').toLowerCase();
    };

    const out = [...list];
    if (sortBy === 'added') {
      // newest first by createdAt,local adds get Date.now()
      out.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    } else {
      out.sort((a, b) => getVal(a).localeCompare(getVal(b)));
    }
    return out;
  }, [users, query, sortBy]);

  // add form validation
  function validateAdd() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // add new goes to top because of createdAt + sort=added
  function onAddUser(e) {
    e.preventDefault();
    if (!validateAdd()) return;

    dispatch(addUser({
      id: Date.now(),
      name: form.name.trim(),
      email: form.email.trim(),
      company: { name: form.company.trim() || '—' },
    }));

    setForm({ name: '', email: '', company: '' });
    setErrors({});
  }

  // delete one
  function onDelete(id) {
    dispatch(deleteUser(id));
    if (editingId === id) {
      setEditingId(null);
      setEditErrors({});
    }
  }

  // start editing a row
  function onEditStart(u) {
    setEditingId(u.id);
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      company: u.company?.name || '',
    });
    setEditErrors({});
  }

  // cancel edit
  function onEditCancel() {
    setEditingId(null);
    setEditErrors({});
  }

  // edit form validation 
  function validateEdit() {
    const e = {};
    if (!editForm.name.trim()) e.name = 'Name is required';
    if (!editForm.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(editForm.email)) e.email = 'Invalid email';
    setEditErrors(e);
    return Object.keys(e).length === 0;
  }

  // save edit - redux
  function onEditSave(e, id) {
    e.preventDefault();
    if (!validateEdit()) return;

    dispatch(updateUser({
      id,
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      company: { name: editForm.company.trim() || '—' },
    }));

    setEditingId(null);
    setEditErrors({});
  }

  if (loading) return <main className="container">Loading…</main>;
  if (error)   return <main className="container">{error}</main>;

  return (
    <main className="container">
      <h1 className="title">Users</h1>

      {/* add user */}
      <form onSubmit={onAddUser} className="toolbar">
        <input
          name="name"
          placeholder="Full name *"
          value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          className="input"
        />
        <input
          name="email"
          placeholder="Email *"
          value={form.email}
          onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
          className="input"
        />
        <input
          name="company"
          placeholder="Company (optional)"
          value={form.company}
          onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
          className="input"
        />
        <button type="submit" className="button">+ Add</button>

        <div className="errors">
          {formErrors.name && <span style={{ marginRight: 10 }}>{formErrors.name}</span>}
          {formErrors.email && <span>{formErrors.email}</span>}
        </div>
      </form>

      {/* search + sort */}
      <div className="toolbar" style={{ marginTop: 0 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          aria-label="Search users"
          className="input"
          style={{ width: 'min(520px, 100%)' }}
        />

        <span style={{ marginLeft: 'auto' }} />
        <label className="subtle" htmlFor="sortBy" style={{ marginRight: 6 }}>Sort:</label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input"
        >
          <option value="added">Recently added</option>
          <option value="name">Name (A–Z)</option>
          <option value="email">Email (A–Z)</option>
          <option value="company">Company (A–Z)</option>
        </select>
      </div>

      {/* list */}
      <ul className="list">
        {visible.map(u => {
          const isEditing = editingId === u.id;

          if (isEditing) {
            // inline edit mode
            return (
              <li key={u.id} className="item">
                <form onSubmit={(e) => onEditSave(e, u.id)} style={{ display: 'grid', gap: 8 }}>
                  <input
                    className="input"
                    placeholder="Full name *"
                    value={editForm.name}
                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                  />
                  <input
                    className="input"
                    placeholder="Email *"
                    value={editForm.email}
                    onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                  />
                  <input
                    className="input"
                    placeholder="Company"
                    value={editForm.company}
                    onChange={(e) => setEditForm(f => ({ ...f, company: e.target.value }))}
                  />

                  {(editErrors.name || editErrors.email) && (
                    <div className="errors">
                      {editErrors.name && <span style={{ marginRight: 10 }}>{editErrors.name}</span>}
                      {editErrors.email && <span>{editErrors.email}</span>}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" className="button">Save</button>
                    <button type="button" className="button" onClick={onEditCancel}>Cancel</button>
                  </div>
                </form>
              </li>
            );
          }

          
          return (
            <li key={u.id} className="item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Link to={`/users/${u.id}`} className="rowLink" style={{ flex: 1 }}>
                  <div className="name">{u.name}</div>
                  <div className="muted">{u.email}</div>
                  <div className="subtle">{u.company?.name || '—'}</div>
                </Link>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditStart(u); }}
                  >
                    Edit
                  </button>
                  <button
                    className="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(u.id); }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}

        {visible.length === 0 && (
          <li className="item subtle">No users match “{query}”.</li>
        )}
      </ul>

      <p className="note">(heads up: users i add are local only)</p>
    </main>
  );
}
