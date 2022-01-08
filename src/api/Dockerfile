FROM ubuntu:20.04
USER root

WORKDIR /srv/src/api
ENV NODE_ENV=development DEBIAN_FRONTEND=noninteractive


RUN apt-get -y update \
 && apt-get -yq install curl apt-utils \
 && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
 && apt-get install -y nodejs \
 && npm install npm@latest -g

RUN mkdir logs

COPY ./api/package*.json /srv/src/api/
RUN npm install

COPY ./api/ /srv/src/api
COPY ./ui/types /srv/src/ui/types
RUN npm run build

ENTRYPOINT /srv/src/api/entrypoint.sh
