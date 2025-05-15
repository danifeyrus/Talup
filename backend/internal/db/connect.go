package db

import (
	"TalUpBackend/internal/models"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	dsn := "host=localhost user=postgres password=R38Ms0Rtx! dbname=Talup port=5432 sslmode=disable"
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Ошибка при подключении к базе данных: %v", err)
	}

	if err := DB.AutoMigrate(&models.User{}, &models.UserWord{}); err != nil {
		log.Fatalf("Ошибка миграции: %v", err)
	}

	log.Println("Подключение к базе данных успешно")
}
