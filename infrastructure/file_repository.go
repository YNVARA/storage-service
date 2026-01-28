package infrastructure

import (
	"storage-service/domain"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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

func (r *fileRepository) GetBackupData() ([]domain.FileEntity, error) {
	var files []domain.FileEntity
	// Menggunakan Unscoped agar data yang di-delete (soft delete) tetap ikut ter-backup
	err := r.db.Unscoped().Find(&files).Error
	return files, err
}

// RestoreData melakukan sinkronisasi data dari file backup ke database
func (r *fileRepository) RestoreData(files []domain.FileEntity) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, file := range files {
			err := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "file_name"}}, // Sesuaikan dengan tag 'column:file_name' di domain
				DoUpdates: clause.AssignmentColumns([]string{"original_name", "size", "content_type", "checksum", "updated_at", "deleted_at"}),
			}).Create(&file).Error

			if err != nil {
				return err
			}
		}
		return nil
	})
}
