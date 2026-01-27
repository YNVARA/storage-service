package main

import (
	"log"
	"storage-service/handler"
	"storage-service/infrastructure"
	"storage-service/service"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using system environment or fallbacks")
	}

	app := fiber.New(fiber.Config{
		BodyLimit:   50 * 1024 * 1024, // Sesuaikan jika total 100 file sangat besar
		ReadTimeout: 60 * time.Second, // Beri waktu lebih lama untuk upload
	})

	storage := infrastructure.NewLocalStorage("./uploads")
	svc := service.NewFileService(storage)
	hdl := handler.NewFileHandler(svc)

	api := app.Group("/api/v1")

	api.Post("/upload/single", hdl.UploadSingle)
	api.Post("/upload/multiple", hdl.UploadMultiple)
	api.Get("/file/:filename", hdl.GetFile)
	api.Delete("/file/:filename", hdl.DeleteFile)

	app.Static("/public", "./uploads")

	log.Fatal(app.Listen(":3000"))
}
