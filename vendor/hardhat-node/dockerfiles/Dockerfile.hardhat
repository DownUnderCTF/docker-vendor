FROM node:16-buster-slim as base
FROM base as build

RUN mkdir /app
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

COPY hardhat.config.js hardhat.config.js

EXPOSE 8545/tcp
CMD [ "npm", "run", "start" ] 

