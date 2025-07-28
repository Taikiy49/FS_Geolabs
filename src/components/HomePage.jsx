import React from 'react';
import '../styles/HomePage.css';
import homepageCards from './HomePageHelper';
import { useNavigate } from 'react-router-dom';
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

  const displayedCards = homepageCards.slice(0, 6); // ✅ only show first 3

  return (
    <div className="homepage-container">
      <div className="homepage-top">
        <div className="homepage-greeting-card">
          <h1>Welcome back, {userName}</h1>
          <p>Let’s make today productive.</p>
        </div>

        <div className="homepage-header">
          <h2 className="homepage-subsection-title">Dashboard</h2>
          <input className="homepage-search" placeholder="Search tools..." />
        </div>

      </div>

      <div className="homepage-list">
        {displayedCards.map((item, idx) => (
          <div key={idx} className="homepage-row" onClick={() => handleClick(item.link)}>
            <div className="homepage-row-left">
              <div className="homepage-icon">{item.icon}</div>
              <div>
                <h2 className="homepage-title">
                  {item.label} {item.tag && <span className="homepage-badge">{item.tag}</span>}
                </h2>
                <p className="homepage-sublabel">{item.sublabel}</p>
                <p className="homepage-description">{item.description}</p>
                <p className="homepage-updated">
                  {item.updated ? getDaysAgo(item.updated) : 'Updated recently'}
                </p>
                <div className="homepage-usage-bar">
                  <div className="homepage-usage-fill" style={{ width: `${item.usage || 50}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
