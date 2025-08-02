import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaBars,
  FaTimes,
  FaChevronDown,
  FaRobot,
  FaTools,
  FaDatabase,
  FaCogs,
  FaEye,
  FaHandsHelping,
  FaEnvelope,
  FaHome,
} from 'react-icons/fa';
import API_URL from '../config';
import '../styles/Sidebar.css';

export default function Sidebar({ selectedDB, setSelectedDB, onHistoryClick }) {
  const [dropdowns, setDropdowns] = useState({
    document: false,
    askAI: false,
    project: false,
  });
  

  const [dbs, setDbs] = useState([]);
  const [history, setHistory] = useState([]);
  const [collapsed, setCollapsed] = useState(false);


  useEffect(() => {
    axios.get(`${API_URL}/api/list-dbs`)
      .then(res => {
        const filtered = res.data.dbs.filter(db =>
          !['chat_history.db', 'reports.db'].includes(db)
        );
        setDbs(filtered);
        if (!filtered.includes(selectedDB)) {
          setSelectedDB(filtered[0] || '');
        }
      })
      .catch(() => setDbs([]));
  }, [selectedDB, setSelectedDB]);

  useEffect(() => {
    if (!selectedDB) return;
    axios.get(`${API_URL}/api/chat_history`, {
      params: { user: 'guest', db: selectedDB },
    })
      .then(res => {
        const raw = res.data || [];
        const pairs = raw.map(row => ({
          question: row.question,
          answer: row.answer,
        }));
        setHistory(pairs);
      })
      .catch(() => setHistory([]));
  }, [selectedDB]);

  const toggleDropdown = (key) => {
    setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sidebarLink = (label, icon, path) => (
    <div className="sidebar-link" onClick={() => window.location.href = path}>
      {icon} {label}
    </div>
  );

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
  <div className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
  {collapsed ? <FaBars /> : <FaTimes />}
</div>


    <div className="sidebar">
      {sidebarLink('Home', <FaHome className="sidebar-link-icon" />, '/')}

      {/* Document Databases Section */}
      <div className="sidebar-link" onClick={() => toggleDropdown('document')}>
        <FaRobot className="sidebar-link-icon" />
        <span>Document Databases</span>
        <FaChevronDown className={`sidebar-link-chevron ${dropdowns.chatbot ? 'rotate' : ''}`} />

      </div>
      {dropdowns.document && (
        <div className="sidebar-dropdown">
          <div className="sidebar-dropdown-item" onClick={() => toggleDropdown('askAI')}>
            <FaRobot className="sidebar-icon-mini" /> Ask AI
            <FaChevronDown className={`sidebar-link-chevron ${dropdowns.chatbot ? 'rotate' : ''}`} />

          </div>
          {dropdowns.askAI && (
            <div className="sidebar-subdropdown">
              {dbs.map((db, idx) => (
                <div
                  key={idx}
                  className={`sidebar-dropdown-item ${db === selectedDB ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDB(db);
                    if (window.location.pathname !== '/ask-ai') {
                      window.location.href = '/ask-ai';
                    }
                  }}
                >
                  {db}
                </div>
              ))}
            </div>
          )}
          <div className="sidebar-dropdown-item" onClick={() => window.location.href = '/db-viewer'}>
            <FaDatabase className="sidebar-icon-mini" /> DB Viewer
          </div>
          <div className="sidebar-dropdown-item" onClick={() => window.location.href = '/db-admin'}>
            <FaCogs className="sidebar-icon-mini" /> DB Admin
          </div>
        </div>
      )}

      {/* Project Finder Section */}
      <div className="sidebar-link" onClick={() => toggleDropdown('project')}>
        <FaTools className="sidebar-link-icon" />
        <span>Project Finder</span>
        <FaChevronDown className={`sidebar-link-chevron ${dropdowns.chatbot ? 'rotate' : ''}`} />

      </div>
      {dropdowns.project && (
        <div className="sidebar-dropdown">
          <div className="sidebar-dropdown-item" onClick={() => window.location.href = '/file-viewer'}>
            <FaEye className="sidebar-icon-mini" /> File Viewer
          </div>
          <div className="sidebar-dropdown-item" onClick={() => window.location.href = '/s3-admin'}>
            <FaCogs className="sidebar-icon-mini" /> S3 Admin
          </div>
          <div className="sidebar-dropdown-item" onClick={() => window.location.href = '/ocr-lookup'}>
            <FaHandsHelping className="sidebar-icon-mini" /> OCR Lookup
          </div>
        </div>
      )}

      {/* Contacts Section */}
      <div className="sidebar-link" onClick={() => window.location.href = '/'}>
        <FaEnvelope className="sidebar-link-icon" /> Contacts
      </div>

     
    </div>
    </div>
  );
}
