import React from 'react';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="footer">
      © {new Date().getFullYear()} Geolabs AI Software. All rights reserved.
    </footer>

  );
}

export default Footer;
