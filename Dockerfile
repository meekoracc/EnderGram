FROM node:16-alpine3.14

WORKDIR /usr/src/app

VOLUME ["/data", "/config"]

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm ci --only=production

ENV LOCAL_FILE_PATH=/data/logs/latest.log CONFIG_PATH=../config.json

COPY config.json ./

CMD [ "node", "build/index.js" ]