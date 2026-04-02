FROM node:20-alpine

WORKDIR /app

# Copy root package artifacts
COPY package.json package-lock.json* ./
COPY tsconfig.json ./

# Copy workspace package.json files
COPY packages/core/package.json ./packages/core/
COPY packages/api/package.json ./packages/api/
COPY packages/discord/package.json ./packages/discord/
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build required packages
RUN npm run build -w @corpus/core
RUN npm run build -w @corpus/discord

# Start Discord internal bot
CMD ["npm", "run", "start", "-w", "@corpus/discord"]
