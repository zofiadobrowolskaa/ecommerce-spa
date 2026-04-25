# stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# install dependencies
RUN npm install
COPY . .

# stage 2: production
FROM node:20-alpine
WORKDIR /app
# copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

EXPOSE 3000
# start the service
CMD ["npm", "start"]