import React from 'react';
import { useMsal } from '@azure/msal-react';
import '../styles/Header.css';

function Header() {
  const { instance } = useMsal();

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: '/', // You’ll be sent here after logout
    });
  };

  return (
    <header className="header-header">
      <div className="header-left">
        <img src="/geolabs.png" alt="Geolabs Logo" className="header-logo" />
        <h1 className="header-title">Geolabs, Inc.</h1>
      </div>

      <nav className="header-nav-links">
        <a href="/">Home</a>
        <a href="/reports">Reports</a>
        <a href="#admin">Admin</a>
        <a href="#handbook">Employee Handbook</a>
        <a href="#contact">Contact</a>
      </nav>

      <div className="header-auth-links">
        <button onClick={handleLogout} className="auth-button header-logout-button">
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
