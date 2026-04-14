# Stage 1: Build the React Application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# You can pass VITE_API_URL as a build arg if deploying to different environments
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 to the outer world
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
