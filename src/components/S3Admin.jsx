import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/S3Admin.css';
import API_URL from '../config';

export default function S3Admin() {
  const [s3Files, setS3Files] = useState([]);
  const [activePdfUrl, setActivePdfUrl] = useState('');
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [groupedBuckets, setGroupedBuckets] = useState({});
  const [expandedBuckets, setExpandedBuckets] = useState({});

  const groupByBucket = (files) => {
    const map = {};
    for (const file of files) {
      const [bucket, ...rest] = file.Key.split('/');
      if (!map[bucket]) map[bucket] = [];
      map[bucket].push(file);
    }
    return map;
  };

  useEffect(() => {
    fetchS3Files();
  }, []);

  const fetchS3Files = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/s3-db-pdfs`);
      const files = res.data.files || [];
      setS3Files(files);
      setGroupedBuckets(groupByBucket(files));
    } catch (err) {
      console.error('❌ Failed to fetch S3 files:', err);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const pdfs = dropped.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    setFiles(prev => [...prev, ...pdfs]);
  };

  const handleUpload = async () => {
    setUploading(true);
    setStatus('Uploading to S3...');
    for (let file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await axios.post(`${API_URL}/api/upload-to-s3`, formData);
        setStatus(`✅ Uploaded ${file.name}`);
      } catch (err) {
        setStatus(`❌ Failed to upload ${file.name}`);
      }
    }
    setFiles([]);
    setUploading(false);
    fetchS3Files();
  };

  return (
    <div className="s3-admin-wrapper">
      <div className="s3-admin-upload-section">
        <div
          className="s3-admin-drop-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('s3FileInput').click()}
        >
          {files.length > 0 ? (
            files.map((f, i) => (
              <div key={i} className="s3-admin-selected-file">
                {f.name}
              </div>
            ))
          ) : (
            <span className="s3-admin-drop-zone-text">Click or drag & drop .pdf files</span>
          )}
          <input
            type="file"
            id="s3FileInput"
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
        <button
          className="s3-admin-button"
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
        >
          Upload to S3
        </button>
        {status && <div className="s3-admin-status">{status}</div>}
      </div>

      <div className="s3-admin-file-list">
        <h3 className="s3-admin-section-title">S3 PDF Files</h3>
        {Object.keys(groupedBuckets).map((bucketName, idx) => (
          <div key={idx} className="s3-admin-bucket-group">
            <div
              className="s3-admin-bucket-header"
              onClick={() =>
                setExpandedBuckets(prev => ({
                  ...prev,
                  [bucketName]: !prev[bucketName]
                }))
              }
            >
              {expandedBuckets[bucketName] ? '▼' : '▶'} {bucketName}
            </div>
            {expandedBuckets[bucketName] && (
              <ul className="s3-admin-bucket-file-list">
                {groupedBuckets[bucketName].map((file, j) => (
                  <li key={j} className="s3-admin-file-item">
                    <span
                      className="s3-admin-file-link"
                      onClick={() => setActivePdfUrl(file.url)}
                    >
                      {file.Key.split('/').slice(1).join('/')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {activePdfUrl && (
        <div className="s3-admin-popup-overlay" onClick={() => setActivePdfUrl('')}>
          <div className="s3-admin-popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="s3-admin-popup-close" onClick={() => setActivePdfUrl('')}>✕</button>
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

