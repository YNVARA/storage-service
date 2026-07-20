#############################################
# Build Stage
#############################################

FROM oven/bun:1.2 AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build


#############################################
# Runtime Stage
#############################################

FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y \
    ca-certificates \
    libstdc++6 && \
    rm -rf /var/lib/apt/lists/*

RUN useradd \
    --system \
    --create-home \
    --shell /usr/sbin/nologin \
    appuser

WORKDIR /app

COPY --from=builder /app/dist/storage-service .

RUN chmod +x storage-service

USER appuser

ENV NODE_ENV=production

EXPOSE 3000

ENTRYPOINT ["./storage-service"]
