import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPaperPlane } from 'react-icons/fa';
import '../styles/Employee.css';
import API_URL from '../config';
import ReactMarkdown from 'react-markdown';

export default function Employee() {
  const [conversation, setConversation] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [useCache, setUseCache] = useState(true);
  const [selectedDB, setSelectedDB] = useState('handbook');
  const [availableDBs, setAvailableDBs] = useState([]);

  const faqList = [
    "What is the company's PTO policy?",
    "How do I request sick leave?",
    "Where can I find the employee benefits information?",
    "What is the dress code?",
    "How do I submit my timesheet?",
    "What are the working hours and break policies?",
    "How do I report a workplace issue or concern?",
    "What are the company’s policies on overtime pay?",
    "What holidays does the company observe?",
    "Where can I find the employee code of conduct?",
    "How do I change my health insurance plan?",
  ];

  useEffect(() => {
  axios.get(`${API_URL}/api/list-dbs`)
    .then(res => {
      const dbList = res.data.dbs || [];

      // ❌ Fix: Exclude both chat_history.db and reports.db from dropdown
      const filtered = dbList.filter(db => db !== 'chat_history.db' && db !== 'reports.db');
      setAvailableDBs(filtered);

      if (!filtered.includes(selectedDB)) {
        setSelectedDB(filtered[0] || '');
      }
    })
    .catch(() => setAvailableDBs([]));
}, []);


  useEffect(() => {
  if (!selectedDB) return;
  axios.get(`${API_URL}/api/chat_history`, {
    params: { user: "guest", db: selectedDB },
  })
    .then((res) => {
      const raw = res.data || [];
      const pairs = raw.map(row => ({
        question: row.question,
        answer: row.answer,
      }));
      setHistory(pairs.reverse());
    })
    .catch(() => setHistory([]));
}, [selectedDB]);



  const handleSubmit = async (e, optionalQuery) => {
    e.preventDefault();
    const inputQuery = optionalQuery || query;
    if (!inputQuery.trim()) return;

    setQuery('');
    setLoading(true);
    setConversation([
      { role: 'user', text: inputQuery },
      { role: 'assistant', text: '', loading: true },
    ]);

    try {
      const res = await axios.post(`${API_URL}/api/question`, {
  query: inputQuery,
  user: "guest",
  use_cache: useCache,
  db: selectedDB, // send which database to use
});



      setConversation(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', text: res.data.answer };
        return updated;
      });

      const histRes = await axios.get(`${API_URL}/api/chat_history`, {
  params: { user: "guest", db: selectedDB },
});

const raw = histRes.data || [];
const pairs = raw.map(row => ({
  question: row.question,
  answer: row.answer,
}));
setHistory(pairs.reverse());

    } catch (err) {
      console.error("❌ Error:", err);
      setConversation(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          text: '❌ Error: Failed to get a response.',
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-container">
      <div className="employee-sidebar">
        <div className="employee-chat-history">
          {history.map((pair, i) => (
            <div
              key={i}
              className="employee-history-item"
              onClick={() =>
                setConversation([
                  { role: 'user', text: pair.question },
                  { role: 'assistant', text: pair.answer },
                ])
              }
            >
              {pair.question}
            </div>
          ))}
        </div>
      </div>

      <div className="employee-main">
        <div className="employee-panel">
          {/* DB Selector */}
          <div className="employee-db-select">
            <label className="employee-db-label">Select Database:</label>
            <select
              value={selectedDB}
              onChange={(e) => setSelectedDB(e.target.value)}
              className="employee-db-dropdown"
            >
              {availableDBs.map((db, idx) => (
                <option key={idx} value={db}>{db}</option>
              ))}
            </select>
          </div>

          {/* FAQ */}
          <div className="employee-faq-list">
            {faqList.map((faq, i) => (
              <div
                key={i}
                onClick={(e) => handleSubmit(e, faq)}
                className="employee-faq-button"
              >
                {faq}
              </div>
            ))}
          </div>

          {/* Cache Toggle */}
          <div className="employee-toggle-container">
            <label className="employee-toggle-switch">
              <input
                type="checkbox"
                checked={useCache}
                onChange={() => setUseCache(!useCache)}
              />
              <span className="employee-slider" />
            </label>
            <span className="employee-toggle-label-text">Use Cached Answers</span>
          </div>
        </div>

        {/* Chat Results */}
        <div className="employee-results-panel">
          {conversation.map((item, i) => {
            if (item.role === 'user') {
              const answer = conversation[i + 1];
              return (
                <React.Fragment key={i}>
                  <div className="employee-user-bubble">
                    <ReactMarkdown>{item.text}</ReactMarkdown>
                  </div>
                  {answer && answer.role === 'assistant' && (
                    <div className="employee-chat-bubble bot-bubble">
                      {answer.loading ? (
                        <span className="employee-loading-text">⏳ Thinking...</span>
                      ) : (
                        <ReactMarkdown>{answer.text}</ReactMarkdown>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            }
            return null;
          })}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="employee-search-bar-bottom">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask something from ${selectedDB}...`}
            className="employee-search-input"
          />
          <button type="submit" className="employee-search-button" disabled={loading}>
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}
