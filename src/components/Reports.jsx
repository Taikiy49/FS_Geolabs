import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Reports.css';
import { useMsal } from '@azure/msal-react';
import { FaArrowRight } from 'react-icons/fa';
import API_URL from '../config';

function Reports() {
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username || "guest";

  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [minWO, setMinWO] = useState('');
  const [maxWO, setMaxWO] = useState('');
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [filterWO, setFilterWO] = useState(false);
  const [filterFile, setFilterFile] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const clearSelectedFiles = () => {
  setSelectedFiles([]);
};


  useEffect(() => {
    axios.get(`${API_URL}/api/files`).then(res => setFiles(res.data));
    axios.get(`${API_URL}/api/chat_history?user=${userEmail}`).then(res => setChatHistory(res.data.reverse()));
  }, [userEmail]);

  const filteredFiles = files.filter(file => {
    const matchName = file.toLowerCase().includes(searchTerm.toLowerCase());
    const woMatch = file.match(/(\d{4,5})/);
    const num = woMatch ? parseInt(woMatch[1]) : 0;
    const min = minWO === '' ? -Infinity : parseInt(minWO);
    const max = maxWO === '' ? Infinity : parseInt(maxWO);
    return (!filterFile || matchName) && (!filterWO || (num >= min && num <= max));
  });

  const askQuestion = async (customQuery = query) => {
    if (!customQuery.trim()) return;
    setLoading(true);
    setSelectedChat(null);

    try {
      const numSelected = selectedFiles.length;
      const remainingToRank = Math.max(0, topK - numSelected);

      const res = await axios.post(`${API_URL}/api/question`, {
        query: customQuery,
        min: minWO === '' ? 0 : parseInt(minWO),
        max: maxWO === '' ? 99999 : parseInt(maxWO),
        top_k: remainingToRank,
        user: userEmail,
        selected_files: selectedFiles, // 👈 Pass these to the backend
      });

      setResults(res.data);
      const updated = await axios.get(`${API_URL}/api/chat_history?user=${userEmail}`);
      setChatHistory(updated.data.reverse());
    } catch (err) {
      alert("❌ Failed to get an answer from the server.");
    }
    setLoading(false);
  };


  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const currentQuery = query.trim();
      if (currentQuery) {
        setSubmittedQuery(currentQuery);
        setQuery('');
        askQuestion(currentQuery);
      }
    }
  };

  const toggleFileSelection = (file) => {
  setSelectedFiles(prev => {
    const isAlreadySelected = prev.includes(file);

    if (isAlreadySelected) {
      return prev.filter(f => f !== file); // Remove it if already selected
    }

    // If adding this would exceed topK, do nothing
    if (prev.length >= topK) {
      alert(`You can only select up to ${topK} file${topK > 1 ? 's' : ''} for ranking.`);
      return prev;
    }

    return [...prev, file]; // Add the new file
  });
};


  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-title">Personal History</div>
        <div className="chat-history">
          {chatHistory.map((chat, i) => (
            <div className='chat-history-item' key={i} onClick={() => setSelectedChat(chat)}>
              {chat.question}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div className="filters-header">Select filters to narrow down your file search:</div>

        <div className="filter-section">
          <label className="filter-toggle">
            <input type="checkbox" checked={filterWO} onChange={() => setFilterWO(!filterWO)} /> Work Order Range
          </label>
          <label className="filter-toggle">
            <input type="checkbox" checked={filterFile} onChange={() => setFilterFile(!filterFile)} /> File Name
          </label>
          <div className="topk-dropdown-container">
            <label className="topk-dropdown-label" htmlFor="topk-select">Rank:</label>
            <select
              id="topk-select"
              className="topk-dropdown"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        </div>

        {(filterWO || filterFile) && (
          <div className="filters">
            {filterWO && (
              <>
                <input type="number" className="wo-input" value={minWO} onChange={e => setMinWO(e.target.value)} placeholder="Min WO #" />
                <input type="number" className="wo-input" value={maxWO} onChange={e => setMaxWO(e.target.value)} placeholder="Max WO #" />
              </>
            )}
            {filterFile && (
              <input type="text" className="file-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by file name" />
            )}
          </div>
        )}

        <div className="file-list-scroll">
          {filteredFiles.map((file, idx) => {
            const cleanName = file.replace(/\.txt$/, '');
            const isSelected = selectedFiles.includes(file);
            const isDisabled = !isSelected && selectedFiles.length >= topK;

            return (
              <div
                className={`file-card-no-border ${isSelected ? 'selected-file' : ''} ${isDisabled ? 'disabled-file' : ''}`}
                key={idx}
                title={cleanName}
                onClick={() => !isDisabled && toggleFileSelection(file)}
              >
                {cleanName}
              </div>
            );
          })}

        </div>

        {selectedFiles.length > 0 && (
  <div className="selected-files-bar">
    <span>
      {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected.
    </span>
    <button className="clear-selected-btn" onClick={clearSelectedFiles}>
      Clear
    </button>
  </div>
)}


        <div className="chat-output">
          {selectedChat ? (
            <div className="ai-answer-box">
              <div><strong>Question:</strong></div> {selectedChat.question}
              <div className="chatbot-output-title"><strong>Answer:</strong></div> {selectedChat.answer}
              {selectedChat.sources?.length > 0 && (
                <div>
                  <div className="chatbot-output-title"><strong>Sources:</strong></div>
                  <ul className="sources-list">
                    {selectedChat.sources.map((src, i) => (
                      <li key={i}><a href={`#${src}`}>{src.replace(/\.txt$/, '')}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : loading && submittedQuery ? (
            <div className="ai-answer-box">
              <h4><strong>Q:</strong> {submittedQuery}</h4>
              <div className="loading-response">
                <span className="dot-text">Generating response</span>
                <span className="dot-anim"><span>.</span><span>.</span><span>.</span></span>
              </div>
            </div>
          ) : results && (
            <div className="ai-answer-box">
              <div className='chat-output-title'><strong>Q:</strong> {submittedQuery}</div>
              <div className='chat-output-title'><strong>A:</strong> {results.answer}</div>
              {results.sources?.length > 0 && (
                <div>
                  <div><strong>Sources:</strong></div>
                  <ul className="sources-list">
                    {results.sources.map((file, i) => (
                      <li key={i}><a href={`#${file}`}>{file.replace(/\.txt$/, '')}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="chat-input-bar">
          <textarea
            className="chatbot-input"
            placeholder="Ask a question about the reports..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button className="submit-arrow" onClick={() => {
            const currentQuery = query.trim();
            if (currentQuery) {
              setSubmittedQuery(currentQuery);
              setQuery('');
              askQuestion(currentQuery);
            }
          }} disabled={loading}>
            <FaArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;
