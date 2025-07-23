// Admin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Admin.css';
import API_URL from '../config';

export default function Admin() {
  const [file, setFile] = useState(null);
  const [dbName, setDbName] = useState('');
  const [mode, setMode] = useState('new');
  const [existingDbs, setExistingDbs] = useState([]);
  const [message, setMessage] = useState('');
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
    fetchDbs();
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

    const formData = new FormData();
    formData.append('file', file);
    formData.append('db_name', dbName);
    formData.append('mode', mode);

    try {
      const res = await axios.post(`${API_URL}/api/process-file`, formData);
      setMessage(res.data.message);
    } catch (err) {
      console.error('❌ Error uploading file:', err);
      setMessage('❌ Failed to process file.');
    }
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
      <div className="admin-left">
        <h2 className="admin-title">Admin: Index Document</h2>

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
            <input
              type="radio"
              value="new"
              checked={mode === 'new'}
              onChange={() => setMode('new')}
            />
            Create New DB
          </label>
          <label>
            <input
              type="radio"
              value="append"
              checked={mode === 'append'}
              onChange={() => setMode('append')}
            />
            Append to Existing DB
          </label>
        </div>

        <button className="admin-button" onClick={handleSubmit}>Index File</button>
        {message && <p className="admin-message">{message}</p>}
      </div>

      <div className="admin-right">
        <h3 className="existing-db-title">📂 Existing Databases</h3>
        <ul className="existing-db-list">
          {existingDbs.map((db, index) => (
            <li
              key={index}
              className="existing-db-item"
              onClick={() => handleDbClick(db)}
            >
              {db}
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
                        typeof cell === 'string' && cell.length > 50
                          ? cell.slice(0, 50) + '...'
                          : cell
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
