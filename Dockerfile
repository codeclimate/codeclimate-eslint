FROM node:6.10.0-slim
LABEL maintainer "Code Climate <hello@codeclimate.com>"

RUN apt-key adv --fetch-keys http://dl.yarnpkg.com/debian/pubkey.gpg && \
    echo "deb http://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update

WORKDIR /usr/src/app
COPY bin/docs ./bin/docs
COPY engine.json package.json yarn.lock ./

RUN mkdir /usr/local/node_modules
ENV PREFIX=/usr/local/node_modules
ENV PATH=$PREFIX/.bin:$PATH
ENV NODE_PATH=$PREFIX
ENV NPM_CONFIG_PREFIX=$PREFIX

RUN apt-get install -y git jq yarn && \
    yarn config set prefix $PREFIX && \
    yarn install --modules-folder $PREFIX && \
    version="v$(yarn list eslint | grep eslint | sed -n 's/.*@//p')" && \
    bin/docs "$version" && \
    cat engine.json | jq ".version = \"$version\"" > /engine.json && \
    apt-get purge -y git jq yarn && \
    apt-get autoremove --yes

RUN adduser --uid 9000 --gecos "" --disabled-password app
COPY . ./
RUN chown -R app:app ./
RUN chown -R app:app $PREFIX

USER app

VOLUME /code
WORKDIR /code

CMD ["/usr/src/app/bin/eslint.js"]
