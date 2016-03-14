FROM mhart/alpine-node:5.4
MAINTAINER Code Climate <hello@codeclimate.com>

WORKDIR /usr/src/app
COPY package.json /usr/src/app/

RUN apk --update add git jq && \
    npm install && \
    git clone --depth=1 https://github.com/eslint/eslint.git && \
    ESLINT_DOCS_VERSION=`npm -j ls eslint | jq -r .dependencies.eslint.version` && \
    cd eslint && \
    git checkout v$ESLINT_DOCS_VERSION && \
    cd .. && \
    mkdir -p /usr/src/app/lib/docs/rules/ && \
    cp ./eslint/docs/rules/* /usr/src/app/lib/docs/rules/ && \
    rm -rf eslint && \
    apk del --purge git jq

COPY . /usr/src/app

RUN adduser -u 9000 -D app
USER app
VOLUME /code
WORKDIR /code

CMD ["/usr/src/app/bin/eslint.js"]
