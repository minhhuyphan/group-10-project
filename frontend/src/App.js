import React, { useState, useContext } from "react";
import "./App.css";
import UserList from "./UserList";
import AddUser from "./AddUser";
import SignUp from "./SignUp";
import Login from "./Login";
import Profile from "./Profile";
import ProfilePage from "./ProfilePage";
import AdminUsers from './AdminUsers';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import UploadAvatar from './UploadAvatar';
import { Routes, Route, Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const { user, logout } = useContext(AuthContext);
  const { initializing } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(true);

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

  return (
    <div className="App">
      <header className={`App-header ${!user ? "center-header" : ""}`}>
        <h1>Quản lý người dùng</h1>
        {user && (
          <nav style={{ display: "flex", gap: 10 }}>
            <Link to="/profile" className="btn btn-ghost">
              Profile
            </Link>
            <Link to="/upload-avatar" className="btn btn-ghost">
              Upload Avatar
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin/users" className="btn btn-ghost">Admin</Link>
            )}
          </nav>
        )}
      </header>

      <main className="App-main">
        <div className={`container ${!user ? "center-vert" : ""}`}>
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
            
            {/* Protected routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/upload-avatar" element={<UploadAvatar />} />
            
            {/* Home route - catch-all LAST */}
            <Route
              path="/"
              element={
                initializing ? (
                  <div className="center-vert" style={{ minHeight: '60vh' }}>
                    <div className="card">Loading...</div>
                  </div>
                ) : !user ? (
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
                      <h2>Welcome, {user.name || user.email}</h2>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <button
                          onClick={() => {
                            logout();
                            navigate("/");
                          }}
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
