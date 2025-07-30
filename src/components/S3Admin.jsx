import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/S3Admin.css'; // Optional: style file

export default function ViewReports() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await axios.get('/api/list-s3-files');
        setFiles(res.data.files); // expects [{ name: 'file.pdf', url: 'https://...' }]
      } catch (err) {
        console.error(err);
        setError('Failed to load files.');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  return (
    <div className="view-reports">
      <h2>📄 View Reports from S3</h2>
      {loading && <p>Loading files...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul className="report-list">
        {files.map((file, idx) => (
          <li key={idx}>
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              {file.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
