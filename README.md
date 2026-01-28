# STORAGE SERVICE

```bash
git clone https://github.com/Styxian-Legion/storage-service.git
```

## TECH STACK

- [Golang](https://go.dev/)
- [Go Fiber](https://gofiber.io/)
- [Go Env](https://github.com/joho/godotenv)
- [Go Gorm](https://gorm.io/)

## Build & Run

```bash
docker build --no-cache -t storage-service:latest .
```

```bash
docker run -d \
  --name storage-app \
  -p 3000:3000 \
  -v $(pwd)/uploads:/home/appuser/uploads \
  -e MAX_FILE_SIZE=10485760 \
  -e ALLOWED_TYPES=application/pdf,image/jpeg,image/png \
  -e MAX_FILES=150 \
  -e DB_HOST=host.docker.internal \
  -e DB_USER=postgres \
  -e DB_PASS=postgres \
  -e DB_NAME=storage_service \
  -e DB_PORT=5432 \
  -e CRON_SCHEDULE="*/2 * * * *" \
  storage-service:latest
```