FROM node:12.2.0-alpine
WORKDIR /usr/src/app/
COPY package.json ./
RUN yarn
COPY . .
CMD ["yarn", "run", "dev"]