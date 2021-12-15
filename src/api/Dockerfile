FROM ubuntu:20.04
USER root

WORKDIR /srv/src/api
ENV NODE_ENV=development DEBIAN_FRONTEND=noninteractive


RUN apt-get -y update \
 && apt-get -yq install curl apt-utils \
 && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
 && apt-get install -y nodejs

RUN echo sup

COPY package*.json /srv/src/api/
# RUN npm install

COPY . /srv/src/api



