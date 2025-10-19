import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazyLoadComponent as lazyLoad } from '../utils/lazyLoader';
import Layout from '../components/Layout';
import PrivateRoute from '../components/PrivateRoute';

// Lazy load components for better performance
const Login = lazyLoad(() => import('../components/Login'));
const Dashboard = lazyLoad(() => import('../components/Dashboard'));
const Products = lazyLoad(() => import('../components/Products'));
const Inventory = lazyLoad(() => import('../components/Inventory'));
const Sales = lazyLoad(() => import('../components/Sales'));
const Clients = lazyLoad(() => import('../components/Clients'));
const Suppliers = lazyLoad(() => import('../components/Suppliers'));
const Treasury = lazyLoad(() => import('../components/Treasury'));
const Production = lazyLoad(() => import('../components/Production'));
const UserManagement = lazyLoad(() => import('../components/UserManagement'));
const Settings = lazyLoad(() => import('../components/Settings'));
const Profile = lazyLoad(() => import('../components/Profile'));

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Private Routes (wrapped in Layout) */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Products */}
          <Route path="/products" element={<Products />} />
          
          {/* Inventory */}
          <Route path="/inventory" element={<Inventory />} />
          
          {/* Sales */}
          <Route path="/sales" element={<Sales />} />
          
          {/* Clients */}
          <Route path="/clients" element={<Clients />} />
          
          {/* Suppliers */}
          <Route path="/suppliers" element={<Suppliers />} />
          
          {/* Treasury */}
          <Route path="/treasury" element={<Treasury />} />
          
          {/* Production */}
          <Route path="/production" element={<Production />} />
          
          {/* User Management */}
          <Route path="/users" element={<UserManagement />} />
          
          {/* Settings */}
          <Route path="/settings" element={<Settings />} />
          
          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
          
          {/* Default route - redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch-all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
