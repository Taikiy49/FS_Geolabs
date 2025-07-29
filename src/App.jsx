import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MsalAuthenticationTemplate } from '@azure/msal-react';
import { InteractionType } from '@azure/msal-browser';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FileSystem from './components/FileSystem';
import HomePage from './components/HomePage';
import Reports from './components/Reports';
import ContextualChatbot from './components/ContextualChatbot';
import Admin from './components/Admin';

import './index.css'; // ← just use this one

const CustomLoading = () => (
  <div className="main-content" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
    <h2>Loading...</h2>
  </div>
);

const CustomError = ({ error }) => (
  <div className="main-content" style={{ padding: '40px', color: 'red' }}>
    <h2>Authentication Error</h2>
    <pre>{error.message}</pre>
  </div>
);

const AuthenticatedApp = () => {
  const [selectedDB, setSelectedDB] = useState('');

  return (
    <div className="app-container">
      <Header />
      <div className="app-body">
        <Sidebar selectedDB={selectedDB} setSelectedDB={setSelectedDB} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/filesystem" element={<FileSystem />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/contextualchatbot" element={<ContextualChatbot selectedDB={selectedDB} />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <MsalAuthenticationTemplate
      interactionType={InteractionType.Redirect}
      loadingComponent={CustomLoading}
      errorComponent={CustomError}
    >
      <AuthenticatedApp />
    </MsalAuthenticationTemplate>
  );
}
