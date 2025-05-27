import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UserForm({ userToEdit, onSuccess }) {
    const [form, setForm] = useState({ nome: '', email: '', idade: '' });

    useEffect(() => {
        if (userToEdit) setForm(userToEdit);
    }, [userToEdit]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const method = form.id ? 'put' : 'post';
        const url = form.id
            ? `http://localhost:3001/api/users/${form.id}`
            : 'http://localhost:3001/api/users';

        axios[method](url, form)
            .then(() => {
                setForm({ nome: '', email: '', idade: '' });
                onSuccess();
            });
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>{form.id ? 'Editar' : 'Novo'} Usuário</h3>
            <div className="mb-2">
                <input className="form-control" name="nome" placeholder="Nome" value={form.nome} onChange={handleChange} required />
            </div>
            <div className="mb-2">
                <input className="form-control" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="mb-2">
                <input className="form-control" name="idade" type="number" placeholder="Idade" value={form.idade} onChange={handleChange} required />
            </div>
            <button className="btn btn-primary" type="submit">Salvar</button>
        </form>
    );
}

export default UserForm;
