import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MsalAuthenticationTemplate } from '@azure/msal-react';
import { InteractionType } from '@azure/msal-browser';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import Reports from './components/Reports';
import Employee from './components/Employee';
import Retirement from './components/Retirement';
import Admin from './components/Admin';

import './App.css';

const CustomLoading = () => (
  <div style={{
    backgroundColor: '#0a0a0a',
    color: 'white',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <img
      src="/geolabs_logo.jpg"
      alt="GeoLabs Logo"
      style={{ width: '150px', marginBottom: '20px', borderRadius: '8px' }}
    />
    <h2 style={{ margin: 0 }}>Loading...</h2>
    <p>Signing you in with Microsoft...</p>
  </div>
);

const CustomError = ({ error }) => (
  <div style={{
    backgroundColor: '#0a0a0a',
    color: 'red',
    padding: '40px',
    minHeight: '100vh',
  }}>
    <h2>Authentication Error</h2>
    <pre>{error.message}</pre>
  </div>
);

const AuthenticatedApp = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/employee" element={<Employee />} />
          <Route path="/retirement" element={<Retirement />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
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

export default App;
