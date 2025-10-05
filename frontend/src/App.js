import React, { useState } from 'react';
import './App.css';
import UserList from './UserList';
import AddUser from './AddUser';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingUser, setEditingUser] = useState(null);

  // Function to trigger refresh of user list
  const handleUserAdded = () => {
    setRefreshTrigger(prev => prev + 1);
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
      <header className="App-header">
        <h1>Quản lý người dùng</h1>
        <p>Ứng dụng quản lý danh sách người dùng với React + Node.js</p>
      </header>
      
      <main className="App-main">
        <div className="container">
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
        </div>
      </main>
    </div>
  );
}

export default App;
