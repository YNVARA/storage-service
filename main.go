package main

import (
	"log"
	"os"
	"storage-service/domain"
	"storage-service/handler"
	"storage-service/infrastructure"
	"storage-service/service"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"github.com/robfig/cron/v3"
)

func main() {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found")
	}

	// 1. Koneksi DB & Migrasi
	db := infrastructure.ConnectDB()
	err = db.AutoMigrate(&domain.FileEntity{})
	if err != nil {
		log.Fatalf("Gagal migrasi database: %v", err)
	}

	// 2. Inisialisasi Layer (Dependency Injection)
	storage := infrastructure.NewLocalStorage("./uploads")
	repo := infrastructure.NewFileRepository(db)
	svc := service.NewFileService(storage, repo)
	hdl := handler.NewFileHandler(svc)

	// 3. Setup Cron Job untuk Cleanup
	cronSchedule := os.Getenv("CRON_SCHEDULE")
	if cronSchedule == "" {
		cronSchedule = "*/5 * * * *"
	}

	c := cron.New()
	_, err = c.AddFunc(cronSchedule, func() {
		log.Printf("Cron: Memulai pembersihan metadata (%s)...\n", cronSchedule)
		if err := svc.CleanDeletedMetadata(); err != nil {
			log.Printf("Cron Error: %v\n", err)
		}
	})
	if err != nil {
		log.Fatalf("Gagal setup Cron: %v", err)
	}
	c.Start()
	defer c.Stop()

	// 4. Inisialisasi Fiber
	app := fiber.New(fiber.Config{
		BodyLimit:   100 * 1024 * 1024, // Naikkan limit untuk mendukung upload backup besar
		ReadTimeout: 120 * time.Second,
	})

	// Middleware untuk proteksi endpoint Admin (Backup/Import)
	adminAuth := func(c *fiber.Ctx) error {
		adminKey := os.Getenv("ADMIN_SECRET_KEY")
		if adminKey == "" {
			adminKey = "super-secret-key" // Fallback jika env lupa diset
		}

		if c.Get("X-Admin-Key") != adminKey {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Unauthorized: Kunci admin tidak valid",
			})
		}
		return c.Next()
	}

	// --- ROUTING ---

	api := app.Group("/api/v1")

	// Public/User Routes
	api.Post("/upload/single", hdl.UploadSingle)
	api.Post("/upload/multiple", hdl.UploadMultiple)
	api.Get("/files", hdl.GetAllFiles)
	api.Get("/file/:filename", hdl.GetFile)
	api.Delete("/file/:filename", hdl.DeleteFile)

	// Admin Routes (Backup & Restore)
	admin := api.Group("/admin", adminAuth)
	admin.Get("/backup", hdl.ExportBackup)
	admin.Post("/import", hdl.ImportBackup)

	// Static files
	app.Static("/public", "./uploads")

	log.Printf("Server berjalan di port :3000")
	log.Fatal(app.Listen(":3000"))
}
