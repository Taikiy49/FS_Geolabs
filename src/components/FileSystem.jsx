// FileSystem.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/FileSystem.css';
import API_URL from '../config';

export default function FileSystem() {
  const [existingDbs, setExistingDbs] = useState([]);
  const [expandedDbs, setExpandedDbs] = useState({});
  const [dbFiles, setDbFiles] = useState({});
  const [dbStructure, setDbStructure] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDbs = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/list-dbs`);
        const filtered = res.data.dbs?.filter(db => db !== 'chat_history.db') || [];
        setExistingDbs(filtered);
      } catch (err) {
        console.error('❌ Failed to fetch DB list:', err);
      }
    };

    fetchDbs();
  }, []);

  const toggleDbFiles = async (db) => {
    const isOpen = expandedDbs[db];
    if (!isOpen && !dbFiles[db]) {
      try {
        const res = await axios.post(`${API_URL}/api/list-files`, { db_name: db });
        setDbFiles(prev => ({ ...prev, [db]: res.data.files || [] }));
      } catch (err) {
        console.error(`❌ Failed to fetch files for ${db}:`, err);
        setDbFiles(prev => ({ ...prev, [db]: ['<error loading files>'] }));
      }
    }
    setExpandedDbs(prev => ({ ...prev, [db]: !isOpen }));
  };

  const handleDbClick = async (db) => {
    try {
      const res = await axios.post(`${API_URL}/api/inspect-db`, { db_name: db });
      setDbStructure({ db, ...res.data });
      setShowPopup(true);
    } catch (err) {
      console.error('❌ Failed to inspect DB:', err);
      setDbStructure(null);
    }
  };

  const closePopup = () => setShowPopup(false);

  const filteredDbs = existingDbs.filter(db =>
    db.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="filesystem-wrapper">
      <div className="filesystem-panel">
        <h3 className="existing-db-title">Available Databases</h3>
        <input
          type="text"
          className="filesystem-search"
          placeholder="Search databases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ul className="existing-db-list">
          {filteredDbs.map((db, index) => (
            <li key={index} className="existing-db-item">
              <div className="db-top-row">
                <div className="db-name-group">
                  <span className="db-name" onClick={() => toggleDbFiles(db)}>
                    {db} {expandedDbs[db] ? '▲' : '▼'}
                  </span>
                  <span className="db-inspect" onClick={() => handleDbClick(db)}>
                    [View Schema]
                  </span>
                </div>
              </div>
              {expandedDbs[db] && dbFiles[db] && (
                <ul className="db-files-list">
                  {dbFiles[db].map((file, i) => (
                    <li key={i} className="db-file-item">{file}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {showPopup && dbStructure && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="popup-close" onClick={closePopup}>✕</button>
            <h4>📊 Structure of {dbStructure.db}</h4>
            {Object.entries(dbStructure).map(([table, info]) =>
              table === 'db' ? null : (
                <div key={table} className="db-table-preview">
                  <strong>{table}</strong>
                  <div>Columns: {info.columns.join(', ')}</div>
                  <div>Sample Rows:</div>
                  <ul>
                    {info.sample_rows.map((row, i) => (
                      <li key={i}>{JSON.stringify(row.map(cell =>
                        typeof cell === 'string' && cell.length > 50 ? cell.slice(0, 50) + '...' : cell
                      ))}</li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
