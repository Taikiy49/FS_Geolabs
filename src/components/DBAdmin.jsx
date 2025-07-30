// Admin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/DBAdmin.css';
import API_URL from '../config';
import { FaSpinner } from 'react-icons/fa';

export default function Admin() {
  const [files, setFiles] = useState([]);
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
  const [rawTitle, setRawTitle] = useState('');


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
  const dropped = Array.from(e.dataTransfer.files);
  const pdfs = dropped.filter(f => f.name.toLowerCase().endsWith('.pdf'));
  setFiles(prev => [...prev, ...pdfs]);
};

const handleRemoveFile = (index) => {
  setFiles(prev => prev.filter((_, i) => i !== index));
};




  const handleSubmit = async () => {
  if (files.length === 0 || !dbName) {
    setMessage('❌ Please select file(s) and enter/select a DB name.');
    return;
  }

  if (mode === 'new' && existingDbs.includes(dbName)) {
    setMessage('❌ A database with this name already exists. Please choose a different name.');
    return;
  }

  setSteps([]);
  setStatus('Uploading files...');
  setMessage('');

  for (let file of files) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('db_name', dbName);
    formData.append('mode', mode);
    formData.append('user', 'admin');

    try {
      const res = await axios.post(`${API_URL}/api/process-file`, formData, {
        onUploadProgress: () => setStatus(`📄 Uploading ${file.name}...`)
      });
      setSteps(prev => [...prev, ...res.data.steps || []]);
    } catch (err) {
      console.error(`❌ Error uploading ${file.name}:`, err);
    }
  }

  setStatus('');
  setMessage('✅ All files processed.');
};

// Group uploadHistory entries
const groupUploads = (history) => {
  const groups = [];
  let currentGroup = [];
  
  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const prev = history[i - 1];

    const entryTime = new Date(entry.time).getTime();
    const prevTime = prev ? new Date(prev.time).getTime() : 0;
    const timeDiff = (entryTime - prevTime) / 60000; // in minutes

    const sameDb = !prev || entry.db === prev.db;
    const within10 = !prev || timeDiff <= 10;

    if (i === 0 || (sameDb && within10)) {
      currentGroup.push(entry);
    } else {
      groups.push(currentGroup);
      currentGroup = [entry];
    }
  }
  if (currentGroup.length) groups.push(currentGroup);

  return groups;
};

const groupedHistory = groupUploads(uploadHistory);

  const formatDbName = (filename) => {
  return filename
    .replace(/\.db$/, '')      // remove .db
    .replace(/_/g, ' ')        // replace _ with space
    .replace(/\b\w/g, c => c.toUpperCase()); // capitalize each word
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
  {/* Top section: Upload box and controls */}
  <div className="admin-upload-top">
  <div
  className="drop-zone"
  onDragOver={(e) => e.preventDefault()}
  onDrop={handleDrop}
  onClick={() => document.getElementById('fileInput').click()}
>
  {files.length > 0 ? (
    files.map((f, i) => (
      <div key={i} className="selected-file">
        {f.name}
        <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(i); }}>✕</button>
      </div>
    ))
  ) : (
    <span className="drop-zone-text">
      Click or drag & drop one or more .pdf files here
    </span>
  )}

    <input
      type="file"
      id="fileInput"
      multiple
      accept=".pdf"
      style={{ display: 'none' }}
      onChange={(e) => {
        const selected = Array.from(e.target.files);
        const pdfs = selected.filter(f => f.name.toLowerCase().endsWith('.pdf'));
        setFiles(prev => [...prev, ...pdfs]);
      }}
    />
  </div>

  {/* ✅ Wrap all other controls in a container */}
  <div className="upload-form-controls">
    {mode === 'new' ? (
  <>
    <div className="upload-form-group-label">Title:</div>
    <input
      type="text"
      value={rawTitle}
      onChange={(e) => {
        const input = e.target.value;
        setRawTitle(input);
        const formatted = input.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        setDbName(formatted ? formatted + '.db' : '');
      }}
      placeholder="Enter a title like 'Employee Handbook'"
      className="admin-input"
    />
  </>
) : (
  <>
    <div className="upload-form-group-label">Select:</div>
    <select className="admin-select" onChange={(e) => setDbName(e.target.value)} value={dbName}>
      <option value="">-- Select a DB --</option>
      {existingDbs
        .filter(db => db !== 'chat_history.db')
        .map((db, i) => (
          <option key={i} value={db}>{formatDbName(db)}</option>
        ))}
    </select>
  </>
)}


    <div className="admin-radio-group">
      <label>
        <input type="radio" value="new" checked={mode === 'new'} onChange={() => setMode('new')} />
        Create New Database
      </label>
      <label>
        <input type="radio" value="append" checked={mode === 'append'} onChange={() => setMode('append')} />
        Add to Existing Database
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
</div>

  {/* Bottom section: side-by-side panels */}
  <div className="admin-bottom-panels">
    {/* Left: Upload history */}
    <div className="admin-history-panel">
      <div className="existing-db-title">Upload History</div>
      <ul className="upload-history-list">
        {groupedHistory.map((group, i) => (
          <li key={i} className="upload-history-group">
            <div>
              <strong>{group[0].user}</strong> added <em>{group.length} file(s)</em>
              → <span className="upload-db-name">{formatDbName(group[0].db)}</span>
            </div>
            <ul className="upload-history-sublist">
              {group.map((entry, j) => (
                <li key={j}>
                  <em>{entry.file}</em> — <span className="upload-time">{new Date(entry.time).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>

    {/* Right: Existing DB list */}
    <div className="admin-right">
      <div className="existing-db-title">Existing Databases</div>
      <div className="existing-db-list">
        {existingDbs.filter(db => db !== 'chat_history.db').map((db, index) => (
          <div key={index} className="existing-db-item">
            <div className="db-top-row">
              <div className="db-name-group">
                <span className="db-name" onClick={() => toggleDbFiles(db)}>
                  {formatDbName(db)} {expandedDbs[db] ? '▲' : '▼'}
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
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* DB Schema popup */}
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
