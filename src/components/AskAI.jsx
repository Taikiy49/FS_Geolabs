import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaDatabase } from 'react-icons/fa';
import '../styles/AskAI.css';
import API_URL from '../config';
import ReactMarkdown from 'react-markdown';

export default function ContextualChatbot({ selectedDB }) {
  const [conversation, setConversation] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [useCache, setUseCache] = useState(true);  const [availableDBs, setAvailableDBs] = useState([]);
  const [faqList, setFaqList] = useState([]);

  const faqMap = {
    'employee_handbook.db': [
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
      "How do I change my health insurance plan?"
    ],
    'esop.db': [
      "What is the ESOP plan?",
      "Who is eligible for the ESOP?",
      "When do ESOP shares vest?",
      "How is the ESOP payout calculated?",
      "Can I cash out my ESOP early?",
      "What happens to my ESOP when I leave the company?",
      "Where can I read more about the ESOP rules?"
    ],
    '401k.db': [
      "What is a 401(k) plan?",
      "When can I start contributing to my 401(k)?",
      "What is the company match for 401(k)?",
      "How do I change my 401(k) contribution amount?",
      "What investment options are available?",
      "When can I withdraw from my 401(k)?",
      "What happens to my 401(k) if I leave the company?"
    ]
  };

  useEffect(() => {
    axios.get(`${API_URL}/api/list-dbs`)
      .then(res => {
        const dbList = res.data.dbs || [];
        const filtered = dbList.filter(db => db !== 'chat_history.db' && db !== 'reports.db');
        setAvailableDBs(filtered);
      })
      .catch(() => setAvailableDBs([]));
  }, []);

  useEffect(() => {
    setFaqList(faqMap[selectedDB] || []);
  }, [selectedDB]);

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
        setHistory(pairs);
      })
      .catch(() => setHistory([]));

    setConversation([]);
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
        db: selectedDB,
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
      setHistory(pairs);
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
    <div className="cc-container">
      <div className="cc-sidebar">
        <div className="cc-db-row">
          <div className="cc-db-label-group">
            <FaDatabase className="cc-db-icon" />
            <div className="cc-db-readonly">{selectedDB}</div>
          </div>
          <div className="cc-toggle-inline">
            <label className="cc-toggle-switch">
              <input
                type="checkbox"
                checked={useCache}
                onChange={() => setUseCache(!useCache)}
              />
              <span className="cc-slider" />
            </label>
            <span className="cc-toggle-label-text">Cache</span>
          </div>
        </div>

        {history.length > 0 && (
  <div className="cc-chat-history">
    <div className="cc-sidebar-title">Recent Questions</div>
    {history.map((pair, i) => (
      <div
        key={i}
        className="cc-history-item"
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
)}

      </div>

      <div className="cc-main">
        <div className="cc-panel">
          <div className="cc-faq-list">
            {faqList.map((faq, i) => (
              <div
                key={i}
                onClick={(e) => handleSubmit(e, faq)}
                className="cc-faq-button"
              >
                {faq}
              </div>
            ))}
          </div>
        </div>

        <div className="cc-results-panel">
          {conversation.map((item, i) => {
            if (item.role === 'user') {
              const answer = conversation[i + 1];
              return (
                <React.Fragment key={i}>
                  <div className="cc-user-bubble">
                    <ReactMarkdown>{item.text}</ReactMarkdown>
                  </div>
                  {answer && answer.role === 'assistant' && (
                    <div className="cc-bot-bubble">
                      {answer.loading ? (
                        <span className="cc-loading-text">⏳ Thinking...</span>
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

        <form onSubmit={handleSubmit} className="cc-search-bar-bottom">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask something from ${selectedDB}...`}
            className="cc-search-input"
          />
          <button type="submit" className="cc-search-button" disabled={loading}>
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}
