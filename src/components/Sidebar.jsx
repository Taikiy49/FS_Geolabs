import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  FaBars, FaTimes, FaChevronDown, FaRobot, FaDatabase, FaCogs, FaComments,
  FaTable, FaUpload, FaSearch, FaFolderOpen, FaCloudUploadAlt, FaFileAlt,
  FaEnvelopeOpenText, FaHome
} from 'react-icons/fa';
import API_URL from '../config';
import '../styles/Sidebar.css';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isMobile = useIsMobile();
  const [dropdowns, setDropdowns] = useState({ doc: true, proj: true });

  const sidebarLink = (label, icon, path) => (
    <div className="sidebar-link" onClick={() => window.location.href = path}>
      {icon}
      {!collapsed && <span>{label}</span>}
    </div>
  );

  const toggleDropdown = (key) => {
    setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isMobile) return null;

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <FaBars /> : <FaTimes />}
      </div>

      {/* Home (only if not collapsed) */}
      {!collapsed && sidebarLink('Home', <FaHome className="sidebar-link-icon" />, '/')}

      {/* Document Databases Group */}
      <div className="sidebar-link" onClick={() => toggleDropdown('doc')}>
        <FaDatabase className="sidebar-link-icon" />
        {!collapsed && <span>Document Databases</span>}
        {!collapsed && (
          <FaChevronDown
            className={`sidebar-link-chevron ${dropdowns.doc ? 'rotate' : ''}`}
          />
        )}
      </div>
      {dropdowns.doc && !collapsed && (
        <div className="sidebar-dropdown">
          {sidebarLink('Ask AI', <FaComments className="sidebar-icon-mini" />, '/ask-ai')}
          {sidebarLink('DB Viewer', <FaTable className="sidebar-icon-mini" />, '/db-viewer')}
          {sidebarLink('DB Admin', <FaUpload className="sidebar-icon-mini" />, '/db-admin')}
        </div>
      )}

      {/* Project Finder Group */}
      <div className="sidebar-link" onClick={() => toggleDropdown('proj')}>
        <FaFolderOpen className="sidebar-link-icon" />
        {!collapsed && <span>Project Finder</span>}
        {!collapsed && (
          <FaChevronDown
            className={`sidebar-link-chevron ${dropdowns.proj ? 'rotate' : ''}`}
          />
        )}
      </div>
      {dropdowns.proj && !collapsed && (
        <div className="sidebar-dropdown">
          {sidebarLink('S3 Viewer', <FaFileAlt className="sidebar-icon-mini" />, '/s3-viewer')}
          {sidebarLink('S3 Admin', <FaCloudUploadAlt className="sidebar-icon-mini" />, '/s3-admin')}
          {sidebarLink('OCR Lookup', <FaSearch className="sidebar-icon-mini" />, '/ocr-lookup')}
        </div>
      )}

      {/* Contacts */}
      {sidebarLink('Contacts', <FaEnvelopeOpenText className="sidebar-link-icon" />, '/contacts')}
    </div>
  );
}
