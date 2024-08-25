
FROM node:18.12.1-alpine AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18.12.1-alpine
RUN apk update && apk add tzdata && apk --no-cache add curl
ENV TZ=Asia/Dhaka
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=development /usr/src/app/dist ./dist
CMD ["npm", "run", "start:prod"]
