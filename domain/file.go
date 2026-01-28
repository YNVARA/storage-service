package domain

import (
	"mime/multipart"
	"time"

	"gorm.io/gorm"
)

// FileInfo digunakan untuk transfer data antar layer (DTO)
type FileInfo struct {
	FileName     string `json:"file_name"`
	OriginalName string `json:"original_name"`
	Size         int64  `json:"size"`
	ContentType  string `json:"content_type"`
	Checksum     string `json:"checksum"`
	URL          string `json:"url"`
}

// FileEntity adalah skema tabel database
type FileEntity struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	FileName     string         `gorm:"uniqueIndex;type:varchar(255)" json:"file_name"`
	OriginalName string         `gorm:"type:varchar(255)" json:"original_name"`
	Size         int64          `json:"size"`
	ContentType  string         `gorm:"type:varchar(100)" json:"content_type"`
	Checksum     string         `gorm:"type:varchar(64)" json:"checksum"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// FileStorage adalah kontrak untuk simpan/hapus fisik file (Disk)
type FileStorage interface {
	Save(file *multipart.FileHeader) (FileInfo, error)
	Delete(fileName string) error
}

// FileRepository adalah kontrak untuk operasi database (CRUD)
type FileRepository interface {
	Create(file *FileEntity) error
	FindAll() ([]FileEntity, error)
	FindByName(name string) (*FileEntity, error)
	Delete(name string) error
	HardDeleteExpired() error
}
