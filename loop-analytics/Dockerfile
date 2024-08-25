FROM node:18.12.1-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.build.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18.12.1-alpine
RUN apk update && apk add tzdata && apk --no-cache add curl
ENV TZ=Asia/Dhaka
WORKDIR /app
COPY package*.json tsconfig.build.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
CMD ["npm", "run", "start:prod"]
