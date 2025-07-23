// Retirement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPaperPlane } from 'react-icons/fa';
import '../styles/Retirement.css';
import API_URL from '../config';
import ReactMarkdown from 'react-markdown';

export default function Retirement() {
  const [view, setView] = useState('esop');
  const [conversation, setConversation] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [useCache, setUseCache] = useState(true);

  const faqMap = {
    esop: [
      "What is the ESOP?",
      "How do I become eligible for the ESOP?",
      "When do I receive my ESOP shares?",
      "How is the ESOP value calculated?",
      "Can I transfer my ESOP shares?",
      "What happens to my ESOP if I leave the company?",
      "Is there a vesting period for ESOP shares?",
      "How do I view my ESOP balance?",
      "What are the tax implications of ESOP?",
      "Can I cash out my ESOP shares early?"
    ],
    four01k: [
      "What is a 401K plan?",
      "How much can I contribute to my 401K?",
      "Does the company offer matching contributions?",
      "When can I withdraw from my 401K?",
      "What are the penalties for early withdrawal?",
      "How do I change my 401K contribution amount?",
      "What investment options are available?",
      "How do I access my 401K account?",
      "Is my 401K portable if I leave the company?",
      "Are there any fees associated with the 401K plan?"
    ]
  };

  useEffect(() => {
    axios.get(`${API_URL}/api/${view}_chat_history?user=guest`)
      .then(res => {
        const raw = res.data;
        const pairs = [];
        for (let i = 0; i < raw.length - 1; i++) {
          if (raw[i].role === 'user' && raw[i + 1].role === 'assistant') {
            pairs.push({ question: raw[i].text, answer: raw[i + 1].text });
          }
        }
        setHistory(pairs);
      })
      .catch(() => setHistory([]));
  }, [view]);

  const handleSubmit = async (e, optionalQuery) => {
    e.preventDefault();
    const inputQuery = optionalQuery || query;
    if (!inputQuery.trim()) return;

    setQuery('');
    setConversation([
      { role: 'user', text: inputQuery },
      { role: 'assistant', text: '', loading: true },
    ]);

    try {
      const res = await axios.post(`${API_URL}/api/${view}_question`, {
        query: inputQuery,
        user: "guest",
        use_cache: useCache,
      });

      setConversation(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', text: res.data.answer };
        return updated;
      });

      const updated = await axios.get(`${API_URL}/api/${view}_chat_history?user=guest`);
      const raw = updated.data;
      const pairs = [];
      for (let i = 0; i < raw.length - 1; i++) {
        if (raw[i].role === 'user' && raw[i + 1].role === 'assistant') {
          pairs.push({ question: raw[i].text, answer: raw[i + 1].text });
        }
      }
      setHistory(pairs);
    } catch (err) {
      console.error("❌ Retirement error:", err);
      setConversation(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', text: '❌ Error: Failed to get a response.' };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="retirement-container">
      <div className="retirement-sidebar">
        <h2 className="retirement-sidebar-title">Chat History</h2>
        <div className="chat-history">
          {history.map((pair, i) => (
            <div
              key={i}
              className="retirement-history-item"
              onClick={() => {
                setConversation([
                  { role: 'user', text: pair.question },
                  { role: 'assistant', text: pair.answer },
                ]);
              }}
            >
              {pair.question}
            </div>
          ))}
        </div>
      </div>

      <div className="retirement-main">
        <div className="retirement-toggle-container">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={view === 'four01k'}
              onChange={() => setView(view === 'esop' ? 'four01k' : 'esop')}
            />
            <span className="slider" />
          </label>
          <span className="toggle-label-text">
            {view === 'esop' ? 'Viewing ESOP Info' : 'Viewing 401K Info'}
          </span>
        </div>

        <div className="faq-list">
          {faqMap[view].map((faq, i) => (
            <button key={i} onClick={(e) => handleSubmit(e, faq)} className="faq-button">{faq}</button>
          ))}
        </div>

        <div className="toggle-container">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={useCache}
              onChange={() => setUseCache(!useCache)}
            />
            <span className="slider" />
          </label>
          <span className="toggle-label-text">Use Cached Answers</span>
        </div>

        <div className="results-panel">
          {conversation.map((item, i) => {
            if (item.role === 'user') {
              const answer = conversation[i + 1];
              return (
                <React.Fragment key={i}>
                  <div className="chat-bubble user-bubble">
                    <ReactMarkdown>{item.text}</ReactMarkdown>
                  </div>
                  {answer && answer.role === 'assistant' && (
                    <div className="chat-bubble bot-bubble">
                      {answer.loading ? (
                        <span className="loading-text">⏳ Thinking...</span>
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

        <form onSubmit={handleSubmit} className="retirement-search-bar-bottom">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Type your question about ${view === 'esop' ? 'ESOP' : '401K'}...`}
            className="retirement-search-input"
          />
          <button type="submit" className="retirement-search-button">
            <FaPaperPlane className="icon" />
          </button>
        </form>
      </div>
    </div>
  );
}
