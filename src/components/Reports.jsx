import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Reports.css';
import { useMsal } from '@azure/msal-react';
import { FaArrowRight } from 'react-icons/fa';
import API_URL from '../config'; // ✅ Dynamic API endpoint

function Reports() {
  const { accounts } = useMsal();
  const userEmail = accounts[0]?.username || "guest";

  const [query, setQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [minWO, setMinWO] = useState(1000);
  const [maxWO, setMaxWO] = useState(99999);
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [filterWO, setFilterWO] = useState(false);
  const [filterFile, setFilterFile] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/files`)
      .then(res => setFiles(res.data));
    axios.get(`${API_URL}/api/chat_history?user=${userEmail}`)
      .then(res => setChatHistory(res.data.reverse()));
  }, [userEmail]);

  const filteredFiles = files.filter(file => {
    const matchName = file.toLowerCase().includes(searchTerm.toLowerCase());
    const woMatch = file.match(/(\d{4,5})/);
    const num = woMatch ? parseInt(woMatch[1]) : 0;
    return (!filterFile || matchName) && (!filterWO || (num >= minWO && num <= maxWO));
  });

  const askQuestion = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/question`, {
        query,
        min: minWO,
        max: maxWO,
        top_k: topK,
        user: userEmail
      });
      setResults(res.data);
      const updated = await axios.get(`${API_URL}/api/chat_history?user=${userEmail}`);
      setChatHistory(updated.data.reverse());
      setQuery('');
    } catch (err) {
      alert("❌ Failed to get an answer from the server.");
    }
    setLoading(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <ul className="chat-history">
          {chatHistory.map((chat, i) => (
            <li key={i} onClick={() => setSelectedChat(chat)}>
              <strong>Q:</strong> {chat.question}<br />
              <strong>A:</strong> {chat.answer.slice(0, 120)}...
            </li>
          ))}
        </ul>
      </div>

      <div className="chat-main">
        <div className="filter-section">
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={filterWO}
              onChange={() => setFilterWO(!filterWO)}
            />
            Filter by Work Order
          </label>
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={filterFile}
              onChange={() => setFilterFile(!filterFile)}
            />
            Filter by File Name
          </label>
        </div>

        {(filterWO || filterFile) && (
          <div className="filters">
            <input
              type="number"
              className="wo-input"
              value={minWO}
              onChange={e => setMinWO(Math.max(1, Math.floor(Number(e.target.value))))}
              placeholder="Min (e.g., 1000)"
            />
            <input
              type="number"
              className="wo-input"
              value={maxWO}
              onChange={e => setMaxWO(Math.max(1, Math.floor(Number(e.target.value))))}
              placeholder="Max (e.g., 99999)"
            />
            <input
              type="number"
              className="topk-input"
              value={topK}
              onChange={e => setTopK(Math.max(1, Number(e.target.value)))}
              max={30}
              placeholder="Top K"
            />
          </div>
        )}

        <div className="file-list-scroll">
          {filteredFiles.map((file, idx) => (
            <div className="file-card-no-border" key={idx}>
              {file.replace(/\.txt$/, '')}
            </div>
          ))}
        </div>

        <div className="chat-output">
          {selectedChat ? (
            <div className="ai-answer-box">
              <div>{selectedChat.answer}</div>
              <div>
                <h4><strong>Re: {selectedChat.question}</strong></h4>
              </div>
            </div>
          ) : results && (
            <div className="ai-answer-box">
              <div>{results.answer}</div>
              <div>
                <h4>Sources:</h4>
                <ul className="sources-list">
                  {results.sources.map((file, i) => (
                    <li key={i}><a href={`#${file}`}>{file.replace(/\.txt$/, '')}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-bar">
          <div className="chat-input-label">
            <textarea
              className="chatbot-input"
              placeholder="Ask a question..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>
          <button className="submit-arrow" onClick={askQuestion} disabled={loading}>
            <FaArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;
