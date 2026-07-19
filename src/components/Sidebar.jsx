import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <span style={{ fontSize: '24px' }}>📦</span>
        <span>Sinod Tech</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>📊</span> Dashboard
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>📦</span> Inventory Catalog
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>👥</span> Customers CRM
        </NavLink>
        <NavLink to="/sales" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>🛒</span> Sales & Orders
        </NavLink>
        <NavLink to="/employees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span>💼</span> Employees & KPIs
        </NavLink>
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {getInitials(user.name)}
            </div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', padding: '8px' }}>
            Logout
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
