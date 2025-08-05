import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/S3Viewer.css';
import { FaCloudDownloadAlt } from 'react-icons/fa';
import API_URL from '../config';

export default function S3Viewer() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/s3-files`);
        setFiles(response.data.files || []);
      } catch (err) {
        setError('Failed to fetch files.');
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, []);

  return (
    <div className="s3-viewer-wrapper">
      <div className="s3-viewer-panel">
        <h2 className="s3-viewer-title">S3 Bucket Files</h2>

        {loading ? (
          <p className="s3-viewer-status">Loading files...</p>
        ) : error ? (
          <p className="s3-viewer-status">{error}</p>
        ) : (
          <ul className="s3-viewer-list">
            {files.map((file, idx) => {
              const displayName = file.Key?.split('/').pop() || 'Unnamed File';
              return (
                <li key={idx} className="s3-viewer-item" onClick={() => setPreviewUrl(file.url)}>
                  <FaCloudDownloadAlt className="s3-viewer-icon" />
                  <span className="s3-viewer-filename">{displayName}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {previewUrl && (
        <div className="s3-viewer-popup-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="s3-viewer-popup-content" onClick={e => e.stopPropagation()}>
            <iframe src={previewUrl} title="File Preview" className="s3-viewer-frame" />
          </div>
        </div>
      )}
    </div>
  );
}
