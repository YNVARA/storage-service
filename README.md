# 📦 Storage Service API

Layanan penyimpanan file (File Hosting) mandiri yang dibangun dengan **Go (Fiber)**, menggunakan **PostgreSQL** untuk metadata, dan dilengkapi dengan fitur otomatisasi serta keamanan tinggi melalui obfuskasi.

---

## ✨ Fitur Utama

- **Multi-Upload**: Mendukung unggahan file tunggal maupun masal.
- **Auto-Cleanup**: Pembersihan otomatis metadata yang terhapus menggunakan Cron Job.
- **Security**: Binary diproteksi dengan `Garble` (obfuscation) dan `UPX` (compression).
- **Portable Backup**: Fitur Export/Import seluruh file dan database dalam satu paket `.zip`.
- **Admin Protected**: Jalur khusus admin dilindungi oleh API Key.

---

## 🛠 Konfigurasi Environment (`.env`)

Buat file `.env` di root direktori atau masukkan variabel ini ke dalam Docker:

| Variabel | Deskripsi | Default |
|:---|:---|:---|
| `DB_HOST` | Host database PostgreSQL | `localhost` |
| `DB_PORT` | Port database PostgreSQL | `5432` |
| `DB_USER` | Username database | `postgres` |
| `DB_PASS` | Password database | `postgres` |
| `DB_NAME` | Nama database | `storage_service` |
| `ADMIN_SECRET_KEY` | Kunci akses Backup/Restore | `super-secret-key` |
| `MAX_FILE_SIZE` | Batas ukuran file (bytes) | `5242880` (5MB) |
| `ALLOWED_TYPES` | MIME types yang diizinkan | `image/png,image/jpeg,application/pdf` |
| `CRON_SCHEDULE` | Jadwal cleanup (Cron syntax) | `*/5 * * * *` |

---

## 🚀 API Endpoints

### 📁 User Operations

| Method | Endpoint | Deskripsi |
|:---|:---|:---|
| `POST` | `/api/v1/upload/single` | Upload 1 file (Key: `file`) |
| `POST` | `/api/v1/upload/multiple` | Upload banyak file (Key: `files`) |
| `GET` | `/api/v1/files` | List semua metadata file |
| `GET` | `/api/v1/file/:filename` | Download/Stream file fisik |
| `DELETE` | `/api/v1/file/:filename` | Hapus file (Soft Delete) |

### 🛡 Admin Operations

*Memerlukan Header: `X-Admin-Key: <ADMIN_SECRET_KEY>`*

#### 1. Export Backup (Download)

Menghasilkan paket ZIP berisi `metadata.json` (DB) dan folder `files/` (fisik).

- **URL**: `/api/v1/admin/backup`
- **Contoh (cURL)**:

```bash
curl -H "X-Admin-Key: super-secret-key" \
     http://localhost:3000/api/v1/admin/backup \
     --output backup_data.zip
```

#### 2. Import Restore

Mengunggah file ZIP untuk memulihkan data ke sistem. Menggunakan logika Upsert.

- **URL**: `/api/v1/admin/import`
- **Contoh (cURL)**:

```bash
curl -X POST \
     -H "X-Admin-Key: super-secret-key" \
     -F "backup=@backup_data.zip" \
     http://localhost:3000/api/v1/admin/import
```

---

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t storage-service:latest .
```

### Run Container

Pastikan folder `uploads` dan `backups` di-mount ke host agar data tidak hilang saat container dihapus.

```bash
docker run -d \
  --name storage-app \
  -p 3000:3000 \
  -v "$(pwd)/uploads:/home/appuser/uploads" \
  -e DB_HOST=host.docker.internal \
  -e ADMIN_SECRET_KEY=kunci-rahasia-anda \
  storage-service:latest
```

---

## 🛡 Keamanan & Pemeliharaan

- **Dependency Check**: Selalu perbarui library `golang.org/x/crypto` untuk menghindari celah keamanan DoS.
- **Obfuskasi**: Binary di-build menggunakan `garble` untuk menyembunyikan logika internal dari reverse engineering.
- **Penyimpanan**: Disarankan menggunakan file system yang terenkripsi di sisi server host untuk folder `uploads`.

---

## 📄 License

© 2026 Styxian-Legion. All rights reserved.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📞 Support

Untuk pertanyaan atau bug report, silakan buat issue di repository ini.