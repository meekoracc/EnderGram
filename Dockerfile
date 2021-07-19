FROM node:16-alpine3.14

WORKDIR /usr/src/app

VOLUME ["/data", "/config"]

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm ci --only=production

COPY config.json ./

ENV LOCAL_FILE_PATH=/serverfiles/logs/latest.log

CMD [ "node", "build/index.js" ]