import React from 'react';
import { useMsal } from '@azure/msal-react';
import { Link } from 'react-router-dom'; // ✅ import Link
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
        <Link to="/">Home</Link>
        <Link to="/reports">Reports</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/employee">Employee Handbook</Link> {/* ✅ correct route here */}
        <a href="#contact">Tools</a>
        <a href="#contact">Analytics</a>
        <a href="#contact">Coming</a>
        <a href="#contact">Coming</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
}

export default Header;
