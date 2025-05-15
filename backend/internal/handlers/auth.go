package handlers

import (
	"TalUpBackend/internal/db"
	"TalUpBackend/internal/models"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

func calculateTreePhaseProgress(todayWords int, streak int, level int) float64 {
	score := (float64(todayWords) * 0.5) + (float64(streak) * 0.3) + (float64(level) * 0.2)
	switch {
	case score < 3:
		return (score / 3.0) * 100
	case score < 6:
		return ((score - 3) / 3.0) * 100
	case score < 9:
		return ((score - 6) / 3.0) * 100
	case score < 12:
		return ((score - 9) / 3.0) * 100
	case score < 15:
		return ((score - 12) / 3.0) * 100
	default:
		return 100
	}
}

func calculateTreePhase(todayWords int, streak int, level int) int {
	score := (float64(todayWords) * 0.5) + (float64(streak) * 0.3) + (float64(level) * 0.2)
	switch {
	case score < 3:
		return 0
	case score < 6:
		return 1
	case score < 9:
		return 2
	case score < 12:
		return 3
	case score < 15:
		return 4
	default:
		return 5
	}
}

func RecalculateTreePhase(user *models.User) {
	thresholds := []int{0, 30, 80, 160, 280, 450}
	xp := user.TreeXp
	phase := 0

	for i := len(thresholds) - 1; i >= 0; i-- {
		if xp >= thresholds[i] {
			phase = i
			break
		}
	}

	user.TreePhase = phase
	if phase+1 < len(thresholds) {
		user.TreePhaseProgress = float64(xp-thresholds[phase]) / float64(thresholds[phase+1]-thresholds[phase]) * 100
	} else {
		user.TreePhaseProgress = 100
	}
}

func Login(c *gin.Context) {
	var loginData struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные в запросе"})
		return
	}

	var user models.User
	if err := db.DB.Where("email = ?", loginData.Email).First(&user).Error; err != nil {
		fmt.Println("Авторизация отклонена: email не найден")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный email или пароль"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(loginData.Password)); err != nil {
		fmt.Println("Авторизация отклонена: неверный пароль")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный email или пароль"})
		return
	}

	now := time.Now()
	today := now.Format("2006-01-02")
	lastLoginDate, err := time.Parse("2006-01-02", user.LastLogin)
	lastLoginStr := ""
	if err == nil {
		lastLoginStr = lastLoginDate.Format("2006-01-02")
	}
	yesterday := now.AddDate(0, 0, -1).Format("2006-01-02")

	if lastLoginStr != today {
		user.TodayLearnedWords = 0

		if lastLoginStr == yesterday {
			user.StreakCount += 1
		} else {
			user.StreakCount = 1
			user.StreakDays = []string{}
		}

		weekdayMap := map[string]string{
			"Monday": "ПН", "Tuesday": "ВТ", "Wednesday": "СР", "Thursday": "ЧТ",
			"Friday": "ПТ", "Saturday": "СБ", "Sunday": "ВС",
		}
		todayStr := weekdayMap[now.Weekday().String()]
		hasToday := false
		for _, d := range user.StreakDays {
			if d == todayStr {
				hasToday = true
				break
			}
		}
		if !hasToday {
			user.StreakDays = append(user.StreakDays, todayStr)
		}

		allDays := []string{"ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"}
		seen := map[string]bool{}
		filtered := []string{}
		for _, d := range allDays {
			for _, val := range user.StreakDays {
				if val == d && !seen[d] {
					filtered = append(filtered, d)
					seen[d] = true
				}
			}
		}
		user.StreakDays = filtered
		user.LastLogin = today
	}

	now = time.Now()
	today = now.Format("2006-01-02")

	lastLogin, _ := time.Parse("2006-01-02", user.LastLogin)
	daysInactive := int(now.Sub(lastLogin).Hours() / 24)

	if daysInactive >= 3 {
		penalty := (daysInactive - 2) * 2
		user.TreeXp -= penalty
		if user.TreeXp < 0 {
			user.TreeXp = 0
		}
	}

	RecalculateTreePhase(&user)

	db.DB.Save(&user)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
	})
	tokenString, err := token.SignedString([]byte("secret_key"))
	if err != nil {
		fmt.Println("Ошибка генерации токена")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка авторизации. Попробуйте позже"})
		return
	}

	fmt.Printf("Вход выполнен. ID: %d\n", user.ID)

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
	})
}

func Register(c *gin.Context) {
	var userData struct {
		Email        string   `json:"email"`
		Password     string   `json:"password"`
		Username     string   `json:"username"`
		Name         string   `json:"name"`
		Gender       string   `json:"gender"`
		Language     string   `json:"language"`
		BirthDate    string   `json:"birthDate"`
		Goals        []string `json:"goals"`
		CurrentLevel string   `json:"currentLevel"`
		AimLevel     string   `json:"aimLevel"`
		Time         string   `json:"time"`
		Avatar       string   `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&userData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные в запросе"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(userData.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обработке пароля"})
		return
	}

	if userData.Avatar == "" {
		userData.Avatar = "/uploads/avatars/avadefault.jpg"
	}

	aimLevel := "C"

	user := models.User{
		Email:        userData.Email,
		Username:     userData.Username,
		PasswordHash: string(hash),
		Name:         userData.Name,
		Gender:       userData.Gender,
		Language:     userData.Language,
		Birthdate:    userData.BirthDate,
		Goals:        userData.Goals,
		CurrentLevel: userData.CurrentLevel,
		AimLevel:     aimLevel,
		Time:         userData.Time,
		Avatar:       userData.Avatar,
		TreePhase:    1,
		LastLogin:    time.Now().Format("2006-01-02"),
		StreakCount:  1,
		StreakDays: []string{
			func() string {
				return map[string]string{
					"Monday": "ПН", "Tuesday": "ВТ", "Wednesday": "СР", "Thursday": "ЧТ",
					"Friday": "ПТ", "Saturday": "СБ", "Sunday": "ВС",
				}[time.Now().Weekday().String()]
			}(),
		},
		BonusLives: 0,
	}

	if err := db.DB.Create(&user).Error; err != nil {
		fmt.Println("Регистрация отклонена: не удалось создать пользователя")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка регистрации. Попробуйте позже"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
	})
	tokenString, err := token.SignedString([]byte("secret_key"))
	if err != nil {
		fmt.Println("Ошибка генерации токена после регистрации")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка авторизации. Попробуйте позже"})
		return
	}

	fmt.Printf("Регистрация завершена. ID: %d\n", user.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Регистрация прошла успешно",
		"token":   tokenString,
		"name":    user.Name,
		"email":   user.Email,
	})
}

func GetProfile(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Необходимо авторизоваться"})
		return
	}

	tokenStr := authHeader[len("Bearer "):]
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte("secret_key"), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Сессия истекла. Войдите заново"})
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	userID := claims["user_id"]

	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		return
	}

	now := time.Now()
	if user.LastLifeAdded != "" {
		lastAdded, err := time.Parse("2006-01-02 15:04:05", user.LastLifeAdded)
		if err == nil {
			minutesPassed := int(now.Sub(lastAdded).Minutes())
			if minutesPassed < 0 {
				minutesPassed = 0
			}
			livesToAdd := minutesPassed / 15

			if livesToAdd > 0 {
				if user.Lives < 5 {
					user.Lives += livesToAdd
					if user.Lives > 5 {
						user.Lives = 5
					}
				}
				user.LastLifeAdded = now.Format("2006-01-02 15:04:05")
				db.DB.Save(&user)
			}
		}
	}
	today := now.Format("2006-01-02")
	lastLoginDate, err := time.Parse("2006-01-02", user.LastLogin)
	lastLoginStr := ""
	if err == nil {
		lastLoginStr = lastLoginDate.Format("2006-01-02")
	}
	yesterday := now.AddDate(0, 0, -1).Format("2006-01-02")

	if lastLoginStr != today {
		user.TodayLearnedWords = 0

		if lastLoginStr == yesterday {
			user.StreakCount += 1
		} else {
			user.StreakCount = 1
			user.StreakDays = []string{}
		}

		if user.StreakCount >= 3 && user.StreakCount%2 == 1 {
			user.BonusLives += 2
		}

		weekdayMap := map[string]string{
			"Monday": "ПН", "Tuesday": "ВТ", "Wednesday": "СР", "Thursday": "ЧТ",
			"Friday": "ПТ", "Saturday": "СБ", "Sunday": "ВС",
		}
		todayStr := weekdayMap[now.Weekday().String()]
		hasToday := false
		for _, d := range user.StreakDays {
			if d == todayStr {
				hasToday = true
				break
			}
		}
		if !hasToday {
			user.StreakDays = append(user.StreakDays, todayStr)
		}

		allDays := []string{"ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"}
		seen := map[string]bool{}
		filtered := []string{}
		for _, d := range allDays {
			for _, val := range user.StreakDays {
				if val == d && !seen[d] {
					filtered = append(filtered, d)
					seen[d] = true
				}
			}
		}
		user.StreakDays = filtered
		user.LastLogin = today
		db.DB.Save(&user)
	}

	now = time.Now()
	today = now.Format("2006-01-02")

	lastLogin, _ := time.Parse("2006-01-02", user.LastLogin)
	daysInactive := int(now.Sub(lastLogin).Hours() / 24)

	if daysInactive >= 3 {
		penalty := (daysInactive - 2) * 2
		user.TreeXp -= penalty
		if user.TreeXp < 0 {
			user.TreeXp = 0
		}
	}

	RecalculateTreePhase(&user)

	dailyGoal := 5
	switch user.Time {
	case "one":
		dailyGoal = 3
	case "two":
		dailyGoal = 5
	case "three":
		dailyGoal = 8
	case "more":
		dailyGoal = 12
	}

	if user.TodayLearnedWords >= dailyGoal && user.LastDailyGoalReward != today {
		user.BonusLives += 2
		user.LastDailyGoalReward = today
		db.DB.Save(&user)
	}

	if user.StreakCount >= 3 && user.StreakCount%2 == 1 && user.LastStreakReward != today {
		user.BonusLives += 2
		user.TreeXp += 5
		user.LastStreakReward = today
		RecalculateTreePhase(&user)
		db.DB.Save(&user)
	}

	avatarURL := user.Avatar
	if avatarURL != "" && avatarURL[0] == '/' {
		avatarURL = fmt.Sprintf("http://%s%s", c.Request.Host, user.Avatar)
	}

	fmt.Printf("Профиль загружен. ID: %d\n", user.ID)

	now = time.Now()
	if user.Lives < 5 && !user.LifeRestoreAt.IsZero() {
		secondsPassed := int(now.Sub(user.LifeRestoreAt).Seconds()) + 1
		livesToAdd := secondsPassed / 900

		if livesToAdd > 0 {
			user.Lives += livesToAdd
			if user.Lives >= 5 {
				user.Lives = 5
				user.LifeRestoreAt = time.Time{}
			} else {
				user.LifeRestoreAt = user.LifeRestoreAt.Add(time.Duration(livesToAdd*900) * time.Second)
			}
			db.DB.Save(&user)
		}
	}

	secondsUntilNextLife := 0
	if user.Lives < 5 && !user.LifeRestoreAt.IsZero() {
		now := time.Now()
		secondsPassed := int(now.Sub(user.LifeRestoreAt).Seconds())
		if secondsPassed < 900 {
			secondsUntilNextLife = 900 - secondsPassed
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"email":             user.Email,
		"name":              user.Name,
		"birthdate":         user.Birthdate,
		"xp":                user.Xp,
		"maxXp":             user.MaxXp,
		"level":             user.Level,
		"username":          user.Username,
		"gender":            user.Gender,
		"language":          user.Language,
		"currentLevel":      user.CurrentLevel,
		"aimLevel":          user.AimLevel,
		"time":              user.Time,
		"avatar":            avatarURL,
		"learnedWords":      user.LearnedWords,
		"learningWords":     user.LearningWords,
		"treePhase":         user.TreePhase,
		"treePhaseProgress": user.TreePhaseProgress,
		"todayLearnedWords": user.TodayLearnedWords,
		"dailyGoal":         dailyGoal,
		"streakDays":        user.StreakDays,
		"streak":            user.StreakCount,
		"lives":             user.Lives,
		"lastLifeAdded":     user.LastLifeAdded,
		"lifeRestoreAt":     user.LifeRestoreAt.Format("2006-01-02 15:04:05"),
		"serverTime":        time.Now().Format("2006-01-02 15:04:05"),
		"nextLifeInSeconds": secondsUntilNextLife,
		"bonusLives":        user.BonusLives,
		"totalLives":        user.Lives + user.BonusLives,
		"coins":             user.Coins,
	})
}

func UpdateProfile(c *gin.Context) {
	tokenStr := c.GetHeader("Authorization")[len("Bearer "):]
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte("secret_key"), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Сессия истекла. Войдите заново"})
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	userID := claims["user_id"]

	var updateData struct {
		Name      string `json:"name"`
		Birthdate string `json:"birthdate"`
		Avatar    string `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные профиля"})
		return
	}

	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		return
	}

	user.Name = updateData.Name
	user.Birthdate = updateData.Birthdate
	user.Avatar = updateData.Avatar

	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить профиль"})
		return
	}

	fmt.Printf("Профиль обновлён. ID: %d\n", user.ID)

	c.JSON(http.StatusOK, gin.H{"message": "Профиль успешно обновлён"})
}

func UpdateProgress(c *gin.Context) {
	fmt.Println("Прогресс обновлён вручную")
	c.JSON(http.StatusOK, gin.H{"message": "Прогресс успешно обновлён"})
}

func GetStreak(c *gin.Context) {
	tokenStr := c.GetHeader("Authorization")[len("Bearer "):]
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte("secret_key"), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Сессия истекла"})
		return
	}

	userID := token.Claims.(jwt.MapClaims)["user_id"]
	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		return
	}

	fmt.Printf("Запрос информации о стрике. ID: %d\n", user.ID)

	c.JSON(http.StatusOK, gin.H{
		"days":      user.StreakDays,
		"lastLogin": user.LastLogin,
		"streak":    user.StreakCount,
	})
}

func UpdateStreak(c *gin.Context) {
	tokenStr := c.GetHeader("Authorization")[len("Bearer "):]
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte("secret_key"), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Сессия истекла"})
		return
	}

	userID := token.Claims.(jwt.MapClaims)["user_id"]
	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		return
	}

	now := time.Now()
	today := now.Format("2006-01-02")
	lastLoginDate, err := time.Parse("2006-01-02", user.LastLogin)
	lastLoginStr := ""
	if err == nil {
		lastLoginStr = lastLoginDate.Format("2006-01-02")
	}
	yesterday := now.AddDate(0, 0, -1).Format("2006-01-02")

	if lastLoginStr == today {
		fmt.Printf("Стрик уже обновлён сегодня. ID: %d\n", user.ID)
		c.JSON(http.StatusOK, gin.H{
			"message": "Стрик уже обновлён сегодня",
			"days":    user.StreakDays,
			"streak":  user.StreakCount,
		})
		return
	}

	if lastLoginStr == yesterday {
		user.StreakCount += 1
	} else {
		user.StreakCount = 1
		user.StreakDays = []string{}
	}

	weekdayMap := map[string]string{
		"Monday": "ПН", "Tuesday": "ВТ", "Wednesday": "СР", "Thursday": "ЧТ",
		"Friday": "ПТ", "Saturday": "СБ", "Sunday": "ВС",
	}
	todayStr := weekdayMap[now.Weekday().String()]

	hasToday := false
	for _, d := range user.StreakDays {
		if d == todayStr {
			hasToday = true
			break
		}
	}
	if !hasToday {
		user.StreakDays = append(user.StreakDays, todayStr)
	}

	allDays := []string{"ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"}
	seen := map[string]bool{}
	filtered := []string{}
	for _, d := range allDays {
		for _, val := range user.StreakDays {
			if val == d && !seen[d] {
				filtered = append(filtered, d)
				seen[d] = true
			}
		}
	}
	user.StreakDays = filtered

	user.LastLogin = today
	user.TreePhase = calculateTreePhase(user.TodayLearnedWords, user.StreakCount, user.Level)
	user.TreePhaseProgress = calculateTreePhaseProgress(user.TodayLearnedWords, user.StreakCount, user.Level)

	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сохранить стрик"})
		return
	}

	fmt.Printf("Стрик обновлён. ID: %d, Дней: %d\n", user.ID, user.StreakCount)

	c.JSON(http.StatusOK, gin.H{
		"message": "Стрик обновлён",
		"days":    user.StreakDays,
		"streak":  user.StreakCount,
	})
}

func UpdateAvatar(c *gin.Context) {
	tokenStr := c.GetHeader("Authorization")[len("Bearer "):]
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte("secret_key"), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Сессия истекла. Войдите заново"})
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	userID := claims["user_id"]

	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Не удалось получить файл"})
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Разрешены только изображения .jpg, .jpeg, .png"})
		return
	}

	filename := fmt.Sprintf("user_%v_%d%s", userID, time.Now().Unix(), ext)
	savePath := filepath.Join("uploads/avatars", filename)

	if err := os.MkdirAll("uploads/avatars", os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать директорию"})
		return
	}

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка сохранения файла"})
		return
	}

	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		return
	}

	user.Avatar = "/uploads/avatars/" + filename

	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить профиль"})
		return
	}

	fmt.Printf("Аватар обновлён. ID: %d\n", user.ID)

	fullAvatarURL := fmt.Sprintf("http://%s%s", c.Request.Host, user.Avatar)
	c.JSON(http.StatusOK, gin.H{
		"message": "Аватар успешно обновлён",
		"avatar":  fullAvatarURL,
	})
}

func UpdatePassword(c *gin.Context) {
	tokenStr := c.GetHeader("Authorization")[len("Bearer "):]
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte("secret_key"), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Сессия истекла. Войдите заново"})
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	userID := claims["user_id"]

	var request struct {
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&request); err != nil || request.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при хешировании пароля"})
		return
	}

	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		return
	}

	user.PasswordHash = string(hash)
	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить пароль"})
		return
	}

	fmt.Printf("Пароль обновлён. ID: %d\n", user.ID)

	c.JSON(http.StatusOK, gin.H{"message": "Пароль успешно обновлён"})
}

func GetLeaderboard(c *gin.Context) {
	tokenStr := c.GetHeader("Authorization")
	if tokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Отсутствует токен авторизации"})
		return
	}

	token, err := jwt.Parse(tokenStr[len("Bearer "):], func(token *jwt.Token) (interface{}, error) {
		return []byte("secret_key"), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Сессия истекла. Войдите заново"})
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	currentUserID := uint(claims["user_id"].(float64))

	var users []models.User
	db.DB.Order("learned_words DESC").Limit(100).Find(&users)

	leaderboard := []gin.H{}
	for i, u := range users {
		avatarURL := u.Avatar
		if avatarURL != "" && avatarURL[0] == '/' {
			avatarURL = fmt.Sprintf("http://%s%s", c.Request.Host, u.Avatar)
		}

		entry := gin.H{
			"id":        u.ID,
			"name":      u.Name,
			"avatar":    avatarURL,
			"treeXp":    u.TreeXp,
			"position":  i + 1,
			"isCurrent": u.ID == currentUserID,
		}
		leaderboard = append(leaderboard, entry)
	}

	fmt.Printf("Таблица лидеров отправлена. Записей: %d\n", len(leaderboard))

	c.JSON(http.StatusOK, leaderboard)
}
