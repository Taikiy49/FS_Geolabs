import React from 'react';
import '../styles/HomePage.css';
import { FaTools, FaBook, FaUserShield, FaEnvelope, FaEllipsisH } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  const cards = [
    {
      label: 'Reports',
      sublabel: 'Project data',
      icon: <FaTools size={40} />,
      description: 'Search and retrieve engineering reports quickly using AI-powered tools.',
      linkText: 'View Reports →',
      link: '/reports',
    },
    {
      label: 'Admin',
      sublabel: 'Admin tools',
      icon: <FaUserShield size={40} />,
      description: 'Access administrative tools for managing files, users, and configurations.',
      linkText: 'Admin Access →',
      link: '#admin',
    },
    {
      label: 'Employee Handbook',
      sublabel: 'Company policies',
      icon: <FaBook size={40} />,
      description: 'Read through company policies, guidelines, and onboarding documents.',
      linkText: 'Read Handbook →',
      link: '#handbook',
    },
    {
      label: 'Contact',
      sublabel: 'Get in touch',
      icon: <FaEnvelope size={40} />,
      description: 'Reach out to Geolabs for support, questions, or collaboration opportunities.',
      linkText: 'Contact Us →',
      link: '#contact',
    },
    {
      label: 'More Coming...',
      sublabel: 'Under development',
      icon: <FaEllipsisH size={40} />,
      description: 'New tools and features are on the way. Check back soon!',
      linkText: '',
      link: '',
    },
    {
      label: 'More Coming...',
      sublabel: 'Under development',
      icon: <FaEllipsisH size={40} />,
      description: 'We’re working on expanding the platform to serve you better.',
      linkText: '',
      link: '',
    },
  ];

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
        {cards.map((item, idx) => (
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
