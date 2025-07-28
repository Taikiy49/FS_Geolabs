import React, { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { FaPlus, FaBell, FaQuestionCircle, FaChevronDown } from 'react-icons/fa';
import '../styles/Header.css';

function Header() {
  const { instance, accounts } = useMsal();
  const user = accounts[0];
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: '/' });
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <header className="header">
      <div className="header-left">
        <img src="/geolabs.png" alt="Geolabs Logo" className="header-logo" />
        <span className="header-title">Geolabs, Inc.</span>
      </div>

      <div className="header-center">
        <input type="text" className="header-search" placeholder="Search..." />
      </div>

      <div className="header-right">
        <FaPlus className="header-icon" />
        <FaBell className="header-icon" />
        <FaQuestionCircle className="header-icon" />

        <div className="header-profile-container" onClick={toggleDropdown}>
          <img src="/default-profile.png" alt="Profile" className="profile-pic" />
          <span className="profile-name">{user?.username || 'User'}</span>
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
