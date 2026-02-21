FROM node:25-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 2877

CMD ["npm", "run", "start"]