import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPaperPlane, FaDatabase, FaGlobe, FaBolt} from 'react-icons/fa';
import '../styles/AskAI.css';
import API_URL from '../config';
import ReactMarkdown from 'react-markdown';


export default function ContextualChatbot({ selectedDB, setSelectedDB, sidebarCollapsed }) {

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [useWeb, setUseWeb] = useState(false);
  const [useCache, setUseCache] = useState(true);
  const [conversation, setConversation] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [availableDBs, setAvailableDBs] = useState([]);
  const [faqList, setFaqList] = useState([]);
  const handleDeleteHistory = (indexToDelete) => {
  setHistory(prev => prev.filter((_, i) => i !== indexToDelete));
  // Optional: also delete from backend/db if needed
};

  
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
  const handleLoad = (e) => {
    const { question, answer } = e.detail;
    setConversation([
      { role: 'user', text: question },
      { role: 'assistant', text: answer },
    ]);
  };
  window.addEventListener('loadChatHistory', handleLoad);
  return () => window.removeEventListener('loadChatHistory', handleLoad);
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
 const handleHistoryClick = (index) => {
  const selected = history[index];
  if (selected) {
    setConversation([
      { role: 'user', text: selected.question },
      { role: 'assistant', text: selected.answer }
    ]);
    setQuery(''); // optional: clear input box
  }
};


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
        use_web: useWeb,
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
    <div className="cc-main">
      <div className="cc-results-wrapper">
        {/* Left Chat Panel */}
        <div className="cc-chat-panel">
          {/* FAQ List on Top */}
          <div className="cc-faq-list">
            {(showAllFaqs ? faqList : faqList.slice(0, 4)).map((faq, i) => (
              <div key={i} onClick={(e) => handleSubmit(e, faq)} className="cc-faq-button">
                {faq}
              </div>
            ))}
            {faqList.length > 6 && (
              <div onClick={() => setShowAllFaqs(!showAllFaqs)} className="cc-faq-button cc-faq-toggle">
                {showAllFaqs ? 'Show Less ▲' : 'Show More ▼'}
              </div>
            )}
          </div>

          {/* Chat Bubbles */}
          <div className="cc-chat-scroll">
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

          {/* Bottom Search + Toggles */}
          <div className="cc-search-bar-bottom">
            <div className="cc-bottom-controls">
              <div className="cc-toggle-inline">
                <div className="cc-toggle-icons">
                  <div
                    className={`cc-icon-toggle ${useWeb ? 'active' : ''}`}
                    onClick={() => setUseWeb(!useWeb)}
                    title="Allow General Web Knowledge"
                  >
                    <FaGlobe className="cc-icon-symbol" />
                    <div className="cc-icon-label">Web</div>
                  </div>
                  <div
                    className={`cc-icon-toggle ${useCache ? 'active' : ''}`}
                    onClick={() => setUseCache(!useCache)}
                    title="Use Cached Answers"
                  >
                    <FaBolt className="cc-icon-symbol" />
                    <div className="cc-icon-label">Cache</div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flex: 1, width: '100%' }}>
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

        {/* Right History + DB Selector Panel */}
        <div className="cc-history-panel">
          {/* DB Selector at Top with Icon */}
          <div className="cc-db-header">
            <FaDatabase className="cc-db-icon" />
            <select
              value={selectedDB}
              onChange={(e) => setSelectedDB(e.target.value)}
            >
              <option value="">Select a DB</option>
              {availableDBs.map((db, i) => (
                <option key={i} value={db}>{db}</option>
              ))}
            </select>
          </div>

          {/* History */}
          {history.map((item, index) => (
  <div
    key={index}
    className="cc-history-item"
    onClick={() => handleHistoryClick(index)}
    onContextMenu={(e) => {
  e.preventDefault();
  const confirmDelete = window.confirm("🗑️ Are you sure you want to delete this question from history?");
  if (confirmDelete) {
    handleDeleteHistory(index);
  }
}}

  >
    {item.question}
  </div>
))}

        </div>
      </div>
    </div>
  </div>
);
}