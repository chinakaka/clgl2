
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import UserDashboard from './pages/user/UserDashboard';
import CreateRequest from './pages/user/CreateRequest';
import UserRequestDetail from './pages/user/UserRequestDetail';
import UserProfile from './pages/user/UserProfile';
import UserReimbursement from './pages/user/UserReimbursement';
import AdminWorkbench from './pages/admin/AdminWorkbench';
import AdminStats from './pages/admin/AdminStats';
import AdminRequestDetail from './pages/admin/AdminRequestDetail';
import AdminReimbursement from './pages/admin/AdminReimbursement';
import { User, Role } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (u: User) => {
    setUser(u);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {/* Public Route */}
          <Route
            path="/login"
            element={!user ? <Auth onLogin={handleLogin} /> : <Navigate to={user.role === Role.ADMIN ? "/admin/workbench" : "/user/dashboard"} />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/*"
            element={
              user && user.role === Role.ADMIN ? (
                <Routes>
                  <Route path="workbench" element={<AdminWorkbench user={user} />} />
                  <Route path="stats" element={<AdminStats user={user} />} />
                  <Route path="reimbursements" element={<AdminReimbursement user={user} />} />
                  <Route path="request/:id" element={<AdminRequestDetail user={user} />} />
                  <Route path="*" element={<Navigate to="workbench" />} />
                </Routes>
              ) : <Navigate to="/login" />
            }
          />

          {/* Protected User Routes */}
          <Route
            path="/user/*"
            element={
              user && user.role === Role.USER ? (
                <Routes>
                  <Route path="dashboard" element={<UserDashboard user={user} />} />
                  <Route path="create" element={<CreateRequest user={user} />} />
                  <Route path="edit/:id" element={<CreateRequest user={user} />} />
                  <Route path="request/:id" element={<UserRequestDetail user={user} />} />
                  <Route path="reimbursements" element={<UserReimbursement user={user} />} />
                  <Route path="profile" element={<UserProfile user={user} />} />
                  <Route path="*" element={<Navigate to="dashboard" />} />
                </Routes>
              ) : <Navigate to="/login" />
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
