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
    npm install wrappy once --save

# Copia o restante do código da aplicação
COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "run", "dev"]