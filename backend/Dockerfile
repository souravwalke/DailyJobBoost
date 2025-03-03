# Use Node.js 18 as the base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files from backend directory
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy the backend application files
COPY backend/ .

# Build TypeScript
RUN npm run build

# Expose the port
EXPOSE 3001

# Start command that includes migrations
CMD npm run prepare:prod && npm start 