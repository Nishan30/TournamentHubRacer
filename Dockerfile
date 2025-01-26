FROM node:20-alpine3.18 AS builder
WORKDIR /src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 80
CMD ["npm","start"]
