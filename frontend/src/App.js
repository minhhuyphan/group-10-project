import React, { useState } from 'react';
import './App.css';
import UserList from './UserList';
import AddUser from './AddUser';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger refresh of user list
  const handleUserAdded = () => {
    setRefreshTrigger(prev => prev + 1);
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
            <AddUser onUserAdded={handleUserAdded} />
          </div>
          
          <div className="section">
            <UserList key={refreshTrigger} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
