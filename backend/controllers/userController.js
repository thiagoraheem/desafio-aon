const pool = require('../models/db');
const fs = require('fs');
const csv = require('csv-parser');

// GET /api/users – Lista todos os usuários
exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuários', error });
    }
};

// POST /api/users – Cria um novo usuário
exports.createUser = async (req, res) => {
    const { nome, email, idade } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO users (nome, email, idade) VALUES ($1, $2, $3) RETURNING *',
            [nome, email, idade]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar usuário', error });
    }
};

// PUT /api/users/:id – Atualiza um usuário
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { nome, email, idade } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET nome = $1, email = $2, idade = $3 WHERE id = $4 RETURNING *',
            [nome, email, idade, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar usuário', error });
    }
};

// DELETE /api/users/:id – Deleta um usuário
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar usuário', error });
    }
};

// POST /api/users/upload – Upload de CSV e inserção em batch
exports.batchUploadUsers = async (req, res) => {
    const filePath = req.file.path;
    const users = [];

    fs.createReadStream(filePath)
        .pipe(csv({
            mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '')
        }))
        .on('data', (row) => {
            console.log('Linha do CSV:', row);
            const { nome, email, idade } = row;
            if (nome && email && idade) {
                console.log('Entrou no if');
                users.push([nome, email, parseInt(idade)]);
            }
        })
        .on('end', async () => {
            console.log('Total lido do CSV:', users.length);
            try {
                for (const user of users) {
                    await pool.query(
                        'INSERT INTO users (nome, email, idade) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
                        user
                    );
                }
                res.json({ message: `Inseridos ${users.length} usuários com sucesso.` });
            } catch (error) {
                res.status(500).json({ message: 'Erro ao inserir usuários do CSV', error });
            } finally {
                fs.unlinkSync(filePath); // Remove o arquivo após uso
            }
        });
};
