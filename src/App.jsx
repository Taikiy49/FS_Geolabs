import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MsalAuthenticationTemplate } from '@azure/msal-react';
import { InteractionType } from '@azure/msal-browser';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';


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
import S3Viewer from './components/S3Viewer';
import DisclaimerModal from './components/DisclaimerModal';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'instant' }); // or 'smooth'
    }
  }, [pathname]);

  return null;
}



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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userAcceptedDisclaimer, setUserAcceptedDisclaimer] = useState(false);

  const location = useLocation();

  const showingAskAI = location.pathname === '/ask-ai';

  return (
    <div className="app-container">
      <Header />
      <div className="app-body">
        <Sidebar
          selectedDB={selectedDB}
          setSelectedDB={setSelectedDB}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <main className="main-content">
          <ScrollToTop />

          {showingAskAI && !userAcceptedDisclaimer && (
            <DisclaimerModal
              onContinue={() => setUserAcceptedDisclaimer(true)}
              onCancel={() => window.history.back()}
            />
          )}

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/ask-ai"
              element={
                userAcceptedDisclaimer ? (
                  <AskAI
                    selectedDB={selectedDB}
                    setSelectedDB={setSelectedDB}
                    sidebarCollapsed={sidebarCollapsed}
                  />
                ) : (
                  <div /> // Empty placeholder until modal handled
                )
              }
            />
            <Route path="/db-viewer" element={<DBViewer />} />
            <Route path="/db-admin" element={<DBAdmin />} />
            <Route path="/file-viewer" element={<FileViewer />} />
            <Route path="/s3-admin" element={<S3Admin />} />
            <Route path="/ocr-lookup" element={<OCRLookUp />} />
            <Route path="/s3-viewer" element={<S3Viewer />} />
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
