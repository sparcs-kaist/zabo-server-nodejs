FROM node:18.18.2-alpine


RUN apk add --no-cache git

WORKDIR '/app'

COPY ./package.json ./
COPY ./yarn.lock ./
RUN yarn

COPY . .

EXPOSE 80
ENTRYPOINT [ "yarn", "start" ]
