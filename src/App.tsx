import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import EventDetailPage from './components/EventDetailPage';
import LoginPage from './components/LoginPage';
import OrganizerDashboard from './components/OrganizerDashboard';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleNavigate = (page: string, eventId?: string) => {
    setCurrentPage(page);
    if (eventId) {
      setSelectedEventId(eventId);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'event':
        return selectedEventId ? (
          <EventDetailPage eventId={selectedEventId} onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <OrganizerDashboard onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
          <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
          {renderPage()}
          <Footer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
