package domain

import "mime/multipart"

type FileStorage interface {
	Save(file *multipart.FileHeader) (string, error)
	Delete(fileName string) error
}
