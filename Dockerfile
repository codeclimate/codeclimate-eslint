FROM node:6.10.0-slim
MAINTAINER Code Climate <hello@codeclimate.com>

WORKDIR /usr/src/app
COPY package.json yarn.lock /usr/src/app/

RUN apt-key adv --fetch-keys http://dl.yarnpkg.com/debian/pubkey.gpg && \
    echo "deb http://nightly.yarnpkg.com/debian/ nightly main" | tee /etc/apt/sources.list.d/yarn-nightly.list && \
    apt-get update && \
    apt-get install -y git jq yarn && \
    yarn install && \
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
