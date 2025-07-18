import React, { useState } from 'react';
import axios from 'axios';
import { FaPaperPlane } from 'react-icons/fa';

export default function Employee() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');
    setHistory([...history, { role: 'user', text: query }]);

    try {
      const res = await axios.post('/api/handbook_question', { query });
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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">📘 Employee Handbook Assistant</h1>
      <p className="text-gray-400 mb-6 text-center max-w-2xl">
        Ask any question about the employee handbook. The AI will only answer using content from the handbook.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What is the PTO policy?"
          className="flex-grow px-4 py-2 rounded bg-gray-800 text-white focus:outline-none"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center"
        >
          <FaPaperPlane className="mr-1" /> Ask
        </button>
      </form>

      {loading && <p className="text-sm text-yellow-400">⏳ Thinking...</p>}

      <div className="w-full max-w-2xl space-y-4 mt-4">
        {history.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-800 text-right' : 'bg-gray-700 text-left'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}