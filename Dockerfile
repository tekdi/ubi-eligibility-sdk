FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files and install
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source code
COPY src ./src

# Change ownership and permissions
RUN chown -R appuser:appgroup /usr/src/app

# Switch to non-root user
USER appuser

# Start the app
CMD ["node", "src/index.js"]
