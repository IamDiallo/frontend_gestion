import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';

// Import our custom ThemeProvider instead of MUI's ThemeProvider
import { ThemeProvider } from './contexts/ThemeContext';
import { PermissionProvider } from './context/PermissionContext';

// Components
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import Clients from './components/Clients';
import Products from './components/Products';
import Suppliers from './components/Suppliers';
import Production from './components/Production';
import Treasury from './components/Treasury';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import PrivateRoute from './components/PrivateRoute';
import Inventory from './components/Inventory';
import Profile from './components/Profile';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <PermissionProvider>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
              {/* Protected routes with Layout */}
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="sales" element={<Sales />} />
                <Route path="clients" element={<Clients />} />
                <Route path="products" element={<Products />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="production" element={<Production />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="treasury" element={<Treasury />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                
                {/* Redirect any unknown routes to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </PermissionProvider>
    </ThemeProvider>
  );
};

export default App;
