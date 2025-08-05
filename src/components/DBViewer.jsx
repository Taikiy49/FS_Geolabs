// FileSystem.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/DBViewer.css';
import API_URL from '../config';

export default function FileSystem() {
  const [existingDbs, setExistingDbs] = useState([]);
  const [expandedDbs, setExpandedDbs] = useState({});
  const [dbFiles, setDbFiles] = useState({});
  const [dbStructure, setDbStructure] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activePdfUrl, setActivePdfUrl] = useState('');
const [s3PdfUrls, setS3PdfUrls] = useState({});

  


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

  const fetchS3PdfUrls = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/s3-db-pdfs`);
      const urlMap = {};
      for (const { Key, url } of res.data.files) {
        urlMap[Key] = url;
      }
      setS3PdfUrls(urlMap);
    } catch (err) {
      console.error('❌ Failed to load S3 signed URLs:', err);
    }
  };

  fetchDbs();
  fetchS3PdfUrls();
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
    <div className="db-viewer-wrapper">
      <div className="db-viewer-panel">
        <div className="db-viewer-title">Available Databases</div>
        <input
          type="text"
          className="db-viewer-search"
          placeholder="Search databases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ul className="db-viewer-list">
          {filteredDbs.map((db, index) => (
            <li key={index} className="db-viewer-item">
              <div className="db-viewer-row">
                <div className="db-viewer-name-group">
                  <span className="db-viewer-name" onClick={() => toggleDbFiles(db)}>
                    {db} {expandedDbs[db] ? '▲' : '▼'}
                  </span>
                  <span className="db-viewer-inspect" onClick={() => handleDbClick(db)}>
                    [View Schema]
                  </span>
                </div>
              </div>
              {expandedDbs[db] && dbFiles[db] && (
                <ul className="db-viewer-file-list">
  {dbFiles[db].map((file, i) => (
    <li key={i} className="db-viewer-file-item">
      <span
        className="db-file-link"
        onClick={() => {
          const key = `${db}/${file}`;
          const signedUrl = s3PdfUrls[key];
          if (signedUrl) {
            setActivePdfUrl(signedUrl);
          } else {
            alert('❌ Signed URL not found for this file.');
          }
        }}
      >
        {file}
      </span>
    </li>
  ))}
</ul>

              )}
            </li>
          ))}
        </ul>
      </div>

      {showPopup && dbStructure && (
        <div className="db-viewer-popup-overlay">
          <div className="db-viewer-popup-content">
            <button className="db-viewer-popup-close" onClick={closePopup}>✕</button>
            <h4>📊 Structure of {dbStructure.db}</h4>
            {Object.entries(dbStructure).map(([table, info]) =>
              table === 'db' ? null : (
                <div key={table} className="db-viewer-table-preview">
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
      {activePdfUrl && (
  <div
    className="popup-overlay"
    onClick={() => setActivePdfUrl('')}
  >
    <div
      className="popup-content pdf-viewer-popup"
      onClick={(e) => e.stopPropagation()}
    >
      <button className="popup-close" onClick={() => setActivePdfUrl('')}>✕</button>
      <iframe
        src={activePdfUrl}
        title="PDF Viewer"
        width="100%"
        height="600px"
        style={{ border: 'none' }}
      />
    </div>
  </div>
)}

    </div>
    
  );
}
