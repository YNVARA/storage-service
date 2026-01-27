package infrastructure

import (
	"crypto/md5"
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

func (s *localStorage) Save(fileHeader *multipart.FileHeader) (domain.FileInfo, error) {
	newFileName := uuid.New().String() + filepath.Ext(fileHeader.Filename)
	fullPath := filepath.Join(s.basePath, newFileName)

	src, err := fileHeader.Open()
	if err != nil {
		return domain.FileInfo{}, err
	}
	defer src.Close()

	dst, err := os.Create(fullPath)
	if err != nil {
		return domain.FileInfo{}, err
	}
	defer dst.Close()

	// OPTIMASI: Gunakan MD5 Hash sebagai writer
	hash := md5.New()

	// TeeReader: Sambil data dibaca untuk ditulis ke Disk (dst),
	// data tersebut juga otomatis dialirkan ke Hash (hash).
	// Ini menghindari proses pembacaan file dua kali (Seek).
	multiWriter := io.MultiWriter(dst, hash)

	if _, err = io.Copy(multiWriter, src); err != nil {
		return domain.FileInfo{}, err
	}

	return domain.FileInfo{
		FileName:     newFileName,
		OriginalName: fileHeader.Filename,
		Size:         fileHeader.Size,
		ContentType:  fileHeader.Header.Get("Content-Type"),
		Checksum:     fmt.Sprintf("%x", hash.Sum(nil)),
		URL:          "/api/v1/file/" + newFileName,
	}, nil
}

func (s *localStorage) Delete(fileName string) error {
	fullPath := filepath.Join(s.basePath, fileName)
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return fmt.Errorf("file_not_found")
	}
	return os.Remove(fullPath)
}
