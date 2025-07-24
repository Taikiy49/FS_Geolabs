import React from 'react';
import { useMsal } from '@azure/msal-react';
import { NavLink } from 'react-router-dom';

import '../styles/Header.css';

function Header() {
  const { instance } = useMsal();

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: '/' });
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-left">
          <img src="/geolabs.png" alt="Geolabs Logo" className="header-logo" />
          <span className="header-title">Geolabs, Inc.</span>
        </div>
        <div className="header-right">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      <nav className="header-nav">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/filesystem">File System</NavLink>
        <NavLink to="/contextualchatbot">Contextual Chatbot</NavLink>
        <NavLink to="/reports">Reports</NavLink>
        <NavLink to="/admin">Admin</NavLink>
        <a href="#contact">Coming</a>
        <a href="#contact">Coming</a>
        <a href="#contact">Coming</a>
        <a href="#contact">Contact</a>

      </nav>
    </header>
  );
}

export default Header;
