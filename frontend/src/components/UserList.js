import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UserList({ onEdit }) {
    const [users, setUsers] = useState([]);

    const fetchUsers = () => {
        axios.get('http://localhost:3001/api/users')
            .then(response => setUsers(response.data))
            .catch(err => console.error(err));
    };

    const deleteUser = (id) => {
        axios.delete(`http://localhost:3001/api/users/${id}`)
            .then(() => fetchUsers());
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="mt-4">
            <h3>Usuários Cadastrados</h3>
            <table className="table table-bordered">
                <thead>
                <tr>
                    <th>Nome</th><th>Email</th><th>Idade</th><th>Ações</th>
                </tr>
                </thead>
                <tbody>
                {users.map(u => (
                    <tr key={u.id}>
                        <td>{u.nome}</td>
                        <td>{u.email}</td>
                        <td>{u.idade}</td>
                        <td>
                            <button className="btn btn-warning btn-sm me-2" onClick={() => onEdit(u)}>Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Excluir</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default UserList;
