import React, { useState } from 'react';
import { FaPlus, FaBell, FaUserCircle, FaChevronDown } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = () => {
    window.location.href = '/'; // basic redirect (or customize)
  };

  return (
    <header className="header">
      <Link to="/" className="header-left" style={{ textDecoration: 'none' }}>
        <img src="/geolabs.png" alt="Geolabs Logo" className="header-logo" />
        <span className="header-title">Geolabs, Inc.</span>
      </Link>

      <div className="header-center">
        <input type="text" className="header-search" placeholder="Search..." />
      </div>

      <div className="header-right">
        <FaPlus className="header-icon" />
        <FaBell className="header-icon" />
        <FaUserCircle className="header-icon" />

        <div className="header-profile-container" onClick={toggleDropdown}>
          <div className="profile-icon-wrapper">
            <FaUserCircle className="profile-icon" />
          </div>
          <span className="profile-name">User</span>
          <FaChevronDown className="dropdown-icon" />
          {dropdownOpen && (
            <div className="profile-dropdown">
              <button className="dropdown-item" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
