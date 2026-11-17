# Stage 1: Build Vue + Carbon Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Install Backend Production Dependencies
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 3: Production Runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=backend-builder /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY --from=frontend-builder /app/client/dist ./client/dist

USER node
EXPOSE 3000

CMD ["npm", "start"]