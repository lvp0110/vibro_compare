FROM node:22.14.0-alpine AS dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY vibro_compare/package.json ./
COPY vibro_compare/package-lock.json ./
RUN npm ci

# builder
FROM node:22.14.0-alpine AS builder

WORKDIR /app

COPY vibro_compare/ .
COPY --from=dependencies /app/node_modules ./node_modules
RUN npm run build

# Use Node.js for the final image instead of nginx
FROM node:22.14.0-alpine

WORKDIR /app

# Copy the built app
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/server.js ./server.js
COPY --from=dependencies /app/node_modules ./node_modules

# Create certs directory and copy certificates
# Note: Make sure to run ./generate-certs.sh before building Docker image
# This will create ../certs/ directory with server.key and server.crt
RUN mkdir -p /app/certs
COPY certs/ /app/certs/

# Expose both HTTP and HTTPS ports
EXPOSE 3000 3443

# Command to run the server
CMD ["node", "server.js"]
