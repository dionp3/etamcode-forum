# Use Node.js official image as base
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (if any)
COPY package*.json ./

# Install the dependencies

# Copy the rest of the application code
COPY . .

# Expose the port where AdonisJS will run
EXPOSE 3333

# Run the AdonisJS application in development mode
ENV NODE_ENV=development
CMD ["npm", "install"]
CMD ["node","ace","migration:run"]

CMD ["npm", "run", "dev"]
