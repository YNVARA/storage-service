package infrastructure

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"storage-service/domain"

	"github.com/google/uuid"
)

type localStorage struct {
	basePath string
}

func NewLocalStorage(path string) domain.FileStorage {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		_ = os.MkdirAll(path, 0755)
	}
	return &localStorage{basePath: path}
}

func (s *localStorage) Save(fileHeader *multipart.FileHeader) (string, error) {
	newFileName := uuid.New().String() + filepath.Ext(fileHeader.Filename)
	fullPath := filepath.Join(s.basePath, newFileName)

	src, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return "", err
	}
	return newFileName, nil
}

func (s *localStorage) Delete(fileName string) error {
	fullPath := filepath.Join(s.basePath, fileName)

	// Cek apakah file ada sebelum dihapus
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return fmt.Errorf("file_not_found")
	}

	return os.Remove(fullPath)
}
