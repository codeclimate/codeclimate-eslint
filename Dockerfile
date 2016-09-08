FROM node:6.5.0-slim
MAINTAINER Code Climate <hello@codeclimate.com>

WORKDIR /usr/src/app
COPY package.json npm-shrinkwrap.json /usr/src/app/

RUN apt-get update && \
    apt-get install -y git jq && \
    npm install && \
    git clone https://github.com/eslint/eslint.git && \
    ESLINT_DOCS_VERSION=`npm -j ls eslint | jq -r .dependencies.eslint.version` && \
    cd eslint && \
    git checkout v$ESLINT_DOCS_VERSION && \
    cd .. && \
    mkdir -p /usr/src/app/lib/docs/rules/ && \
    cp ./eslint/docs/rules/* /usr/src/app/lib/docs/rules/ && \
    rm -rf eslint && \
    apt-get purge -y git jq && \
    apt-get autoremove -y

RUN adduser -u 9000 --gecos "" --disabled-password app
COPY . /usr/src/app
RUN chown -R app:app /usr/src/app

USER app

VOLUME /code
WORKDIR /code

CMD ["/usr/src/app/bin/eslint.js"]
