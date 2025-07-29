import React, { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { FaPlus, FaBell, FaQuestionCircle, FaChevronDown } from 'react-icons/fa';
import '../styles/Header.css';
import { Link } from 'react-router-dom';

import { FaUserCircle } from 'react-icons/fa';
// then replace FaQuestionCircle with FaUserCircle


function Header() {
  const { instance, accounts } = useMsal();
  const user = accounts[0];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profilePic, setProfilePic] = useState('/default-profile.png');

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: '/' });
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        const response = await instance.acquireTokenSilent({
          scopes: ['User.Read'],
          account: user,
        });

        const res = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: {
            Authorization: `Bearer ${response.accessToken}`,
          },
        });

        if (res.ok) {
          const blob = await res.blob();
          setProfilePic(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error('❌ Failed to load Microsoft profile picture:', err);
      }
    };

    if (user) fetchProfilePhoto();
  }, [instance, user]);

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
        <FaQuestionCircle className="header-icon" />

        <div className="header-profile-container" onClick={toggleDropdown}>
          {profilePic === '/default-profile.png' ? (
  <div className="profile-icon-wrapper">
    <FaUserCircle className="profile-icon" />
  </div>
) : (
  <img src={profilePic} alt="Profile" className="profile-pic" />
)}

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
