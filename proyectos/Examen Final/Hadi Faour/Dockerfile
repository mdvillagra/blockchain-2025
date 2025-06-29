# Use Node.js 20 (required by latest Vite)
FROM node:20

# Install system dependencies (Git + cleanup)
RUN apt-get update && \
    apt-get install -y git && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the rest of the application
COPY . .

# Expose ports
EXPOSE 3000 8545

# Keep container running with bash shell
CMD ["tail", "-f", "/dev/null"]