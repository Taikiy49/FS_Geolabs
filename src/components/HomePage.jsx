// HomePage.jsx
import React from 'react';
import '../styles/HomePage.css';
import homepageCards from './HomePageHelper';
import { useNavigate } from 'react-router-dom';
import GitHubRepoWidget from './GitHubRepoWidget';
import { useMsal } from '@azure/msal-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const fullName = accounts[0]?.name || 'User';
  const userName = fullName.split(' ')[0];

  const handleClick = (link) => {
    if (!link) return;
    if (link.startsWith('/')) {
      navigate(link);
    } else {
      const target = document.querySelector(link);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getDaysAgo = (dateStr) => {
    const lastUpdated = new Date(dateStr);
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    return `${diff === 0 ? 'Updated today' : `Updated ${diff} day${diff === 1 ? '' : 's'} ago`}`;
  };

  return (
    <div className="homepage-container">
      <div className="homepage-greeting-card">
        <h1>Welcome back, {userName}</h1>
        <p>Let’s make today productive.</p>
      </div>

      <div className="homepage-header">
        <h2 className="homepage-subsection-title">🛠 Available Tools</h2>
        <input className="homepage-search" placeholder="Search tools..." />
      </div>

      <p className="homepage-tool-count">Total tools: {homepageCards.length}</p>

      <div className="homepage-list">
        {homepageCards.map((item, idx) => (
          <div key={idx} className="homepage-row" onClick={() => handleClick(item.link)}>
            <div className="homepage-row-left">
              <div className="homepage-icon">{item.icon}</div>
              <div>
                <h2 className="homepage-title">
                  {item.label} {item.tag && <span className="homepage-badge">{item.tag}</span>}
                </h2>
                <p className="homepage-sublabel">{item.sublabel}</p>
                <p className="homepage-description">{item.description}</p>
                <p className="homepage-updated">{getDaysAgo(item.lastUpdated || '2024-10-01')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <GitHubRepoWidget username="Taikiy49" />

      <footer className="homepage-footer">© 2025 Geolabs Software</footer>
    </div>
  );
};

export default HomePage;
