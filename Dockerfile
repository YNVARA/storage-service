# --- STAGE 1: Build & Obfuscate ---
# Kita gunakan golang:alpine untuk mendapatkan toolchain terbaru
FROM golang:alpine AS builder

# Install tools yang dibutuhkan
RUN apk add --no-cache git upx

# Sekarang kita bisa gunakan @latest karena Go sistem sudah 1.25+
RUN go install mvdan.cc/garble@latest

WORKDIR /app

# Copy modul
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build dengan Garble
RUN garble -seed=c3RvcmFnZV9zZXJ2aWNlYmFzZTY0Cg== build -trimpath -ldflags="-s -w" -o storage-service main.go

# Packing dengan UPX
RUN upx --ultra-brute storage-service

# --- STAGE 2: Final Secure Image ---
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /home/appuser/

COPY --from=builder /app/storage-service .

RUN mkdir ./uploads && chown appuser:appgroup ./uploads

USER appuser
EXPOSE 3000

CMD ["./storage-service"]