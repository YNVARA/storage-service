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

func (h *FileHandler) DeleteFile(c *fiber.Ctx) error {
	err := h.service.DeleteFile(c.Params("filename"))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"success": false, "error": err.Error()})
	}
	return c.JSON(fiber.Map{"success": true, "message": "deleted"})
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
