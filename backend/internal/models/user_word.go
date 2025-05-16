package models

type UserWord struct {
	ID                   uint   `gorm:"primaryKey"`
	UserID               uint   `gorm:"not null"`
	WordID               uint   `gorm:"not null"`
	Repeats              int    `gorm:"default:0"`
	Mistakes             int    `gorm:"default:0"`
	Status               string `gorm:"default:'new'"`
	LastSeen             string
	Coefficient          float64 `gorm:"default:0"`
	TaskTypesPassed      string  `gorm:"default:''"`
	RepeatsStandard      int     `gorm:"default:0"`
	RepeatsTranslation   int     `gorm:"default:0"`
	RepeatsShuffle       int     `gorm:"default:0"`
	RepeatsAsr           int     `gorm:"default:0"`
	CompletedStandard    bool
	CompletedTranslation bool
	CompletedShuffle     bool
	CompletedAsr         bool
}
