import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import AddSales from './components/AddSales';
import Inventory from './components/Inventory';
import SalesHistory from './components/SalesHistory';
import StatisticalReport from './components/StatisticalReport';
import Settings from './components/Settings';
import { seedDatabase } from './db/database';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      await seedDatabase();
    } catch (error) {
      console.error('Error initializing database:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">Weak Inventory</h2>
          <p className="text-slate-400">Initializing database...</p>
          <div className="mt-6 w-48 h-1 bg-slate-700 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'add-sales':
        return <AddSales />;
      case 'inventory':
        return <Inventory />;
      case 'sales':
        return <SalesHistory />;
      case 'reports':
        return <StatisticalReport />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}
