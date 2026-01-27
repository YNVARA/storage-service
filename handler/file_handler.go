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

// 1. ENDPOINT: SINGLE UPLOAD
func (h *FileHandler) UploadSingle(c *fiber.Ctx) error {
	// Ambil setting dari ENV dengan Fallback (Default)
	maxSize := getEnvAsInt64("MAX_FILE_SIZE", 5*1024*1024) // Default 5MB
	allowed := getEnvAsSlice("ALLOWED_TYPES", "image/jpeg,image/png")

	cfg := service.UploadConfig{
		FormKey:      "file",
		MaxFiles:     1,
		MaxFileSize:  maxSize,
		AllowedTypes: allowed,
	}

	names, err := h.service.ProcessUpload(c, cfg)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "File uploaded successfully",
		"data":    fiber.Map{"file_name": names[0], "url": "/public/" + names[0]},
	})
}

// 2. ENDPOINT: MULTIPLE UPLOAD
func (h *FileHandler) UploadMultiple(c *fiber.Ctx) error {
	// Ambil setting dari ENV
	maxSize := getEnvAsInt64("MAX_FILE_SIZE", 10*1024*1024) // Default 10MB
	allowed := getEnvAsSlice("ALLOWED_TYPES", "")
	maxFiles := getEnvAsInt64("MAX_FILES", 2)

	cfg := service.UploadConfig{
		FormKey:      "files",
		MaxFiles:     int(maxFiles),
		MaxFileSize:  maxSize,
		AllowedTypes: allowed,
	}

	names, err := h.service.ProcessUpload(c, cfg)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"success": false, "error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "All files uploaded successfully",
		"data":    fiber.Map{"file_names": names},
	})
}

// --- ENDPOINT: GET FILE (Download/View) ---
func (h *FileHandler) GetFile(c *fiber.Ctx) error {
	fileName := c.Params("filename")
	filePath := "./uploads/" + fileName

	// Cek apakah file ada
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"error":   "file_not_found",
		})
	}

	// Mengirim file ke browser (bisa view/download)
	return c.SendFile(filePath)
}

// --- ENDPOINT: DELETE FILE ---
func (h *FileHandler) DeleteFile(c *fiber.Ctx) error {
	fileName := c.Params("filename")

	err := h.service.DeleteFile(fileName)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "file_deleted_successfully",
	})
}

// --- HELPER UNTUK ENV ---
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

	rawParts := strings.Split(val, ",")
	var cleanParts []string

	for _, part := range rawParts {
		// Hapus spasi DAN tanda kutip ganda/tunggal
		trimmed := strings.Trim(part, " \"'")
		if trimmed != "" {
			cleanParts = append(cleanParts, trimmed)
		}
	}
	return cleanParts
}
