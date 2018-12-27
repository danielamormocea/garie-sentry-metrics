FROM node:8.10.0

RUN mkdir -p /usr/src/garie-sentry-metrics

WORKDIR /usr/src/garie-sentry-metrics

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
