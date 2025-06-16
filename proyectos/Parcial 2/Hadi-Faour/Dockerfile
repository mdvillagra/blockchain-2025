# Builder stage
FROM node:18-alpine as builder

# 1. Install system dependencies
RUN apk add --no-cache python3 make g++ git

# 2. Install project dependencies
WORKDIR /app
COPY package*.json .
COPY hardhat.config.js .
COPY .env .
RUN npm install && npm install @openzeppelin/contracts
RUN npm install ethers@5.7 react vite

# 3. Copy and compile contracts
COPY contracts ./contracts
COPY scripts ./scripts
COPY tests ./tests
RUN npx hardhat compile

# 4. Build frontend
WORKDIR /app/web-app
COPY web-app/package*.json .
RUN npm install --force
COPY web-app .
RUN npm run build

# Final stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
RUN npm install -g serve
CMD ["sh", "-c", "npx hardhat run scripts/deploy.js --network ephemery && \
                  npx hardhat run scripts/mint-initial.js --network ephemery && \
                  serve -s web-app/dist -l 3000"]