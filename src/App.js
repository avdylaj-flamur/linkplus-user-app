import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import './App.css';

// tiny router setup: when we visit "/", show Users; for "/users/:id", show details
export default function App() {
  return (
    <div className="App">
      <header className="header">
        <h3 className="title">LinkPlus — User Manager</h3>
      </header>

      <div className="container">
        <Routes>
          <Route path="/" element={<Users />} />
          <Route path="/users/:id" element={<UserDetails />} />
        </Routes>
      </div>
    </div>
  );
}