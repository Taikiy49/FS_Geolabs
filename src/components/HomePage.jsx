import React from 'react';
import '../styles/HomePage.css';
import homepageCards from './HomePageCards';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const fullName = accounts[0]?.name || 'User';
  const userName = fullName.split(' ')[0];

  const handleClick = (link, disabled) => {
    if (!link || disabled) return;
    navigate(link);
  };

  const getDaysAgo = (dateStr) => {
    const lastUpdated = new Date(dateStr);
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    return `${diff === 0 ? 'Updated today' : `Updated ${diff} day${diff === 1 ? '' : 's'} ago`}`;
  };

  return (
    <div className="homepage-container">
      <div className="homepage-top">
        <div className="homepage-greeting-card">
  <div className="homepage-greeting-left">
    <h1>Welcome back, {userName}</h1>
    <p>Let’s make today productive.</p>
  </div>
  <div className="homepage-greeting-right">
    <span>{new Date().toLocaleDateString()}</span>
    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  </div>
</div>



        <div className="homepage-header">
          <h2 className="homepage-subsection-title">Dashboard</h2>
          <input className="homepage-search" placeholder="Search tools..." />
        </div>
      </div>

      <div className="homepage-list">
        {homepageCards.map((item, idx) => (
          <div
            key={idx}
            className={`homepage-row ${item.disabled ? 'homepage-row-disabled' : ''}`}
            style={{ cursor: item.disabled ? 'not-allowed' : 'pointer', opacity: item.disabled ? 0.5 : 1 }}
          >
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

                {item.subpages && (
                  <div className="homepage-subpages">
                    {item.subpages.map((sub, i) => (
                      <div
                        key={i}
                        className="homepage-subpage-link"
                        onClick={() => handleClick(sub.path)}
                      >
                        <div className="subpage-icon">{sub.icon}</div>
                        <div className="subpage-info">
                          <strong>{sub.name}</strong>
                          <p className="subpage-description">{sub.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
