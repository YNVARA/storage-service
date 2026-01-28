package infrastructure

import (
	"storage-service/domain"

	"gorm.io/gorm"
)

type fileRepository struct {
	db *gorm.DB
}

func NewFileRepository(db *gorm.DB) domain.FileRepository {
	return &fileRepository{db: db}
}

func (r *fileRepository) Create(file *domain.FileEntity) error {
	return r.db.Create(file).Error
}

func (r *fileRepository) HardDeleteExpired() error {
	return r.db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&domain.FileEntity{}).Error
}

func (r *fileRepository) FindAll() ([]domain.FileEntity, error) {
	var files []domain.FileEntity
	err := r.db.Find(&files).Error
	return files, err
}

func (r *fileRepository) FindByName(name string) (*domain.FileEntity, error) {
	var file domain.FileEntity
	err := r.db.Where("file_name = ?", name).First(&file).Error
	return &file, err
}

func (r *fileRepository) Delete(name string) error {
	return r.db.Where("file_name = ?", name).Delete(&domain.FileEntity{}).Error
}
