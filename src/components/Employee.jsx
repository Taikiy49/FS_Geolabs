// Employee.jsx
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
  axios.get(`${API_URL}/api/handbook_chat_history?user=guest`)
    .then(res => {
      const raw = res.data;
      const pairs = [];
      for (let i = 0; i < raw.length - 1; i++) {
        if (raw[i].role === 'user' && raw[i + 1].role === 'assistant') {
          pairs.push({ question: raw[i].text, answer: raw[i + 1].text });
        }
      }
      setHistory(pairs); // newest first
    })
    .catch(() => setHistory([]));
}, []);


  const handleSubmit = async (e, optionalQuery) => {
  e.preventDefault();
  const inputQuery = optionalQuery || query;
  if (!inputQuery.trim()) return;

  setQuery('');

  // Step 1: Set user message and bot placeholder
  setConversation([
    { role: 'user', text: inputQuery },
    { role: 'assistant', text: '', loading: true },
  ]);

  try {
    
  const res = await axios.post(`${API_URL}/api/handbook_question`, {
  query: inputQuery,
  user: "guest",
  use_cache: useCache, // ✅ Include the state value here
});



  setConversation(prev => {
    const updated = [...prev];
    updated[updated.length - 1] = { role: 'assistant', text: res.data.answer };
    return updated;
  });

  const updated = await axios.get(`${API_URL}/api/handbook_chat_history?user=guest`);
const raw = updated.data;
const pairs = [];
for (let i = 0; i < raw.length - 1; i++) {
  if (raw[i].role === 'user' && raw[i + 1].role === 'assistant') {
    pairs.push({ question: raw[i].text, answer: raw[i + 1].text });
  }
}
setHistory(pairs);

} catch (err) {
  console.error("❌ Handbook error:", err);
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
    <div className="employee-container">
      <div className="employee-sidebar">
        <h2 className="employee-sidebar-title">Chat History</h2>
        <div className="chat-history">
          {history.map((pair, i) => (
  <div
    key={i}
    className="employee-history-item"
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

      <div className="employee-main">

        <div className="faq-list">
          {faqList.map((faq, i) => (
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
            // Only render when item is a user message, followed by an assistant message
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


        <form onSubmit={handleSubmit} className="employee-search-bar-bottom">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question about the handbook..."
            className="employee-search-input"
          />
          <button type="submit" className="employee-search-button">
            <FaPaperPlane className="icon" />
          </button>
        </form>
      </div>
    </div>
  );
}
