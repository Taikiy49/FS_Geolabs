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

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
    setExtractedWOs([]);
    setEditedWOs([]);
    setProjectMatches([]);
    setStep(1);
    setError('');
  };

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
      setEditedWOs(workOrders);
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
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
        const matches = editedWOs.map(wo => {
          const match = res.data.matches.find(m => m.work_order === wo);
          return {
            work_order: wo,
            project_name: match ? match.project_name : '❓ Not Found',
          };
        });
        setProjectMatches(matches);
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

      {loading && <div className="ocr-uploader-spinner">⏳ Processing...</div>}
      {error && <div className="ocr-uploader-error">{error}</div>}

      {step >= 2 && (
        <div className="ocr-uploader-edit-section">
          <div className='ocr-uploader-edit-title'>Review & Edit Extracted Work Orders</div>
          {editedWOs.map((wo, idx) => (
            <div className="ocr-uploader-input-field" key={idx}>
              <label htmlFor={`wo-${idx}`}>{idx + 1}:</label>
              <input
                id={`wo-${idx}`}
                type="text"
                value={wo}
                onChange={(e) => handleWOChange(idx, e.target.value)}
              />
              <div className="ocr-uploader-result-item">
                <div>↪ {projectMatches[idx]?.project_name || 'Checking...'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
