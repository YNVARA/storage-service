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
	repo    domain.FileRepository
}

func NewFileService(storage domain.FileStorage, repo domain.FileRepository) *FileService {
	return &FileService{
		storage: storage,
		repo:    repo,
	}
}

func (s *FileService) GetAllFiles() ([]domain.FileEntity, error) {
	return s.repo.FindAll()
}

func (s *FileService) CleanDeletedMetadata() error {
	return s.repo.HardDeleteExpired()
}

func (s *FileService) ProcessUpload(c *fiber.Ctx, cfg UploadConfig) ([]domain.FileEntity, error) {
	form, err := c.MultipartForm()
	if err != nil {
		// fmt.Println("DEBUG ERROR:", err)
		return nil, fmt.Errorf("failed_to_parse_form")
	}

	files := form.File[cfg.FormKey]
	if len(files) == 0 {
		return nil, fmt.Errorf("no_files_found_in_key_%s", cfg.FormKey)
	}
	if cfg.MaxFiles > 0 && len(files) > cfg.MaxFiles {
		return nil, fmt.Errorf("too_many_files_max_%d", cfg.MaxFiles)
	}

	var savedEntities []domain.FileEntity
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

		// 4. Simpan FISIK ke Disk
		info, err := s.storage.Save(file)
		if err != nil {
			return nil, err
		}

		// 5. Mapping ke Entity Database
		entity := domain.FileEntity{
			FileName:     info.FileName,
			OriginalName: info.OriginalName,
			Size:         info.Size,
			ContentType:  info.ContentType,
			Checksum:     info.Checksum,
		}

		// 6. Simpan METADATA ke Database
		if err := s.repo.Create(&entity); err != nil {
			// Jika gagal di DB, hapus file yang sudah terlanjur di disk (Rollback manual)
			_ = s.storage.Delete(info.FileName)
			return nil, fmt.Errorf("database_error: %v", err)
		}

		savedEntities = append(savedEntities, entity)
	}
	return savedEntities, nil
}

func (s *FileService) DeleteFile(fileName string) error {
	// Hapus di DB dulu (Soft Delete)
	if err := s.repo.Delete(fileName); err != nil {
		return err
	}
	// Baru hapus fisiknya
	return s.storage.Delete(fileName)
}
