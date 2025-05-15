package main

import (
	"TalUpBackend/internal/db"
	"TalUpBackend/internal/handlers"
	"TalUpBackend/internal/middleware"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {

	db.InitDB()

	r := gin.Default()

	r.POST("/auth/register", handlers.Register)

	r.POST("/auth/login", handlers.Login)

	r.Static("/uploads", "./uploads")

	handlers.LoadTasks()
	handlers.LoadBaseWords()

	authorized := r.Group("/api")
	authorized.Use(middleware.AuthMiddleware())
	{
		authorized.GET("/next-task", handlers.GetNextTask)
		authorized.POST("/submit-result", handlers.SubmitResult)
		authorized.GET("/profile", handlers.GetProfile)
		authorized.POST("/profile/update", handlers.UpdateProfile)
		authorized.POST("/profile/update-avatar", handlers.UpdateAvatar)
		authorized.PUT("/progress/update", handlers.UpdateProgress)
		authorized.GET("/streak", handlers.GetStreak)
		authorized.PUT("/streak/update", handlers.UpdateStreak)
		authorized.GET("/leaderboard", handlers.GetLeaderboard)
		authorized.PUT("/profile/update-password", handlers.UpdatePassword)
		authorized.GET("/random-word", handlers.GetRandomWord)
		authorized.GET("/word-list", handlers.GetWordList)
		authorized.POST("/shop/buy-life", handlers.BuyLife)
		authorized.POST("/asr-submit", handlers.SubmitAsrResult)
	}

	log.Fatal(r.Run(":8080"))
}
