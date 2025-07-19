import React, { useState } from 'react';
import axios from 'axios';
import { FaPaperPlane } from 'react-icons/fa';
import '../styles/Employee.css';

export default function Employee() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const faqList = [
    "What is the company's PTO policy?",
    'How do I request sick leave?',
    'Where can I find the employee benefits information?',
    'What is the dress code?',
    'How do I submit my timesheet?',
  ];

  const handleFAQClick = (q) => {
    setQuery(q);
    handleSubmit({ preventDefault: () => {} }, q);
  };

  const handleSubmit = async (e, optionalQuery) => {
    e.preventDefault();
    const inputQuery = optionalQuery || query;
    if (!inputQuery.trim()) return;
    setLoading(true);
    setResponse('');
    setHistory([...history, { role: 'user', text: inputQuery }]);

    try {
      const res = await axios.post('/api/handbook_question', { query: inputQuery });
      setResponse(res.data.answer);
      setHistory((prev) => [...prev, { role: 'assistant', text: res.data.answer }]);
    } catch (err) {
      setResponse('❌ Error: Failed to get a response.');
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  return (
    <div className="employee-container">
      <div className="filters-bar">
        <h1 className="employee-title">📘 Employee Handbook Assistant</h1>
        <p className="employee-subtitle">Ask a question about the handbook, or click a frequently asked question below:</p>
        <div className="faq-list">
          {faqList.map((faq, idx) => (
            <button
              key={idx}
              onClick={() => handleFAQClick(faq)}
              className="faq-button"
            >
              {faq}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="employee-search-bar">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. How do I request time off?"
            className="employee-search-input"
          />
          <button type="submit" className="employee-search-button">
            <FaPaperPlane className="icon" />
          </button>
        </form>
        {loading && <p className="loading-text">⏳ Thinking...</p>}
      </div>

      <div className="results-panel">
        {history.map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}
