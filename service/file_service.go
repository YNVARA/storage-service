package service

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
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

func (s *FileService) ExportAll() (string, error) {
	zipPath := "backup_data.zip"

	// 1. Ambil data dari Repository
	data, err := s.repo.GetBackupData()
	if err != nil {
		return "", err
	}

	// 2. Buat file ZIP
	newZipFile, err := os.Create(zipPath)
	if err != nil {
		return "", err
	}
	defer newZipFile.Close()

	zipWriter := zip.NewWriter(newZipFile)
	defer zipWriter.Close()

	// 3. Masukkan Metadata JSON ke ZIP
	jsonBytes, _ := json.MarshalIndent(data, "", "  ")
	w1, _ := zipWriter.Create("metadata.json")
	w1.Write(jsonBytes)

	// 4. Masukkan seluruh isi folder ./uploads ke ZIP
	err = filepath.Walk("./uploads", func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return err
		}

		file, _ := os.Open(path)
		defer file.Close()

		w, _ := zipWriter.Create("files/" + filepath.Base(path))
		io.Copy(w, file)
		return nil
	})

	return zipPath, err
}

// ImportAll: Mengekstrak ZIP dan mengembalikan data ke DB & Folder
func (s *FileService) ImportAll(zipPath string) error {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer reader.Close()

	var metadata []domain.FileEntity

	for _, file := range reader.File {
		// 1. Ekstrak Metadata JSON
		if file.Name == "metadata.json" {
			f, _ := file.Open()
			json.NewDecoder(f).Decode(&metadata)
			f.Close()
		}

		// 2. Ekstrak File Fisik ke folder ./uploads
		if filepath.Dir(file.Name) == "files" {
			f, _ := file.Open()
			dstPath := filepath.Join("./uploads", filepath.Base(file.Name))
			dst, _ := os.OpenFile(dstPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
			io.Copy(dst, f)
			dst.Close()
			f.Close()
		}
	}

	// 3. Masukkan ke Database melalui Repository
	if len(metadata) > 0 {
		return s.repo.RestoreData(metadata)
	}

	return fmt.Errorf("metadata tidak ditemukan dalam file backup")
}
