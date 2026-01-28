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
	ID           uint           `gorm:"primaryKey;column:id" json:"id"`
	FileName     string         `gorm:"uniqueIndex;type:varchar(255);column:file_name" json:"file_name"`
	OriginalName string         `gorm:"type:varchar(255);column:original_name" json:"original_name"`
	Size         int64          `gorm:"column:size" json:"size"`
	ContentType  string         `gorm:"type:varchar(100);column:content_type" json:"content_type"`
	Checksum     string         `gorm:"type:varchar(64);column:checksum" json:"checksum"`
	CreatedAt    time.Time      `gorm:"column:created_at" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index;column:deleted_at" json:"-"`
}

// Tambahkan method ini agar nama tabel tidak diacak oleh Garble
func (FileEntity) TableName() string {
	return "file_entities"
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
	GetBackupData() ([]FileEntity, error)
	RestoreData(data []FileEntity) error
}
