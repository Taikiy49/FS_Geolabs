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
          <h2 className="homepage-subsection-title">Home</h2>
          <input className="homepage-search" placeholder="Search tools..." />
        </div>
      </div>

      {/* First two main categories */}
      <div className="homepage-list">
        {homepageCards.slice(0, 2).map((item, idx) => (
          <div
            key={idx}
            className={`homepage-row ${item.disabled ? 'homepage-row-disabled' : ''}`}
            style={{ cursor: item.disabled ? 'not-allowed' : 'pointer', opacity: item.disabled ? 0.5 : 1 }}
          >
            <div className="homepage-row-left">
              <div className='homepage-row-header'>
                <div className="homepage-icon">{item.icon}</div>
                <div>
                  <div className="homepage-title">
                    {item.label} {item.tag && <span className="homepage-badge">{item.tag}</span>}
                  </div>
                  <div className="homepage-sublabel">{item.sublabel}</div>
                </div>
              </div>
              <div>
                <div className="homepage-description">{item.description}</div>
                <div className="homepage-updated">
                  {item.updated ? getDaysAgo(item.updated) : 'Updated recently'}
                </div>
                {item.subpages && (
                  <div className="homepage-subpages">
                    {item.subpages.map((sub, i) => (
                      <div
                        key={i}
                        className="homepage-subpage-link"
                        onClick={() => handleClick(sub.path)}
                      >
                        <div className='homepage-subpage-link-header'>
                          <div className="subpage-icon">{sub.icon}</div>
                          <div className="subpage-info">
                            {sub.name}
                          </div>
                        </div>
                        <div className="subpage-description">{sub.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Section */}
      <div className="homepage-contact-wrapper">
        {homepageCards[2] && (
          <div
            className={`homepage-row ${homepageCards[2].disabled ? 'homepage-row-disabled' : ''}`}
            style={{
              cursor: homepageCards[2].disabled ? 'not-allowed' : 'pointer',
              opacity: homepageCards[2].disabled ? 0.5 : 1,
            }}
            onClick={() => handleClick(homepageCards[2].path, homepageCards[2].disabled)}
          >
            <div className="homepage-row-left">
  <div className="homepage-row-header">
    <div className="homepage-icon">{homepageCards[2].icon}</div>
    <div>
      <div className="homepage-title">
        {homepageCards[2].label}{' '}
        {homepageCards[2].tag && <span className="homepage-badge">{homepageCards[2].tag}</span>}
      </div>
      <div className="homepage-sublabel">{homepageCards[2].sublabel}</div>
    </div>
  </div>
  <div className="homepage-description">{homepageCards[2].description}</div>
</div>

          </div>
        )}
      </div>

      {/* Contact Section */}
{/* Contact Section */}
<div className="homepage-contact-wrapper">
  {homepageCards[3] && (
    <div
      className={`homepage-row ${homepageCards[3].disabled ? 'homepage-row-disabled' : ''}`}
      style={{
        cursor: homepageCards[3].disabled ? 'not-allowed' : 'pointer',
        opacity: homepageCards[3].disabled ? 0.5 : 1,
      }}
      onClick={() => handleClick(homepageCards[3].path, homepageCards[3].disabled)}
    >
      <div className="homepage-row-left">
        <div className="homepage-row-header">
          <div className="homepage-icon">{homepageCards[3].icon}</div>
          <div>
            <div className="homepage-title">
              {homepageCards[3].label}{' '}
              {homepageCards[3].tag && <span className="homepage-badge">{homepageCards[3].tag}</span>}
            </div>
            <div className="homepage-sublabel">{homepageCards[3].sublabel}</div>
          </div>
        </div>
        <div className="homepage-description">{homepageCards[3].description}</div>
      </div>
    </div>
  )}
</div>

    </div>
  );
};

export default HomePage;
