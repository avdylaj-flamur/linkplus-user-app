// src/features/usersSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = { items: [] };

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // put API users into state. give each a tiny createdAt so
    // our "Recently added" sort works (new local ones will be newer)
    setUsers(state, action) {
      const arr = Array.isArray(action.payload) ? action.payload : [];
      state.items = arr.map((u, i) => ({ ...u, createdAt: i })); // 0,1,2... (older)
    },

    // add new user at the top, mark it as "newest"
    addUser(state, action) {
      const payload = action.payload || {};
      state.items.unshift({ ...payload, createdAt: Date.now() });
    },

    // update one user by id (name/email/company.name)
    updateUser(state, action) {
      const next = action.payload || {};
      const idx = state.items.findIndex(u => String(u.id) === String(next.id));
      if (idx !== -1) {
        const prev = state.items[idx] || {};
        state.items[idx] = {
          ...prev,
          ...next,
          company: {
            name:
              (next.company && next.company.name) ??
              (prev.company && prev.company.name) ??
              '—',
          },
        };
        // keep its createdAt (don’t move position unless sort changes)
        if (prev.createdAt != null && state.items[idx].createdAt == null) {
          state.items[idx].createdAt = prev.createdAt;
        }
      }
    },

    // remove by id
    deleteUser(state, action) {
      const id = action.payload;
      state.items = state.items.filter(u => String(u.id) !== String(id));
    },
  },
});

export const { setUsers, addUser, updateUser, deleteUser } = usersSlice.actions;
export default usersSlice.reducer;
