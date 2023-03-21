FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install -g nodemon
COPY . .
# EXPOSE 8181
# CMD ["npm", "run", "start:dev"]