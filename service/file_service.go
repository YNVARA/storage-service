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

func (s *FileService) ProcessUpload(c *fiber.Ctx, cfg UploadConfig) ([]domain.FileInfo, error) {
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

	var uploadedFiles []domain.FileInfo
	for _, file := range files {
		// Validasi Size
		if file.Size > cfg.MaxFileSize {
			return nil, fmt.Errorf("file_%s_too_large", file.Filename)
		}

		// Deep MIME Sniffing
		f, _ := file.Open()
		buf := make([]byte, 512)
		f.Read(buf)
		f.Close()
		contentType := http.DetectContentType(buf)

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

		// Simpan
		info, err := s.storage.Save(file)
		if err != nil {
			return nil, err
		}
		uploadedFiles = append(uploadedFiles, info)
	}
	return uploadedFiles, nil
}

func (s *FileService) DeleteFile(fileName string) error {
	return s.storage.Delete(fileName)
}
