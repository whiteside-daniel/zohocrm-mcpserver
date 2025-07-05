FROM node:24-alpine
WORKDIR /app

COPY . . 

RUN npm install
RUN chmod u+x express.js
RUN chmod u+x index.js

EXPOSE 3000

CMD ["sh" ,"-c", "node express.js & node index.js"]