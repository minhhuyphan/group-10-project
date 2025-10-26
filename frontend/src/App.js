import React, { useState, useEffect } from "react";
import "./App.css";
import UserList from "./UserList";
import AddUser from "./AddUser";
import SignUp from "./SignUp";
import Login from "./Login";
import Profile from "./Profile";
import ProfilePage from "./ProfilePage";
import AdminUsers from './AdminUsers';
import AdminLogs from './AdminLogs';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import UploadAvatar from './UploadAvatar';
import ProtectedRoute from './components/ProtectedRoute';
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutThunk, refreshUserThunk, restoreAuth } from "./store/authSlice";
import { getAccessToken, getRefreshToken } from "./api";

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, initializing } = useSelector((state) => state.auth);
  const [showLogin, setShowLogin] = useState(true);

  // Restore auth from localStorage on mount
  useEffect(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    const storedUser = localStorage.getItem('user');
    
    if (accessToken) {
      // Restore state from localStorage
      dispatch(restoreAuth({
        accessToken,
        refreshToken,
        user: storedUser ? JSON.parse(storedUser) : null,
      }));
      
      // Refresh user info from server
      dispatch(refreshUserThunk());
    }
  }, [dispatch]);

  // Persist user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Function to trigger refresh of user list
  const handleUserAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Function to handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleLogout = () => {
    dispatch(logoutThunk());
    navigate("/");
  };

  return (
    <div className="App">
      <header className={`App-header ${!isAuthenticated ? "center-header" : ""}`}>
        <h1>Quản lý người dùng</h1>
        {isAuthenticated && user && (
          <nav style={{ display: "flex", gap: 10 }}>
            <Link to="/profile" className="btn btn-ghost">
              Profile
            </Link>
            <Link to="/upload-avatar" className="btn btn-ghost">
              Upload Avatar
            </Link>
            {user.role === 'admin' && (
              <>
                <Link to="/admin/users" className="btn btn-ghost">Admin</Link>
                <Link to="/admin/logs" className="btn btn-ghost">Logs</Link>
              </>
            )}
          </nav>
        )}
      </header>

      <main className="App-main">
        <div className={`container ${!isAuthenticated ? "center-vert" : ""}`}>
          <Routes>
            {/* Public routes - MUST be before the "/" catch-all */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/login" element={
              <div className="auth-forms">
                <div className="section card">
                  <Login onSwitchToSignUp={() => setShowLogin(false)} />
                </div>
              </div>
            } />
            <Route path="/signup" element={
              <div className="auth-forms">
                <div className="section card">
                  <SignUp onSwitchToLogin={() => setShowLogin(true)} />
                </div>
              </div>
            } />
            
            {/* Protected routes - Activity 6 */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
              <ProtectedRoute requireAdmin>
                <AdminLogs />
              </ProtectedRoute>
            } />
            <Route path="/upload-avatar" element={
              <ProtectedRoute>
                <UploadAvatar />
              </ProtectedRoute>
            } />
            
            {/* Home route - catch-all LAST */}
            <Route
              path="/"
              element={
                initializing ? (
                  <div className="center-vert" style={{ minHeight: '60vh' }}>
                    <div className="card">Loading...</div>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="auth-forms">
                    <div className="section card">
                      {showLogin ? (
                        <Login onSwitchToSignUp={() => setShowLogin(false)} />
                      ) : (
                        <SignUp onSwitchToLogin={() => setShowLogin(true)} />
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="profile">
                      <h2>Welcome, {user?.name || user?.email}</h2>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <button
                          onClick={handleLogout}
                          className="btn btn-ghost"
                        >
                          Logout
                        </button>
                      </div>
                    </div>

                    <div className="section">
                      <AddUser
                        onUserAdded={handleUserAdded}
                        editingUser={editingUser}
                        onCancelEdit={handleCancelEdit}
                      />
                    </div>
                    <div className="section">
                      <UserList
                        key={refreshTrigger}
                        onEdit={handleEditUser}
                        editingUser={editingUser}
                        onCancelEdit={handleCancelEdit}
                        showActions={false}
                      />
                    </div>
                  </>
                )
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
