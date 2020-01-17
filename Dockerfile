FROM node:12.2.0-alpine
WORKDIR /usr/src/app/dailygit
COPY package.json ./
RUN npm install
ENV PORT 4000
ENV DB_URI mongodb://database:27017/
ENV FS_PATH /filesystem/
ENV MEDIA_PATH /media/
COPY . .
CMD ["node", "index.js"]