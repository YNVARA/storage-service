package infrastructure

import (
	"archive/zip"
	"io"
	"os"
	"path/filepath"
)

func CreateBackupZip(zipPath string, filesSource string, jsonSource string) error {
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	archive := zip.NewWriter(zipFile)
	defer archive.Close()

	// 1. Masukkan file JSON metadata
	f, _ := os.Open(jsonSource)
	w, _ := archive.Create("metadata.json")
	io.Copy(w, f)
	f.Close()

	// 2. Masukkan semua file di folder uploads
	return filepath.Walk(filesSource, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return err
		}
		header, _ := zip.FileInfoHeader(info)
		header.Name = "uploads/" + filepath.Base(path)
		header.Method = zip.Deflate
		writer, _ := archive.CreateHeader(header)
		file, _ := os.Open(path)
		defer file.Close()
		_, err = io.Copy(writer, file)
		return err
	})
}
