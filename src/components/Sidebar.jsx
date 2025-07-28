import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaChevronDown,
  FaDatabase,
  FaFileAlt,
  FaTools,
  FaFolderOpen,
  FaUserShield,
  FaEnvelope,
  FaChartLine,
  FaHome,
} from 'react-icons/fa';
import API_URL from '../config';
import '../styles/Sidebar.css';

export default function Sidebar({ selectedDB, setSelectedDB, onHistoryClick }) {
  const [dbs, setDbs] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [history, setHistory] = useState([]);

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
  }, []);

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

  const handleDBSelect = (db) => {
    setSelectedDB(db);
    setDropdownOpen(false);

    if (window.location.pathname !== '/contextualchatbot') {
      window.location.href = '/contextualchatbot';
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-link" onClick={() => window.location.href = '/'}>
        <FaHome className="sidebar-link-icon" /> Home
      </div>

      <div className="sidebar-link" onClick={() => window.location.href = '/file-system'}>
        <FaFolderOpen className="sidebar-link-icon" /> File System
      </div>

      <div>
        <div className="sidebar-link" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <FaDatabase className="sidebar-link-icon" />
          <span>Contextual Chatbot</span>
          <FaChevronDown
            className={`sidebar-link-chevron ${dropdownOpen ? 'rotate' : ''}`}
            style={{ marginLeft: 'auto' }}
          />
        </div>

        {dropdownOpen && (
          <div className="sidebar-dropdown">
            {dbs.map((db, idx) => (
              <div
                key={idx}
                className={`sidebar-dropdown-item ${db === selectedDB ? 'active' : ''}`}
                onClick={() => handleDBSelect(db)}
              >
                {db}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-static-links">
        <div className="sidebar-link" onClick={() => window.location.href = '/reports'}>
          <FaFileAlt className="sidebar-link-icon" /> Reports
        </div>
        <div className="sidebar-link" onClick={() => window.location.href = '/admin'}>
          <FaTools className="sidebar-link-icon" /> Admin
        </div>
        <div className="sidebar-link" onClick={() => window.location.href = '/security'}>
          <FaUserShield className="sidebar-link-icon" /> Security
        </div>
        <div className="sidebar-link" onClick={() => window.location.href = '/contact'}>
          <FaEnvelope className="sidebar-link-icon" /> Contact
        </div>
        <div className="sidebar-link" onClick={() => window.location.href = '/metrics'}>
          <FaChartLine className="sidebar-link-icon" /> Metrics
        </div>
      </div>

      {window.location.pathname === '/contextual-chatbot' && (
        <div className="sidebar-chat-history">
          {history.map((pair, idx) => (
            <div
              key={idx}
              className="sidebar-history-item"
              onClick={() => onHistoryClick && onHistoryClick(pair)}
            >
              {pair.question}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
