import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import UserForm from './components/UserForm';
import UserList from './components/UserList';
import CsvUpload from './components/CsvUpload';

function App() {
  const [userToEdit, setUserToEdit] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const triggerRefresh = () => {
    setUserToEdit(null);
    setRefresh(prev => !prev);
  };

  return (
      <div className="container mt-4">
        <h1>TechCorp – Gerenciador de Usuários</h1>
        <UserForm userToEdit={userToEdit} onSuccess={triggerRefresh} />
        <CsvUpload onSuccess={triggerRefresh} />
        <UserList onEdit={setUserToEdit} key={refresh} />
      </div>
  );
}

export default App;
