# backend/Dockerfile
# Usar uma versão LTS mais recente do Node.js (ex: 20-alpine) é recomendado
FROM node:20-alpine 

# Argumentos para definir UID/GID do usuário 'node' dentro do contêiner
ARG DK_UID
ARG DK_GID

# Instalação de shadow (para usermod/groupmod) e ferramentas globais
# Removi mysql2, pois o foco é PostgreSQL. Adicione de volta se precisar de MySQL também.
RUN apk add --no-cache shadow && \
    usermod -u ${DK_UID:-1000} node && \
    groupmod -g ${DK_GID:-1000} node && \
    npm install -g nodemon sequelize sequelize-cli

# Define o usuário padrão para as operações seguintes
USER node

# Cria o diretório de trabalho para o projeto
# O volume do docker-compose vai sobrescrever este diretório, mas é boa prática ter.
RUN mkdir -p /home/node/project

# Define o diretório de trabalho
WORKDIR /home/node/project

# Copia os arquivos de package.json primeiro para aproveitar o cache do Docker
# Se package.json não mudar, esta camada e a próxima não são reconstruídas.
COPY --chown=node:node package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o restante do código da aplicação
COPY --chown=node:node . .

# Expõe a porta que sua aplicação Express escuta INTERNAMENTE no contêiner
# Esta deve ser uma porta fixa (ex: 3000), não uma variável.
EXPOSE 3000

# Comando padrão para iniciar a aplicação.
# Será sobrescrito pelo 'command' no docker-compose.yml para 'npm run dev' em dev.
CMD ["npm", "run", "start"]