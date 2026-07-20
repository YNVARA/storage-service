```bash
docker build --no-cache --pull -t storage-service .
```

```bash
docker scout
```

```bash
docker run -d \
    --name storage-service \
    -p 4000:3000 \
    --read-only \
    --cap-drop ALL \
    --security-opt=no-new-privileges \
    \
    -e APP_NAME="STORAGE SERVICE" \
    -e APP_VERSION="1.0.0" \
    -e NODE_ENV="production" \
    -e APP_HOST="0.0.0.0" \
    -e APP_PORT="3000" \
    -e APP_DOMAIN="localhost" \
    \
    -e CORS_ORIGINS="http://localhost:4000" \
    \
    -e LOG_LEVEL="info" \
    \
    -e DB_MAIN_ENGINE="postgres" \
    -e DB_MAIN_HOST="host.docker.internal" \
    -e DB_MAIN_PORT="5432" \
    -e DB_MAIN_USERNAME="postgres" \
    -e DB_MAIN_PASSWORD="postgres" \
    -e DB_MAIN_DATABASE="storage_db" \
    \
    -e DB_SECOND_ENGINE="postgres" \
    -e DB_SECOND_HOST="host.docker.internal" \
    -e DB_SECOND_PORT="5432" \
    -e DB_SECOND_USERNAME="postgres" \
    -e DB_SECOND_PASSWORD="postgres" \
    -e DB_SECOND_DATABASE="storage_db" \
    \
    -e MINIO_ENDPOINT="host.docker.internal" \
    -e MINIO_PORT="9000" \
    -e MINIO_USE_SSL="false" \
    -e MINIO_ACCESS_KEY="minioadmin" \
    -e MINIO_SECRET_KEY="minioadmin" \
    -e MINIO_BUCKET="mybucket" \
    -e MINIO_PUBLIC_URL="http://host.docker.internal:9000/mybucket" \
    \
    storage-service
```
