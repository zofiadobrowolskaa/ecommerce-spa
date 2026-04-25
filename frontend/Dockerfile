FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# build vite app
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# install serve to run static files
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 5173
# serve frontend on port 5173
CMD ["serve", "-s", "dist", "-l", "5173"]