package models

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

type User struct {
	ID                  uint           `json:"id" gorm:"primary_key"`
	Username            string         `gorm:"unique;not null" json:"username"`
	Email               string         `gorm:"unique;not null" json:"email"`
	PasswordHash        string         `json:"password_hash"`
	Name                string         `json:"name"`
	Gender              string         `json:"gender"`
	Language            string         `json:"language"`
	Birthdate           string         `json:"birthdate"`
	CurrentLevel        string         `json:"current_level"`
	AimLevel            string         `json:"aim_level"`
	StudyTime           string         `json:"study_time"`
	Goals               pq.StringArray `json:"goals" gorm:"type:text[]"`
	LastActiveDate      string         `json:"last_active_date"`
	CheckedDays         pq.StringArray `json:"checked_days" gorm:"type:text[]"`
	Xp                  int            `json:"xp" gorm:"default:0"`
	MaxXp               int            `json:"max_xp" gorm:"default:20"`
	Level               int            `json:"level" gorm:"default:1"`
	Time                string         `json:"time"`
	Avatar              string         `json:"avatar"`
	StreakDays          pq.StringArray `gorm:"type:text[]" json:"streak_days"`
	LastLogin           string         `json:"last_login"`
	StreakCount         int            `json:"streak"`
	LearnedWords        int            `json:"learnedWords" gorm:"column:learned_words"`
	LearningWords       int            `json:"learningWords" gorm:"column:learning_words"`
	TreePhase           int            `json:"treePhase" gorm:"default:0"`
	TreePhaseProgress   float64        `json:"treePhaseProgress" gorm:"default:0"`
	TodayLearnedWords   int            `json:"todayLearnedWords" gorm:"default:0"`
	Lives               int            `gorm:"default:5"`
	LastLifeAdded       string         `gorm:"default:''"`
	LifeRestoreAt       time.Time
	BonusLives          int    `json:"bonusLives" gorm:"default:0"`
	LastDailyGoalReward string `json:"lastDailyGoalReward"`
	LastStreakReward    string `json:"lastStreakReward"`
	TreeXp              int    `json:"treeXp" gorm:"default:0"`
	Coins               int    `json:"coins" gorm:"default:0"`
}

func (user *User) BeforeCreate(tx *gorm.DB) (err error) {
	return nil
}
