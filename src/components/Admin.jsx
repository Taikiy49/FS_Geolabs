// Admin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Admin.css';
import API_URL from '../config';
import { FaSpinner } from 'react-icons/fa';

export default function Admin() {
  const [file, setFile] = useState(null);
  const [dbName, setDbName] = useState('');
  const [mode, setMode] = useState('new');
  const [existingDbs, setExistingDbs] = useState([]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [steps, setSteps] = useState([]);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [expandedDbs, setExpandedDbs] = useState({});
  const [dbFiles, setDbFiles] = useState({});
  const [dbStructure, setDbStructure] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchDbs = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/list-dbs`);
        setExistingDbs(res.data.dbs || []);
      } catch (err) {
        console.error('❌ Failed to fetch DB list:', err);
      }
    };

    const fetchUploadHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/upload-history`);
        setUploadHistory(res.data);
      } catch (err) {
        console.error("❌ Failed to load upload history:", err);
      }
    };

    fetchDbs();
    fetchUploadHistory();
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !dbName) {
      setMessage('❌ Please select a file and enter/select a DB name.');
      return;
    }

    if (mode === 'new' && existingDbs.includes(dbName)) {
      setMessage('❌ A database with this name already exists. Please choose a different name.');
      return;
    }

    setStatus('Starting file upload...');
    setMessage('');
    setSteps([]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('db_name', dbName);
    formData.append('mode', mode);
    formData.append('user', 'admin');

    try {
      const res = await axios.post(`${API_URL}/api/process-file`, formData, {
        onUploadProgress: () => setStatus('📄 Uploading PDF...'),
      });
      setStatus('');
      setMessage(res.data.message);
      setSteps(res.data.steps || []);
    } catch (err) {
      console.error('❌ Error uploading file:', err);
      setStatus('');
      setMessage('❌ Failed to process file.');
    }
  };

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

  return (
    <div className="admin-wrapper">
      <div className="admin-history-panel">
        <h3 className="existing-db-title">Upload History</h3>
        <ul className="upload-history-list">
          {uploadHistory.map((entry, index) => (
            <li key={index} className="upload-history-item">
              <div><strong>{entry.user}</strong> added <em>{entry.file}</em></div>
              <div>→ <span className="upload-db-name">{entry.db}</span></div>
              <div className="upload-time">{new Date(entry.time).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-left">
        <div
          className="drop-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {file ? file.name : 'Drag & drop a .pdf file here'}
        </div>

        <input
          type="text"
          value={dbName}
          onChange={(e) => setDbName(e.target.value)}
          placeholder="Enter DB name (e.g. mydata.db)"
          className="admin-input"
          disabled={mode === 'append'}
        />

        {mode === 'append' && (
          <div className="admin-select-group">
            <label>Select Existing DB:</label>
            <select
              className="admin-select"
              onChange={(e) => setDbName(e.target.value)}
              value={dbName}
            >
              <option value="">-- Select a DB --</option>
              {existingDbs.map((db, i) => (
                <option key={i} value={db}>{db}</option>
              ))}
            </select>
          </div>
        )}

        <div className="admin-radio-group">
          <label>
            <input type="radio" value="new" checked={mode === 'new'} onChange={() => setMode('new')} />
            Create New DB
          </label>
          <label>
            <input type="radio" value="append" checked={mode === 'append'} onChange={() => setMode('append')} />
            Append to Existing DB
          </label>
        </div>

        <button className="admin-button" onClick={handleSubmit}>Index File</button>
        <div className={`admin-status ${status ? '' : 'admin-status-placeholder'}`}>
          {status ? (
            <>
              <FaSpinner className="spinner" />
              {status}
            </>
          ) : (
            <span>🛈 Status will appear here after you upload and index a file.</span>
          )}
        </div>
        {message && <p className="admin-message">{message}</p>}
      </div>

      <div className="admin-right">
        <h3 className="existing-db-title">Existing Databases</h3>
        <ul className="existing-db-list">
          {existingDbs.map((db, index) => (
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
                <button className="delete-db-button" onClick={async () => {
                  const confirmText = prompt(`Type DELETE ${db} to confirm deletion:`);
                  if (confirmText !== `DELETE ${db}`) {
                    alert('❌ Confirmation text does not match. Deletion cancelled.');
                    return;
                  }
                  try {
                    const res = await axios.post(`${API_URL}/api/delete-db`, {
                      db_name: db,
                      confirmation_text: confirmText,
                    });
                    alert(res.data.message);
                    setExistingDbs(prev => prev.filter(d => d !== db));
                  } catch (err) {
                    alert(err.response?.data?.error || '❌ Failed to delete.');
                  }
                }}>
                  Delete
                </button>
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
