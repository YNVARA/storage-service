package domain

import "mime/multipart"

type FileInfo struct {
	FileName     string `json:"file_name"`
	OriginalName string `json:"original_name"`
	Size         int64  `json:"size"`
	ContentType  string `json:"content_type"`
	Checksum     string `json:"checksum"`
	URL          string `json:"url"`
}

type FileStorage interface {
	Save(file *multipart.FileHeader) (FileInfo, error)
	Delete(fileName string) error
}
