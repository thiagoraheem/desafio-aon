require('dotenv').config();
const app = require('./app');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3001;

// Garante que a pasta 'uploads' existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Função para aguardar um tempo específico
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para tentar conectar ao banco de dados com retry
async function connectWithRetry(config, retries = 5, delay = 5000) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Tentativa ${i + 1} de ${retries} para conectar ao banco de dados...`);
      const pool = new Pool(config);
      // Testa a conexão
      await pool.query('SELECT 1');
      console.log('Conexão com o banco de dados estabelecida com sucesso!');
      return pool;
    } catch (error) {
      console.error(`Tentativa ${i + 1} falhou:`, error.message);
      lastError = error;
      // Aguarda antes de tentar novamente
      console.log(`Aguardando ${delay/1000} segundos antes de tentar novamente...`);
      await sleep(delay);
    }
  }
  throw new Error(`Não foi possível conectar ao banco de dados após ${retries} tentativas: ${lastError.message}`);
}

// Função para inicializar o banco de dados
async function initializeDatabase() {
  try {
    // Configuração para o banco padrão postgres
    const pgConfig = {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: 'postgres', // Conecta ao banco padrão primeiro
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

    // Tenta conectar ao banco padrão com retry
    const pool = await connectWithRetry(pgConfig);

    // Verifica se o banco de dados já existe
    const dbCheckResult = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );

    // Se o banco não existir, cria-o
    if (dbCheckResult.rowCount === 0) {
      console.log(`Criando banco de dados ${process.env.DB_NAME}...`);
      await pool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    }

    // Fecha a conexão com o banco padrão
    await pool.end();

    // Configuração para o banco da aplicação
    const appConfig = {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

    // Tenta conectar ao banco da aplicação com retry
    const appPool = await connectWithRetry(appConfig);

    // Verifica se a tabela users já existe
    const tableCheckResult = await appPool.query(
      "SELECT 1 FROM information_schema.tables WHERE table_name = 'users'"
    );

    // Se a tabela não existir, cria-a
    if (tableCheckResult.rowCount === 0) {
      console.log('Criando tabela users...');
      await appPool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100),
          email VARCHAR(100) UNIQUE,
          idade INT
        )
      `);
    }

    await appPool.end();
    console.log('Inicialização do banco de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    process.exit(1); // Encerra o processo com erro
  }
}

// Chama a função de inicialização antes de iniciar o servidor
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

