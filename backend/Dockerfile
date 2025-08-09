FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "index.js"] 
# Dockerfile run mqtt-listener
FROM node:18 AS mqtt
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "mqtt-listener.js"] 