import React, { useState, useContext } from "react";
import "./App.css";
import UserList from "./UserList";
import AddUser from "./AddUser";
import SignUp from "./SignUp";
import Login from "./Login";
import { AuthContext } from "./AuthContext";

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const { user, logout } = useContext(AuthContext);
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
      </header>

      <main className="App-main">
        <div className={`container ${!user ? "center-vert" : ""}`}>
          {!user ? (
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
                <button onClick={logout}>Logout</button>
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
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
