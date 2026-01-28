package infrastructure

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func ConnectDB() *gorm.DB {
	// Ambil data dari ENV
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	name := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
		host, user, pass, name, port)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("Gagal koneksi ke database: %v", err)
	}

	// Optimasi Connection Pool
	sqlDB, _ := db.DB()
	sqlDB.SetMaxIdleConns(10)           // Koneksi standby
	sqlDB.SetMaxOpenConns(100)          // Maksimal koneksi terbuka
	sqlDB.SetConnMaxLifetime(time.Hour) // Durasi koneksi sebelum di-refresh

	log.Println("✅ Database terkoneksi dengan sukses!")
	return db
}
