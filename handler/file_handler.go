package handler

import (
	"os"
	"storage-service/service"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type FileHandler struct {
	service *service.FileService
}

func NewFileHandler(s *service.FileService) *FileHandler {
	return &FileHandler{service: s}
}

func (h *FileHandler) UploadSingle(c *fiber.Ctx) error {
	cfg := service.UploadConfig{
		FormKey:      "file",
		MaxFiles:     1,
		MaxFileSize:  getEnvAsInt64("MAX_FILE_SIZE", 5*1024*1024),
		AllowedTypes: getEnvAsSlice("ALLOWED_TYPES", "image/jpeg,image/png,application/pdf"),
	}

	result, err := h.service.ProcessUpload(c, cfg)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "error": err.Error()})
	}

	return c.JSON(fiber.Map{"success": true, "data": result[0]})
}

func (h *FileHandler) UploadMultiple(c *fiber.Ctx) error {
	cfg := service.UploadConfig{
		FormKey:      "files",
		MaxFiles:     int(getEnvAsInt64("MAX_FILES", 5)),
		MaxFileSize:  getEnvAsInt64("MAX_FILE_SIZE", 5*1024*1024),
		AllowedTypes: getEnvAsSlice("ALLOWED_TYPES", "image/jpeg,image/png,application/pdf"),
	}

	result, err := h.service.ProcessUpload(c, cfg)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "error": err.Error()})
	}

	return c.JSON(fiber.Map{"success": true, "data": result})
}

func (h *FileHandler) GetFile(c *fiber.Ctx) error {
	return c.SendFile("./uploads/" + c.Params("filename"))
}

func (h *FileHandler) GetAllFiles(c *fiber.Ctx) error {
	files, err := h.service.GetAllFiles()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "Gagal mengambil daftar file",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    files,
	})
}

func (h *FileHandler) DeleteFile(c *fiber.Ctx) error {
	err := h.service.DeleteFile(c.Params("filename"))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"success": false, "error": err.Error()})
	}
	return c.JSON(fiber.Map{"success": true, "message": "deleted"})
}

func (h *FileHandler) ExportBackup(c *fiber.Ctx) error {
	// 1. Panggil service untuk membuat file ZIP backup
	// Service akan menggabungkan metadata database (JSON) dan file fisik
	zipPath, err := h.service.ExportAll()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "Gagal membuat file backup: " + err.Error(),
		})
	}

	// 2. Kirim file ke user untuk di-download
	// Kita hapus file sementara setelah dikirim menggunakan callback jika perlu,
	// atau biarkan tersimpan sebagai arsip lokal.
	return c.Download(zipPath)
}

func (h *FileHandler) ImportBackup(c *fiber.Ctx) error {
	// 1. Ambil file ZIP dari form-data
	file, err := c.FormFile("backup")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "File backup tidak ditemukan dalam request",
		})
	}

	// 2. Simpan sementara file zip yang diupload
	tempZip := "./temp_restore.zip"
	if err := c.SaveFile(file, tempZip); err != nil {
		return c.Status(500).JSON(fiber.Map{"success": false, "error": "Gagal menyimpan file sementara"})
	}

	// Pastikan file sementara dihapus setelah proses selesai
	defer os.Remove(tempZip)

	// 3. Panggil service untuk melakukan extraksi dan restore database
	err = h.service.ImportAll(tempZip)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "Gagal melakukan restore: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Data dan file berhasil dipulihkan",
	})
}

// Helpers
func getEnvAsInt64(key string, fallback int64) int64 {
	if val, ok := os.LookupEnv(key); ok {
		if i, err := strconv.ParseInt(val, 10, 64); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvAsSlice(key string, fallback string) []string {
	val := os.Getenv(key)
	if val == "" {
		val = fallback
	}
	parts := strings.Split(val, ",")
	var res []string
	for _, p := range parts {
		trimmed := strings.Trim(p, " \"'")
		if trimmed != "" {
			res = append(res, trimmed)
		}
	}
	return res
}
