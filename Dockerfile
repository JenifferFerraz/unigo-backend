# unigo-backend/Dockerfile
FROM node:20-alpine 

ARG DK_UID
ARG DK_GID

# Instalação de ferramentas de compilação para módulos nativos
# e outras ferramentas úteis.
RUN apk add --no-cache \
    build-base \
    python3 \
    shadow \
    git \
    gcompat && \
    npm install -g ts-node-dev && \
    usermod -u ${DK_UID:-1000} node && \
    groupmod -g ${DK_GID:-1000} node

USER node

RUN mkdir -p /home/node/project
WORKDIR /home/node/project

# Copia package*.json primeiro para instalar dependências
COPY --chown=node:node package*.json ./

# Instala as dependências do projeto DENTRO DO CONTÊINER
RUN npm install --legacy-peer-deps && \
    npm install wrappy once --save && \
    npm install


# Garante que a pasta de mapeamentos e todos os arquivos sejam copiados
COPY --chown=node:node src/mapeamentos/ src/mapeamentos/
COPY --chown=node:node . .

EXPOSE 3000

# Script de inicialização que executa migrações, seeds e depois inicia o servidor
CMD ["sh", "-c", "npm run migration:run &&  npm run dev"]
