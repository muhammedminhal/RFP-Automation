FROM node:18-alpine

WORKDIR /usr/src/app

# Production dependencies only (we install all here for simplicity)
COPY package.json package-lock.json* ./
RUN npm ci --production

COPY . .

# Create uploads dir
RUN mkdir -p public/uploads && chown -R node:node public/uploads

USER node
ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/server.js"]
