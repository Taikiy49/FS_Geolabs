// Reports.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Reports.css';
import { useMsal } from '@azure/msal-react';
import { FaArrowRight } from 'react-icons/fa';
import API_URL from '../config';

function Reports() {
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username || 'guest';

  const [rankQuery, setRankQuery] = useState('');
  const [questionQuery, setQuestionQuery] = useState('');

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
  const [rankedOnly, setRankedOnly] = useState([]);

  const clearSelectedFiles = () => setSelectedFiles([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/files`).then(res => setFiles(res.data));
    axios.get(`${API_URL}/api/chat_history?user=${userEmail}`).then(res => setChatHistory(res.data));
  }, [userEmail]);

  const filteredFiles = files.filter(file => {
    const matchName = file.toLowerCase().includes(searchTerm.toLowerCase());
    const woMatch = file.match(/(\d{4,5})/);
    const num = woMatch ? parseInt(woMatch[1]) : 0;
    const min = minWO === '' ? -Infinity : parseInt(minWO);
    const max = maxWO === '' ? Infinity : parseInt(maxWO);
    return matchName && (num >= min && num <= max);
  });

  const rankFiles = async (customQuery = query) => {
    if (!customQuery.trim()) return;
    setLoading(true);
    setSelectedChat(null);
    setResults(null);
    setQuickView(null);

    try {
      const res = await axios.post(`${API_URL}/api/rank_only`, {
        query: customQuery,
        min: minWO === '' ? 0 : parseInt(minWO),
        max: maxWO === '' ? 99999 : parseInt(maxWO),
        user: userEmail
      });
      setRankedOnly(res.data.ranked_files);
      setSubmittedQuery(customQuery);
    } catch (err) {
      alert('\u274C Failed to rank files.');
    }
    setLoading(false);
  };

  const getAnswerFromFile = async (filename) => {
    if (!submittedQuery || !filename) {
      alert("\u274C Missing filename or question.");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/single_file_answer`, {
        file: filename,
        query: submittedQuery,
        user: userEmail,
      });

      setResults({
        ...res.data,
        file: filename
      });

      const updated = await axios.get(`${API_URL}/api/chat_history?user=${userEmail}`);
      setChatHistory(updated.data.reverse());
    } catch (err) {
      alert('\u274C Failed to get response from Gemini.');
    }
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
        <div className="sidebar-title">Chat History</div>
        <div className="chat-history">
          {chatHistory.map((item, index) => (
            <div
              key={index}
              className="chat-history-item"
              onClick={() => {
                setSubmittedQuery(item.query);
                setResults({
                  answer: item.answer,
                  file: item.file
                });
              }}
            >
              {item.query}
            </div>
          ))}
        </div>
      </div>

      <div className="file-selector-panel">
        <div className="filter-section">
          <input className='wo-input' type="number" value={minWO} onChange={e => setMinWO(e.target.value)} placeholder="Min WO#" />
          <input className='wo-input' type="number" value={maxWO} onChange={e => setMaxWO(e.target.value)} placeholder="Max WO#" />
          <input className='file-input' type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search file name" />
        </div>
        <div className="file-list-scroll">
          {filteredFiles.map((file, idx) => (
            <div
              key={idx}
              className={`file-card-no-border ${selectedFiles.includes(file) ? 'selected-file' : ''}`}
              onClick={() => {
                toggleFileSelection(file);
                getQuickView(file);
              }}>
              {file.replace(/\.txt$/, '')}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-panel">
        <div className="chat-columns">
          <div className="ai-answer-section">
            <input
              className="chatbot-keywords-input"
              placeholder="Enter keywords to rank files..."
              value={rankQuery}
              onChange={e => setRankQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  rankFiles(rankQuery.trim());
                }
              }}
            />

            <textarea
              className="chatbot-input"
              placeholder="Ask a question for a specific file..."
              value={questionQuery}
              onChange={e => setQuestionQuery(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const cleanQuery = questionQuery.trim();
                  if (!cleanQuery) return;

                  const activeFile = selectedFiles[0] || results?.file;
                  if (!activeFile) {
                    alert("\u274C Please select a file first.");
                    return;
                  }

                  try {
                    const res = await axios.post(`${API_URL}/api/single_file_answer`, {
                      file: activeFile,
                      query: cleanQuery,
                      user: userEmail,
                    });

                    setResults({
                      answer: res.data.answer,
                      file: activeFile,
                    });
                    setSubmittedQuery(cleanQuery);

                    const updated = await axios.get(`${API_URL}/api/chat_history?user=${userEmail}`);
                    setChatHistory(updated.data.reverse());
                  } catch (err) {
                    alert('\u274C Failed to get response.');
                  }

                  setQuestionQuery('');
                }
              }}
            />
            <div className="chat-output">
  {submittedQuery && results?.answer ? (
    <>
      <div><strong>Question:</strong> {submittedQuery}</div>
      <div><strong>Answer:</strong> {results.answer}</div>
      <div><strong>Source:</strong> {results.file}</div>
    </>
  ) : (
    <div className="chat-placeholder">Select a ranked file and ask a question to see the answer.</div>
  )}
</div>

          </div>

          <div className="ranked-files-side">
            <div className="ranked-header">Ranked Files</div>
            <div className="ranked-files-scroll">
              {rankedOnly.map((item, idx) => (
                <div
                  key={idx}
                  className="ranked-mini-item"
                  onClick={() => getAnswerFromFile(item.file)}
                >
                  <div className="mini-filename">{item.file.replace(/\.txt$/, '')}</div>
                  <div className="mini-score">{item.score.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;