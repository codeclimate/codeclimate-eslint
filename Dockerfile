FROM mhart/alpine-node

WORKDIR /usr/src/app
COPY package.json /usr/src/app/

RUN npm install

RUN adduser -u 9000 -D app
USER app

COPY . /usr/src/app

ENV NODE_PATH /code/node_modules

CMD ["/usr/src/app/bin/eslint.js"]
