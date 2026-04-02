FROM node:20-alpine AS builder

WORKDIR /app

# Copy root artifacts
COPY package.json package-lock.json* ./
COPY tsconfig.json ./

# Copy everything
COPY packages/ ./packages/

# Install dependencies and build
RUN npm install
RUN npm run build -w @corpus/core
RUN npm run build -w @corpus/web

# Production stage
FROM nginx:alpine
# Copy built static assets
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# Update nginx to proxy /api requests to the API service
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://api:3000/api/; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
