import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import '../styles/OCRLookup.css';

export default function OCRLookUp() {
  const [image, setImage] = useState(null);
  const [extractedWOs, setExtractedWOs] = useState([]);
  const [editedWOs, setEditedWOs] = useState([]);
  const [projectMatches, setProjectMatches] = useState([]);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('original');
  const [sortedMatches, setSortedMatches] = useState([]); // Move sort result to state


  const applySort = () => {
  const sorted = [...projectMatches].sort((a, b) => {
    if (sortBy === 'date') return (a.date || '').localeCompare(b.date || '');
    if (sortBy === 'work_order') return (a.project_wo || '').localeCompare(b.project_wo || '');
    if (sortBy === 'pr') return (a.pr || '').localeCompare(b.pr || '');
    if (sortBy === 'client') return (a.client || '').localeCompare(b.client || '');
    if (sortBy === 'location') return (a.location || '').localeCompare(b.location || '');
    return 0;
  });
  setSortedMatches(sorted);
};


  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
    setExtractedWOs([]);
    setEditedWOs([]);
    setProjectMatches([]);
    setStep(1);
    setError('');
  };

  function normalizeWO(wo) {
  if (/[A-Za-z]$/.test(wo)) {
    const base = wo.slice(0, -1);
    const letter = wo.slice(-1);
    return `${base}(${letter})`;
  }
  return wo;
}



  const handleUpload = async () => {
    if (!image) return;
    const formData = new FormData();
    formData.append('image', image);
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_URL}/api/ocr-upload`, formData);
      let rawOutput = res.data.recognized_work_orders;

      let workOrders = [];
      if (typeof rawOutput === 'string') {
        workOrders = rawOutput
          .split('\n')
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0);
      } else if (Array.isArray(rawOutput)) {
        workOrders = rawOutput;
      }

      if (!workOrders.length) {
        setError('⚠️ No work orders found. Try another image.');
        setLoading(false);
        return;
      }

      setExtractedWOs(workOrders);
      setEditedWOs(workOrders.map(normalizeWO));

      setStep(2);
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError('Upload or extraction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const fetchProjects = async () => {
    if (editedWOs.length === 0) return;
    try {
      const res = await axios.post(
        `${API_URL}/api/lookup-work-orders`,
        JSON.stringify({ work_orders: editedWOs }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      setProjectMatches(res.data.matches);
      setSortedMatches(res.data.matches);  // Initialize with default order
    } catch (err) {
      console.error('❌ Failed to fetch projects:', err);
    }
  };

  fetchProjects();
}, [editedWOs]);


  const handleWOChange = (idx, value) => {
    const newWOs = [...editedWOs];
    newWOs[idx] = value;
    setEditedWOs(newWOs);
  };

  return (
    <div className="ocr-uploader-wrapper">
      <div className='ocr-uploader-title'>Work Order Recognition</div>

      <label htmlFor="upload" className="ocr-uploader-label">
        Upload an image containing work order numbers:
      </label>
      <div className="ocr-upload-area">
        <label htmlFor="upload" className="ocr-upload-button">
          📂 Choose Image
        </label>
        <input
          id="upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="ocr-uploader-input-hidden"
        />
        {image && <div className="ocr-upload-filename">📎 {image.name}</div>}
      </div>

      {step === 1 && image && (
        <button className="ocr-uploader-button" onClick={handleUpload}>
          ⬆️ Upload & Extract Work Orders
        </button>
      )}
      <div className="ocr-sort-bar">
  <label htmlFor="sort-select">Sort By:</label>
  <select
    id="sort-select"
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
  >
    <option value="original">Original Order</option>
    <option value="date">Date</option>
    <option value="work_order">Work Order</option>
    <option value="pr">PR Number</option>
    <option value="client">Client Name</option>
    <option value="location">Location</option>
  </select>
  <button onClick={applySort} className="ocr-sort-button">Sort</button>
</div>


      {loading && <div className="ocr-uploader-spinner">⏳ Processing...</div>}
      {error && <div className="ocr-uploader-error">{error}</div>}

      {step >= 2 && (
        <div className="ocr-uploader-edit-section">
          <div className='ocr-uploader-edit-title'>Review & Edit Extracted Work Orders</div>
          {sortedMatches.map((match, idx) => {
  const woIndex = editedWOs.findIndex(wo => wo === match.work_order || wo === match.project_wo);
  const wo = editedWOs[woIndex];

  return (
    <div className="ocr-row-container" key={idx}>
      <div className="ocr-wo-input-block">
  <input
    id={`wo-${idx}`}
    type="text"
    value={wo}
    onChange={(e) => handleWOChange(woIndex, e.target.value)}
    className="ocr-wo-input"
  />
  <div><strong>Matched WO:</strong> {match.project_wo}</div>
  <div><strong>PR:</strong> {match.pr}</div>
</div>


<div className="ocr-wo-result-block">

  <div className="ocr-result-meta">
    <div className="ocr-client-date">
      <div className="ocr-client"><strong>Client:</strong> {match.client}</div>
      <div className="ocr-date"><strong>Date:</strong> {match.date}</div>
    </div>
    <div><strong>Location:</strong> {match.location}</div>
  </div>
</div>


    </div>
  );
})}

          
        </div>
      )}
    </div>
  );
}
