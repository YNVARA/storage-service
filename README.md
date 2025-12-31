# STORAGE SERVICE

**Storage Service** is a dedicated service responsible for handling file storage and management within the system. It provides standardized APIs for **uploading, downloading, deleting, and managing file metadata**, so applications do not interact directly with the physical storage layer.

This service supports **multi-application environments** and applies strict security using **client identity (client_id & client_secret)** combined with user authorization, ensuring that files are accessed only by permitted users and roles.

By isolating file handling into its own service, the system becomes more **scalable, maintainable, and secure**, while allowing storage infrastructure to evolve independently from business logic.

## Repository

```bash
git clone https://github.com/Styxian-Legion/storage-service.git
cd storage-service
```

## Requirements

- PostgreSQL
- Bun (for development)
