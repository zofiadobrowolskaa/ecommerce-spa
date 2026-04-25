import React from 'react';
import { useAppContext } from './context/AppContext';
import ClientLayout from './components/layout/ClientLayout';
import AdminLayout from './components/layout/AdminLayout';
import RoleSwitcher from './components/RoleSwitcher';
import ConfirmDialog from './components/ConfirmDialog';
import { Toaster } from 'react-hot-toast';
import './styles/global.scss';

// app decides only about layout selection
// routing is handled inside layouts
function App() {
  const { isAdmin } = useAppContext();

  return (
    <div className="app-container">
      <Toaster position="top-center" />
      <ConfirmDialog />
      <RoleSwitcher /> 
      
      {isAdmin ? <AdminLayout /> : <ClientLayout />}
    </div>
  );
}

export default App;