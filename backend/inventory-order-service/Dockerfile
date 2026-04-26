# stage 1: build
FROM node:20-alpine AS builder

# install the OpenSSL library required by the Prisma engine
RUN apk add --no-cache openssl

WORKDIR /app
COPY package*.json ./
# install dependencies
RUN npm install
COPY . .

# generate prisma client for linux environment inside container
RUN npx prisma generate

# stage 2: production
FROM node:20-alpine

# install the OpenSSL library in the final production image
RUN apk add --no-cache openssl

WORKDIR /app

# copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# copy knex configuration file required for database queries
COPY --from=builder /app/knexfile.js ./

# copy folders for automated migrations and seeds
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeds ./seeds
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001
# start the service
CMD ["npm", "start"]