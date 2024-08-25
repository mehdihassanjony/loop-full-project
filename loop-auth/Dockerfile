FROM node:16.17.0-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:16.17.0-alpine
RUN apk update && apk add tzdata && apk --no-cache add curl
ENV TZ=Asia/Dhaka
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
# COPY . .
COPY --from=build /app/dist ./dist
