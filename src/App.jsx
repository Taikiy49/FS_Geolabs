import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MsalAuthenticationTemplate } from '@azure/msal-react';
import { InteractionType } from '@azure/msal-browser';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FileViewer from './components/DBViewer';
import HomePage from './components/HomePage';
import AskAI from './components/AskAI';
import DBViewer from './components/DBViewer';
import DBAdmin from './components/DBAdmin';
import S3Admin from './components/S3Admin';
import OCRLookUp from './components/OCRLookup';
import Contacts from './components/Contacts';

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
            <Route path="/ask-ai" element={<AskAI selectedDB={selectedDB} />} />
            <Route path="/db-viewer" element={<DBViewer />} />
            <Route path="/db-admin" element={<DBAdmin />} />
            <Route path="/file-viewer" element={<FileViewer />} />
            <Route path="/s3-admin" element={<S3Admin />} />
            <Route path="/ocr-lookup" element={<OCRLookUp />} />
            <Route path="/contacts" element={<Contacts />} />
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
