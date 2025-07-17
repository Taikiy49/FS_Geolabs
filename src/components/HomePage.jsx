import React from 'react';
import '../styles/HomePage.css';
import homepageCards from './HomePageHelper';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  const handleClick = (link) => {
    if (!link) return;
    if (link.startsWith('/')) {
      navigate(link);
    } else {
      const target = document.querySelector(link);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="homepage-container" id="home">
      <div className="homepage-grid">
        {homepageCards.map((item, idx) => (
          <div key={idx} className="homepage-card">
            <div className="homepage-card-header">
              <div className="homepage-icon">{item.icon}</div>
              <div>
                <h2>{item.label}</h2>
                <h3 className="homepage-sublabel">{item.sublabel}</h3>
              </div>
            </div>
            <p>{item.description}</p>
            {item.linkText && (
              <span className="homepage-link" onClick={() => handleClick(item.link)}>
                {item.linkText}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
