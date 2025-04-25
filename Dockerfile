FROM node:23-slim

WORKDIR /app

# Copy package definitions and install only prod deps for a slimmer image
COPY package*.json ./
RUN npm install --only=production

# Copy app code
COPY . .

# Expose app port
EXPOSE 3002

# Default command: start your Node.js app
CMD ["npm", "start"]