FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Expose the port Hugging Face Spaces expects
EXPOSE 7860

# Run the server
CMD ["bun", "server.ts"]

