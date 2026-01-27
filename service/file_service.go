package service

import (
	"fmt"
	"net/http"
	"storage-service/domain"

	"github.com/gofiber/fiber/v2"
)

type UploadConfig struct {
	FormKey      string
	MaxFiles     int
	MaxFileSize  int64
	AllowedTypes []string
}

type FileService struct {
	storage domain.FileStorage
}

func NewFileService(storage domain.FileStorage) *FileService {
	return &FileService{storage: storage}
}

func (s *FileService) ProcessUpload(c *fiber.Ctx, cfg UploadConfig) ([]string, error) {
	form, err := c.MultipartForm()
	if err != nil {
		return nil, fmt.Errorf("failed_to_parse_form")
	}

	files := form.File[cfg.FormKey]
	if len(files) == 0 {
		return nil, fmt.Errorf("no_files_found_in_key_%s", cfg.FormKey)
	}

	if cfg.MaxFiles > 0 && len(files) > cfg.MaxFiles {
		return nil, fmt.Errorf("too_many_files_max_%d", cfg.MaxFiles)
	}

	var uploadedFiles []string
	for _, file := range files {
		// Validasi Ukuran
		if file.Size > cfg.MaxFileSize {
			return nil, fmt.Errorf("file_%s_too_large_max_%dMB", file.Filename, cfg.MaxFileSize/(1024*1024))
		}

		// Sniff MIME Type
		f, _ := file.Open()
		buf := make([]byte, 512)
		f.Read(buf)
		f.Close()
		contentType := http.DetectContentType(buf)

		// Validasi Allowed Types
		isValid := false
		for _, t := range cfg.AllowedTypes {
			if t == contentType {
				isValid = true
				break
			}
		}

		if !isValid {
			return nil, fmt.Errorf("type_%s_not_allowed_for_%s", contentType, file.Filename)
		}

		name, err := s.storage.Save(file)
		if err != nil {
			return nil, err
		}
		uploadedFiles = append(uploadedFiles, name)
	}
	return uploadedFiles, nil
}

func (s *FileService) DeleteFile(fileName string) error {
	return s.storage.Delete(fileName)
}
