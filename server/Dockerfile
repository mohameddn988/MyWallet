FROM oven/bun:1

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json ./
RUN bun install

# Copy source
COPY . .

EXPOSE 4000

CMD ["bun", "index.ts"]
