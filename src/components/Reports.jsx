// Reports.jsx (React frontend)
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Reports.css';
import { useMsal } from '@azure/msal-react';
import { FaArrowRight } from 'react-icons/fa';
import API_URL from '../config';

function Reports() {
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username || 'guest';

  const [query, setQuery] = useState('');
  const [onlySelectedMode, setOnlySelectedMode] = useState(false);
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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [quickView, setQuickView] = useState(null);

  const clearSelectedFiles = () => setSelectedFiles([]);

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
    return matchName && (num >= min && num <= max);
  });

  const askQuestion = async (customQuery = query) => {
    if (!customQuery.trim()) return;
    setLoading(true);
    setSelectedChat(null);
    setResults(null);
    setQuickView(null);

    try {
      const numSelected = selectedFiles.length;
      const remainingToRank = onlySelectedMode ? 0 : Math.max(0, topK - numSelected);

      const rankRes = await axios.post(`${API_URL}/api/rank_only`, {
        query: customQuery,
        min: minWO === '' ? 0 : parseInt(minWO),
        max: maxWO === '' ? 99999 : parseInt(maxWO),
        top_k: remainingToRank,
        selected_files: selectedFiles,
      });

      setResults({ ranked_files: rankRes.data.ranked_files });

      const answerRes = await axios.post(`${API_URL}/api/question`, {
        query: customQuery,
        min: minWO === '' ? 0 : parseInt(minWO),
        max: maxWO === '' ? 99999 : parseInt(maxWO),
        top_k: remainingToRank,
        user: userEmail,
        selected_files: selectedFiles,
      });

      setResults(answerRes.data);
      const updated = await axios.get(`${API_URL}/api/chat_history?user=${userEmail}`);
      setChatHistory(updated.data.reverse());
    } catch (err) {
      alert('❌ Failed to get an answer from the server.');
    }
    setLoading(false);
  };

  const getQuickView = async (filename) => {
    try {
      const res = await axios.post(`${API_URL}/api/quick_view`, {
        filename,
        query,
      });
      setQuickView({ filename, snippets: res.data.snippets });
    } catch (err) {
      setQuickView(null);
    }
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
      if (isAlreadySelected) return prev.filter(f => f !== file);
      if (prev.length >= 20) {
        alert("You can only select up to 20 files.");
        return prev;
      }
      return [...prev, file];
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-history">
          {chatHistory.map((chat, i) => (
            <div className='chat-history-item' key={i} onClick={() => setSelectedChat(chat)}>
              {chat.question}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div className="filters-header">Apply filters to narrow down your file search:</div>
        <div className="filter-section">
          <input type="number" className="wo-input" value={minWO} onChange={e => setMinWO(e.target.value)} placeholder="Min WO #" />
          <input type="number" className="wo-input" value={maxWO} onChange={e => setMaxWO(e.target.value)} placeholder="Max WO #" />
          <input type="text" className="file-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by file name" />
          <div className="only-selected-toggle">
            <input type="checkbox" checked={onlySelectedMode} onChange={() => setOnlySelectedMode(prev => !prev)} />
            <label className="toggle-label">Only Selected Files</label>
          </div>
          <div className="topk-dropdown-container">
            <label className="topk-dropdown-label" htmlFor="topk-select">Rank:</label>
            <select id="topk-select" className="topk-dropdown" value={topK} onChange={(e) => setTopK(parseInt(e.target.value))} disabled={selectedFiles.length > 0}>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        </div>

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
                onClick={() => {
                  toggleFileSelection(file);
                  getQuickView(file);
                }}>
                {cleanName}
              </div>
            );
          })}
        </div>

        {selectedFiles.length > 0 && (
          <div className="selected-files-bar">
            <span>{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected.</span>
            <button className="clear-selected-btn" onClick={clearSelectedFiles}>Clear</button>
          </div>
        )}

        <div className="chat-output">
          <div className="chat-columns">
            <div className="ai-answer-section">
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
              ) : submittedQuery ? (
                <div className="ai-answer-box">
                  <div><strong>Q:</strong> {submittedQuery}</div>
                  <div className="loading-response">
                    <span className="dot-text">Generating response</span>
                    <span className="dot-anim"><span>.</span><span>.</span><span>.</span></span>
                  </div>
                </div>
              ) : results && (
                <div className="ai-answer-box">
                  <div className="chat-output-title"><strong>Q:</strong> {submittedQuery}</div>
                  <div className="chat-output-title"><strong>A:</strong> {results.answer}</div>
                </div>
              )}
              {quickView && (
                <div className="chat-output-title">
                  <strong>Quick Snippets from {quickView.filename.replace(/\.txt$/, '')}:</strong>
                  <ul>
                    {quickView.snippets.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {results?.ranked_files?.length > 0 && (
              <div className="ranked-files-side">
                <div className="ranked-header">Ranked File List</div>
                <div className="ranked-files-scroll">
                  {results.ranked_files.map((file, i) => (
                    <div key={i} className="ranked-mini-item">
                      <span className="mini-filename">{file.file.replace(/\.txt$/, '')}</span>
                      <span className="mini-score">{file.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
          <button
            className="submit-arrow"
            onClick={() => {
              const currentQuery = query.trim();
              if (currentQuery) {
                setSubmittedQuery(currentQuery);
                setQuery('');
                askQuestion(currentQuery);
              }
            }}
            disabled={loading}
          >
            <FaArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;