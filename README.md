# Unigo Backend

Backend da aplicação Unigo, uma plataforma educacional desenvolvida com Node.js, TypeScript e TypeORM.

## 🚀 Tecnologias

- Node.js
- TypeScript
- Express
- TypeORM
- PostgreSQL
- JWT para autenticação
- Nodemailer para envio de emails
- Bcrypt para criptografia de senhas

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- PostgreSQL
- NPM ou Yarn

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/JenifferFerraz/unigo-backend.git
cd unigo-backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=unigo_db
JWT_SECRET=seu_secret_jwt
SMTP_HOST=seu_smtp_host
SMTP_PORT=587
SMTP_USER=seu_email
SMTP_PASS=sua_senha
SMTP_FROM=seu_email
FRONTEND_URL=http://localhost:3001
```

4. Execute as migrações do banco de dados:
```bash
npm run db:migrate
```

5. Inicie o servidor em modo de desenvolvimento:
```bash
npm run dev
```


## 🛠️ Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo de desenvolvimento
- `npm run db:migrate` - Executa as migrações do banco de dados
- `npm run db:drop` - Remove todas as tabelas do banco
- `npm run db:reset` - Reseta o banco de dados (drop + migrate)
- `npm run migration:generate` - Gera uma nova migração
- `npm run migration:run` - Executa migrações pendentes
- `npm run migration:revert` - Reverte a última migração

