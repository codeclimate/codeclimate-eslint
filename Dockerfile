FROM mhart/alpine-node:5.4
MAINTAINER Code Climate <hello@codeclimate.com>

WORKDIR /usr/src/app
COPY package.json /usr/src/app/

RUN apk --update add git && \
    npm install && \
    git clone https://github.com/eslint/eslint.git && \
    mkdir -p /usr/src/app/lib/docs/rules/ && \
    cp ./eslint/docs/rules/* /usr/src/app/lib/docs/rules/ && \
    rm -rf eslint && \
    apk del --purge git

COPY . /usr/src/app

RUN adduser -u 9000 -D app
USER app
VOLUME /code
WORKDIR /code

CMD ["/usr/src/app/bin/eslint.js"]
