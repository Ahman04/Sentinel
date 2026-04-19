# Frontend Dockerfile — builds and runs the Next.js app in development mode.
# In production you would use `npm run build && npm start` instead.

FROM node:20-alpine

WORKDIR /app

# Install dependencies first so Docker can cache this layer.
COPY package*.json ./
RUN npm install

# Copy the rest of the source code.
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
