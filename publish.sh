#!/bin/bash

set -e

docker build -t rustybrooks/games-api:latest -f src/api/Dockerfile ./src/ 
docker push rustybrooks/games-api:latest

docker build -t rustybrooks/games-ui:latest ./src/ui/
docker push rustybrooks/games-ui:latest





