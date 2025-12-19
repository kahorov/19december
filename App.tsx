import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Orders } from './views/Orders';
import { Clients } from './views/Clients';
import { Inventory } from './views/Inventory';
import { ClientRequest } from './views/ClientRequest';

type View = 'dashboard' | 'orders' | 'clients' | 'inventory' | 'client_request';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Client Request is a standalone view without the admin sidebar
  if (currentView === 'client_request') {
    return <ClientRequest onBack={() => setCurrentView('dashboard')} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <Orders />;
      case 'clients':
        return <Clients />;
      case 'inventory':
        return <Inventory />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;