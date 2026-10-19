# =========================================================================
# CleanLoop Backend & Automated Test Runner Dockerfile
# =========================================================================
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=test
ENV AWS_REGION=us-east-1
ENV TABLE_NAME=CleanLoopTable

CMD ["npm", "test"]
