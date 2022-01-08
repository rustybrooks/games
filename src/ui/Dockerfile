FROM ubuntu:20.04
USER root

WORKDIR /srv/src/ui
ENV NODE_ENV=development

RUN apt-get -y update \
 && DEBIAN_FRONTEND=noninteractive apt-get -yq install curl apt-utils \
 && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
 && apt-get install -y nodejs
 && npm install npm@latest -g

COPY package*.json /srv/src/ui/
RUN npm install
COPY . /srv/src/ui
RUN npm run build

ENTRYPOINT /srv/src/ui/entrypoint.sh


