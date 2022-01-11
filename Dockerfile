FROM node:17.3-bullseye-slim
LABEL maintainer "Code Climate <hello@codeclimate.com>"

RUN adduser --uid 9000 --gecos "" --disabled-password app

WORKDIR /usr/src/app
COPY npm-shrinkwrap.json /usr/src/app/
COPY package.json /usr/src/app/

RUN apt-get update && \
    apt-get install -y git && \
    npm install && \
    apt-get purge -y git

COPY . /usr/src/app
RUN chown -R app:app /usr/src/app

USER app

VOLUME /code
WORKDIR /code

CMD ["/usr/src/app/bin/eslint.js"]
