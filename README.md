# TechCorp - Gerenciador de Usuários

Este projeto consiste em uma aplicação web para gerenciamento de usuários, com funcionalidades CRUD (Create, Read, Update, Delete) e upload de arquivos CSV para importação em lote. A aplicação é dividida em três partes principais: frontend (React), backend (Node.js/Express) e banco de dados (PostgreSQL), todos containerizados com Docker.

## Requisitos

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Estrutura do Projeto

```
├── arquivos/                # Arquivos de suporte (SQL, CSV de exemplo)
├── backend/                 # API REST em Node.js/Express
├── frontend/               # Interface de usuário em React
├── docker-compose.yml      # Configuração dos contêineres Docker
└── README.md               # Este arquivo
```

## Configuração e Execução

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd <nome-do-repositorio>
```

### 2. Configuração do Ambiente

O projeto já vem com as configurações necessárias nos arquivos `.env` e `docker-compose.yml`. As variáveis de ambiente padrão são:

**Backend (.env)**:
```
PORT=3001
DB_USER=postgres
DB_PASSWORD=senhaForte
DB_HOST=db
DB_PORT=5432
DB_NAME=techcorp
```

**Banco de Dados (docker-compose.yml)**:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=senhaForte
POSTGRES_DB=techcorp
```

### 3. Construir e Iniciar os Contêineres

Para construir e iniciar todos os contêineres (frontend, backend e banco de dados):

```bash
docker-compose up --build
```

Este comando irá:
1. Construir as imagens Docker para o frontend e backend
2. Baixar a imagem do PostgreSQL
3. Iniciar todos os serviços
4. Configurar a rede entre os contêineres

Para executar em segundo plano (modo detached):

```bash
docker-compose up --build -d
```

### 4. Acessar a Aplicação

Após iniciar os contêineres, a aplicação estará disponível em:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Banco de Dados**: localhost:5432 (acessível via ferramentas como pgAdmin ou DBeaver)

### 5. Parar os Contêineres

Para parar todos os contêineres:

```bash
docker-compose down
```

Para parar e remover volumes (isso apagará os dados do banco):

```bash
docker-compose down -v
```

## Funcionalidades

### Frontend

- Listagem de usuários
- Formulário para adicionar/editar usuários
- Upload de arquivo CSV para importação em lote
- Interface responsiva com Bootstrap

### Backend

- API REST para operações CRUD de usuários
- Endpoint para upload e processamento de arquivos CSV
- Validação de dados
- Conexão com banco de dados PostgreSQL

### Banco de Dados

- Tabela `users` com campos:
  - id (SERIAL PRIMARY KEY)
  - nome (VARCHAR)
  - email (VARCHAR, UNIQUE)
  - idade (INT)

## Endpoints da API

- `GET /api/users` - Lista todos os usuários
- `POST /api/users` - Cria um novo usuário
- `PUT /api/users/:id` - Atualiza um usuário existente
- `DELETE /api/users/:id` - Remove um usuário
- `POST /api/users/upload` - Upload de arquivo CSV para importação em lote

## Formato do Arquivo CSV

O arquivo CSV para importação deve conter os seguintes cabeçalhos:

```
nome,email,idade
```

Exemplo:
```
nome,email,idade
João Silva,joao@example.com,30
Maria Souza,maria@example.com,25
```

## Solução de Problemas

### Erro de Conexão com o Banco de Dados

O backend implementa um mecanismo de retry que tenta se conectar ao banco de dados várias vezes antes de falhar, o que resolve a maioria dos problemas de timing em ambientes Docker. Se mesmo assim ocorrerem erros de conexão, verifique:

1. Se o contêiner do PostgreSQL está em execução: `docker ps`
2. Se as variáveis de ambiente no arquivo `.env` do backend correspondem às configurações no `docker-compose.yml`
3. Se os logs do contêiner do backend mostram erros específicos: `docker logs <nome-do-container-backend>`
4. Se o número de tentativas de conexão (padrão: 5) e o intervalo entre tentativas (padrão: 5000ms) são suficientes para o seu ambiente - estes valores podem ser ajustados no arquivo `server.js` se necessário

### Problemas com Portas

Se houver conflitos de porta (3000, 3001 ou 5432 já em uso), você pode alterá-las no arquivo `docker-compose.yml`.

## Desenvolvimento

Para desenvolvimento local sem Docker:

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Lembre-se de configurar as variáveis de ambiente apropriadamente para desenvolvimento local.


O backend foi configurado com inicialização automática do banco de dados, incluindo um mecanismo de retry para lidar com situações onde o contêiner do PostgreSQL ainda não está pronto para aceitar conexões. Abaixo está o código implementado no arquivo `server.js`:

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
```

Este código implementa:

1. Um mecanismo de retry que tenta conectar ao banco de dados até 5 vezes, com intervalos de 5 segundos entre as tentativas
2. Verificação e criação do banco de dados e da tabela `users` se não existirem
3. Tratamento adequado de erros, incluindo encerramento do processo em caso de falha persistente

Esta implementação resolve problemas de timing em ambientes Docker, onde o contêiner do PostgreSQL pode levar mais tempo para inicializar do que o contêiner do backend.