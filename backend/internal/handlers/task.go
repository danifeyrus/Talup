package handlers

import (
	"TalUpBackend/internal/db"
	"TalUpBackend/internal/models"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"math/rand"
	"mime/multipart"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type WordEntry struct {
	ID   int    `json:"id"`
	Word string `json:"word"`
}

var baseWords map[uint]string

func LoadBaseWords() {
	baseWords = make(map[uint]string)
	data, err := ioutil.ReadFile("data/words.json")
	if err != nil {
		panic("Не удалось загрузить words.json: " + err.Error())
	}

	var words []WordEntry
	if err := json.Unmarshal(data, &words); err != nil {
		panic("Ошибка парсинга words.json: " + err.Error())
	}

	for _, w := range words {
		baseWords[uint(w.ID)] = w.Word
	}
	fmt.Printf("Загружено слов: %d\n", len(baseWords))
}

type Task struct {
	ID                string   `json:"id"`
	WordID            uint     `json:"word_id"`
	MaskedSentence    string   `json:"masked_sentence"`
	Sentence          string   `json:"sentence"`
	CorrectAnswer     string   `json:"correct_answer"`
	Translation       string   `json:"translation"`
	Difficulty        string   `json:"difficulty"`
	Options           []string `json:"options"`
	TranslationTarget string   `json:"translation_target"`
	Type              string   `json:"type"`
	Text              string   `json:"text,omitempty"`
}

type SubmitInput struct {
	WordID   uint   `json:"word_id"`
	Success  bool   `json:"success"`
	TaskType string `json:"task_type"`
}

func callModel(masked, correct string) []string {
	payload := map[string]string{
		"text":    masked,
		"correct": correct,
	}
	body, _ := json.Marshal(payload)
	resp, err := http.Post("http://127.0.0.1:8000/predict/", "application/json", bytes.NewBuffer(body))
	if err != nil {
		fmt.Println("Ошибка запроса к модели")
		return nil
	}
	defer resp.Body.Close()
	respBody, _ := ioutil.ReadAll(resp.Body)
	var data map[string][]string
	json.Unmarshal(respBody, &data)
	clean := []string{}
	for _, word := range data["words"] {
		if trimmed := strings.TrimSpace(word); trimmed != "" {
			clean = append(clean, trimmed)
		}
	}
	return clean
}

func convertLevel(level string) string {
	switch level {
	case "start", "A1", "A2":
		return "A"
	case "medium", "B1", "B2":
		return "B"
	case "advanced", "C1", "C2":
		return "C"
	default:
		return "A"
	}
}

func isBetween(value, low, high string) bool {
	order := map[string]int{"A": 1, "B": 2, "C": 3}
	return order[value] >= order[low] && order[value] <= order[high]
}

var tasks []Task

func LoadTasks() {
	file, err := ioutil.ReadFile("data/tasks_for_model.json")
	if err != nil {
		panic("Failed to load tasks JSON: " + err.Error())
	}
	json.Unmarshal(file, &tasks)
	fmt.Printf("Загружено заданий: %d\n", len(tasks))
}

func generateTaskID(wordID uint) string {
	return fmt.Sprintf("%d_%d", time.Now().UnixNano(), wordID)
}

func GetNextTask(c *gin.Context) {
	userData, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user := userData.(models.User)

	if user.Lives+user.BonusLives <= 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Недостаточно жизней"})
		return
	}

	minLevel := convertLevel(user.CurrentLevel)
	maxLevel := convertLevel(user.AimLevel)

	var progress []models.UserWord
	db.DB.Where("user_id = ?", user.ID).Find(&progress)
	progressMap := make(map[uint]models.UserWord)
	for _, uw := range progress {
		progressMap[uw.WordID] = uw
	}

	var learningTasks, newTasks, learnedTasks []Task

	for _, t := range tasks {
		if !isBetween(t.Difficulty, minLevel, maxLevel) {
			continue
		}
		uw, exists := progressMap[t.WordID]
		if exists {
			switch uw.Status {
			case "learning":
				learningTasks = append(learningTasks, t)
			case "learned":
				learnedTasks = append(learnedTasks, t)
			default:
				newTasks = append(newTasks, t)
			}
		} else {
			newTasks = append(newTasks, t)
		}
	}

	candidateTasks := append(learningTasks, newTasks...)

	if rand.Float64() < 0.2 {
		candidateTasks = append(candidateTasks, learnedTasks...)
	}

	if len(candidateTasks) == 0 {
		fmt.Println("Нет подходящих заданий")
		c.JSON(http.StatusNotFound, gin.H{"error": "no suitable tasks found"})
		return
	}

	sort.Slice(candidateTasks, func(i, j int) bool {
		uw1 := progressMap[candidateTasks[i].WordID]
		uw2 := progressMap[candidateTasks[j].WordID]
		return uw1.Coefficient < uw2.Coefficient
	})

	rand.Seed(time.Now().UnixNano())
	selectedTasks := []Task{}
	typesPerWord := []string{"standard", "word_translation", "sentence_shuffle", "asr_reading"}

	for _, t := range candidateTasks {
		for _, typ := range typesPerWord {
			if len(selectedTasks) >= 10 {
				break
			}

			correct := strings.TrimSpace(t.CorrectAnswer)
			if correct == "" {
				continue
			}

			task := t
			task.ID = generateTaskID(t.WordID)
			task.Type = typ

			switch typ {
			case "standard":
				suggestions := callModel(t.MaskedSentence, correct)
				if len(suggestions) == 0 {
					fmt.Println("Нет вариантов от модели для типа:", typ, "слово:", t.CorrectAnswer)
					continue
				}
				all := append(suggestions, correct)
				rand.Shuffle(len(all), func(i, j int) { all[i], all[j] = all[j], all[i] })
				task.Options = all

				task.Sentence = strings.Replace(t.MaskedSentence, "<mask>", "___", 1)

			case "word_translation":
				suggestions := callModel(t.MaskedSentence, correct)
				if len(suggestions) == 0 {
					fmt.Println("Нет вариантов от модели для типа:", typ, "слово:", t.CorrectAnswer)
					continue
				}
				all := append(suggestions, correct)
				rand.Shuffle(len(all), func(i, j int) { all[i], all[j] = all[j], all[i] })
				task.Options = all
				task.Sentence = ""

			case "sentence_shuffle":
				sentenceKazakh := strings.Replace(t.MaskedSentence, "<mask>", t.CorrectAnswer, 1)
				words := strings.FieldsFunc(sentenceKazakh, func(r rune) bool {
					return r == ' ' || r == '.' || r == ',' || r == '?' || r == '!'
				})
				if len(words) <= 1 {
					fmt.Println("Слишком мало слов для шафла:", sentenceKazakh)
					continue
				}
				for i, w := range words {
					words[i] = strings.ToLower(strings.Trim(w, ".,!?:;"))
				}
				rand.Shuffle(len(words), func(i, j int) { words[i], words[j] = words[j], words[i] })
				task.Options = words
				task.CorrectAnswer = strings.ToLower(strings.TrimSpace(sentenceKazakh))
				task.Sentence = t.Translation
				break
			case "asr_reading":
				task.Sentence = ""
				task.Text = t.Text
			}

			selectedTasks = append(selectedTasks, task)
		}
		if len(selectedTasks) >= 10 {
			break
		}
	}

	fmt.Printf("Отобрано заданий: %d\n", len(selectedTasks))
	c.JSON(http.StatusOK, selectedTasks)
}

func SubmitAsrResult(c *gin.Context) {
	fmt.Println("🛬 Получен запрос на /api/asr-submit")
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
		return
	}

	expected := c.PostForm("expected")
	if expected == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing expected text"})
		return
	}

	tempFile, err := ioutil.TempFile("", "upload-*.m4a")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create temp file"})
		return
	}
	defer os.Remove(tempFile.Name())
	if err := c.SaveUploadedFile(file, tempFile.Name()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", file.Filename)
	fileContent, _ := os.Open(tempFile.Name())
	io.Copy(part, fileContent)
	writer.Close()
	fmt.Println("📦 Имя файла:", file.Filename)
	fmt.Println("📦 Размер:", file.Size)

	resp, err := http.Post("http://127.0.0.1:8001/transcribe", writer.FormDataContentType(), body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка при отправке в модель"})
		return
	}
	defer resp.Body.Close()

	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	predicted := strings.ToLower(strings.TrimSpace(result["text"]))
	expected = strings.ToLower(strings.TrimSpace(expected))

	isCorrect := strings.Contains(predicted, expected)
	c.JSON(http.StatusOK, gin.H{"correct": isCorrect, "transcribed": predicted})

	fmt.Println("📤 Отправка файла на модель:", file.Filename)
	fmt.Println("🔠 Ожидаемый текст:", expected)
	fmt.Println("📩 Ответ от модели:", predicted)
	fmt.Println("✅ Совпадает ли:", isCorrect)
}

func SubmitResult(c *gin.Context) {
	var input SubmitInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	userData, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user := userData.(models.User)

	var uw models.UserWord
	err := db.DB.Where("user_id = ? AND word_id = ?", user.ID, input.WordID).First(&uw).Error
	isNew := err != nil
	prevStatus := uw.Status

	if isNew {
		uw = models.UserWord{
			UserID:               user.ID,
			WordID:               input.WordID,
			Repeats:              0,
			Mistakes:             0,
			Status:               "new",
			TaskTypesPassed:      "",
			RepeatsStandard:      0,
			RepeatsTranslation:   0,
			RepeatsShuffle:       0,
			CompletedStandard:    false,
			CompletedTranslation: false,
			CompletedShuffle:     false,
		}
	}

	if input.Success {
		uw.Repeats++

		switch input.TaskType {
		case "standard":
			uw.RepeatsStandard++
		case "word_translation":
			uw.RepeatsTranslation++
		case "sentence_shuffle":
			uw.RepeatsShuffle++
		}

		if !strings.Contains(uw.TaskTypesPassed, input.TaskType) {
			if uw.TaskTypesPassed == "" {
				uw.TaskTypesPassed = input.TaskType
			} else {
				uw.TaskTypesPassed += "," + input.TaskType
			}
		}

		if uw.RepeatsStandard >= 3 && uw.Mistakes <= 1 {
			uw.CompletedStandard = true
		}
		if uw.RepeatsTranslation >= 3 && uw.Mistakes <= 1 {
			uw.CompletedTranslation = true
		}
		if uw.RepeatsShuffle >= 3 && uw.Mistakes <= 1 {
			uw.CompletedShuffle = true
		}

	} else {
		uw.Mistakes++

		user.TreeXp -= 1
		if user.TreeXp < 0 {
			user.TreeXp = 0
		}

		if user.Lives > 0 {
			user.Lives -= 1
			if user.LifeRestoreAt.IsZero() {
				user.LifeRestoreAt = time.Now()
			}
		} else if user.BonusLives > 0 {
			user.BonusLives -= 1
		}
		db.DB.Save(&user)

		if uw.Mistakes >= 2 {
			switch input.TaskType {
			case "standard":
				uw.CompletedStandard = false
			case "word_translation":
				uw.CompletedTranslation = false
			case "sentence_shuffle":
				uw.CompletedShuffle = false
			}
		}

		db.DB.Save(&user)

	}

	if input.Success {
		if uw.RepeatsStandard >= 3 &&
			uw.RepeatsTranslation >= 3 &&
			uw.RepeatsShuffle >= 3 &&
			uw.Mistakes <= 1 &&
			uw.Coefficient >= 1 {
			uw.Status = "learned"
		} else {
			uw.Status = "learning"
		}
	} else {
		if uw.Mistakes >= 3 {
			uw.Status = "mistaken"
		} else {
			uw.Status = "learning"
		}
	}

	if input.Success {
		uw.Coefficient += 0.2
	} else {
		uw.Coefficient -= 0.1
	}
	if uw.Coefficient > 1 {
		uw.Coefficient = 1
	}
	if uw.Coefficient < 0 {
		uw.Coefficient = 0
	}

	uw.LastSeen = time.Now().Format("2006-01-02")

	if isNew {
		db.DB.Create(&uw)
	} else {
		db.DB.Save(&uw)
	}

	if input.Success {
		xpMap := map[string]float64{
			"standard":         1.5,
			"word_translation": 1,
			"sentence_shuffle": 2,
		}
		levelXpReward := int(float64(xpMap[input.TaskType]) * 1.2)

		treeXpRewardMap := map[string]float64{
			"standard":         1.5,
			"word_translation": 1,
			"sentence_shuffle": 2,
		}
		treeXpReward := int(treeXpRewardMap[input.TaskType])

		user.TreeXp += treeXpReward
		user.Xp += levelXpReward

		today := time.Now().Format("2006-01-02")

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
			user.TreeXp += dailyGoal
			user.LastDailyGoalReward = today
		}

		RecalculateTreePhase(&user)

		if user.Xp >= user.MaxXp {
			user.Xp = 0
			user.Level++
			user.MaxXp += 20
		}
		if uw.Status == "learned" && (isNew || prevStatus != "learned") {
			user.TodayLearnedWords++
			user.Coins += 1
		}
	}

	var totalLearning, totalLearned int64
	db.DB.Model(&models.UserWord{}).Where("user_id = ? AND status = ?", user.ID, "learning").Count(&totalLearning)
	db.DB.Model(&models.UserWord{}).Where("user_id = ? AND status = ?", user.ID, "learned").Count(&totalLearned)

	user.LearningWords = int(totalLearning)
	user.LearnedWords = int(totalLearned)
	db.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{
		"message":    "progress updated",
		"lives":      user.Lives,
		"bonusLives": user.BonusLives,
		"totalLives": user.Lives + user.BonusLives,
	})
}

func GetRandomWord(c *gin.Context) {
	if len(tasks) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Задания не загружены"})
		return
	}

	rand.Seed(time.Now().UnixNano())
	randomTask := tasks[rand.Intn(len(tasks))]

	translation := randomTask.TranslationTarget
	if translation == "" {
		translation = randomTask.Translation
	}

	c.JSON(http.StatusOK, gin.H{
		"word":        randomTask.CorrectAnswer,
		"translation": translation,
	})
}

func GetWordList(c *gin.Context) {
	userData, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user := userData.(models.User)

	wordType := c.Query("type")

	var userWords []models.UserWord
	db.DB.Where("user_id = ? AND status = ?", user.ID, wordType).Find(&userWords)

	wordIDs := map[uint]bool{}
	for _, uw := range userWords {
		wordIDs[uw.WordID] = true
	}

	result := []gin.H{}
	used := make(map[uint]bool)

	for _, t := range tasks {
		if wordIDs[t.WordID] && !used[t.WordID] {
			result = append(result, gin.H{
				"word":        baseWords[t.WordID],
				"translation": t.TranslationTarget,
			})
			used[t.WordID] = true
		}
	}

	c.JSON(http.StatusOK, result)
}

func BuyLife(c *gin.Context) {
	userData, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user := userData.(models.User)

	const cost = 5

	if user.Coins < cost {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Недостаточно монет"})
		return
	}
	if user.Lives >= 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "У вас уже максимум жизней"})
		return
	}

	user.Coins -= cost
	user.Lives += 1
	if user.Lives > 5 {
		user.Lives = 5
	}

	db.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{
		"message": "Жизнь куплена!",
		"lives":   user.Lives,
		"coins":   user.Coins,
	})
}
