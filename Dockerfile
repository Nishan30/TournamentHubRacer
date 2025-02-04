# Build stage
FROM node:20-alpine3.18 AS builder
WORKDIR /app
# Install Git and other necessary dependencies
RUN apk add --no-cache git openssh-client python3 make g++

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Ensure Git is installed correctly
RUN git --version
# Install Git (Use apk for Alpine)
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]