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
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found")
	}

	// 1. Koneksi DB
	db := infrastructure.ConnectDB()

	// 2. Auto Migrate
	err = db.AutoMigrate(&domain.FileEntity{})
	if err != nil {
		log.Fatalf("Gagal migrasi database: %v", err)
	}

	storage := infrastructure.NewLocalStorage("./uploads")
	repo := infrastructure.NewFileRepository(db)
	svc := service.NewFileService(storage, repo)
	hdl := handler.NewFileHandler(svc)

	// 3. Setup Cron Job
	cronSchedule := os.Getenv("CRON_SCHEDULE")
	if cronSchedule == "" {
		cronSchedule = "*/5 * * * *"
	}

	c := cron.New()
	_, err = c.AddFunc(cronSchedule, func() {
		log.Printf("Cron: Memulai pembersihan data sesuai jadwal (%s)...\n", cronSchedule)

		if err := svc.CleanDeletedMetadata(); err != nil {
			log.Printf("Cron Error: %v\n", err)
		} else {
			log.Println("Cron: Pembersihan selesai dengan sukses.")
		}
	})

	if err != nil {
		log.Fatalf("Gagal menambahkan Cron Job dengan jadwal %s: %v", cronSchedule, err)
	}

	c.Start()
	defer c.Stop()

	// 4. Setup Fiber
	app := fiber.New(fiber.Config{
		BodyLimit:   50 * 1024 * 1024,
		ReadTimeout: 60 * time.Second,
	})

	// Routing menggunakan hdl yang sudah dibuat di atas
	api := app.Group("/api/v1")
	api.Get("/files", hdl.GetAllFiles)
	api.Post("/upload/single", hdl.UploadSingle)
	api.Post("/upload/multiple", hdl.UploadMultiple)
	api.Get("/file/:filename", hdl.GetFile)
	api.Delete("/file/:filename", hdl.DeleteFile)

	app.Static("/public", "./uploads")

	log.Fatal(app.Listen(":3000"))
}
