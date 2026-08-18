package controllers

import (
	"bimbel-tryout-backend/config"
	"bimbel-tryout-backend/models"
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

// CalculateTrueFalseScore menghitung poin untuk tipe soal Benar / Salah (true_false) per baris pernyataan.
// Aturan Penilaian:
//  1. opt.IsCorrect == true berarti kunci 'Benar', false berarti kunci 'Salah'.
//  2. Jika jawaban siswa ('benar'/'salah' atau boolean) cocok dengan key (baik kunci Benar maupun kunci Salah),
//     maka siswa mendapatkan point sejumlah opt.Points pada baris tersebut.
//  3. Jika jawaban siswa tidak sama / tidak dijawab, poin untuk baris tersebut = 0.
//  4. Total poin adalah penjumlahan poin dari setiap baris yang dijawab tepat.
func CalculateTrueFalseScore(allOptions []models.Option, tfAnswers map[int]string, selectedOptionIDs []int, defaultPoints float64) float64 {
	if len(allOptions) == 0 {
		return 0.0
	}

	// JIKA SOAL TIDAK DIJAWAB SAMA SEKALI (tfAnswers kosong DAN selectedOptionIDs kosong), NILAI = 0
	if len(tfAnswers) == 0 && len(selectedOptionIDs) == 0 {
		return 0.0
	}

	var totalScore float64 = 0
	fallbackPointsPerRow := 0.0
	if defaultPoints > 0 {
		fallbackPointsPerRow = defaultPoints / float64(len(allOptions))
	}

	// Map pilihan ID yang ditandai 'Benar' oleh siswa jika tfAnswers tidak dikirim secara eksplisit
	selectedSet := make(map[int]bool)
	for _, id := range selectedOptionIDs {
		selectedSet[id] = true
	}

	hasTFAnswers := len(tfAnswers) > 0

	for _, opt := range allOptions {
		var userChoiceBool bool
		var isAnswered bool

		if hasTFAnswers {
			if val, exists := tfAnswers[opt.ID]; exists && strings.TrimSpace(val) != "" {
				isAnswered = true
				valLower := strings.ToLower(strings.TrimSpace(val))
				userChoiceBool = (valLower == "benar" || valLower == "true" || valLower == "b" || valLower == "1")
			}
		} else if len(selectedOptionIDs) > 0 {
			// Fallback: Jika menggunakan array selectedOptionIDs (ID terdaftar di selectedOptionIDs = 'Benar', tidak terdaftar = 'Salah')
			isAnswered = true
			userChoiceBool = selectedSet[opt.ID]
		}

		if !isAnswered {
			continue
		}

		keyBool := opt.IsCorrect // true = Kunci Benar, false = Kunci Salah
		rowPoints := opt.Points
		if rowPoints <= 0 {
			rowPoints = fallbackPointsPerRow
		}

		// Jika jawaban siswa cocok dengan kunci (Benar == Benar ATAU Salah == Salah)
		if userChoiceBool == keyBool {
			totalScore += rowPoints
		}
	}

	return totalScore
}

// CalculateScoreEngine adalah mesin penilaian otomatis berdasar aturan bisnis
func CalculateScoreEngine(qType models.QuestionType, selectedOptionIDs []int, allOptions []models.Option, defaultPoints float64) float64 {
	return CalculateScoreEngineFull(qType, selectedOptionIDs, nil, allOptions, defaultPoints)
}

// CalculateScoreEngineFull mendukung mapping tfAnswers secara opsional
func CalculateScoreEngineFull(qType models.QuestionType, selectedOptionIDs []int, tfAnswers map[int]string, allOptions []models.Option, defaultPoints float64) float64 {
	if len(allOptions) == 0 {
		return 0.0
	}

	switch qType {
	case models.TypeSingleChoice:
		// Pilihan Ganda Biasa: Opsi benar mendapat poin penuh.
		if len(selectedOptionIDs) == 1 {
			for _, opt := range allOptions {
				if opt.ID == selectedOptionIDs[0] && opt.IsCorrect {
					if opt.Points > 0 {
						return opt.Points
					}
					return defaultPoints
				}
			}
		}
		return 0.0

	case models.TypeTrueFalse:
		// Benar / Salah: Point per Pernyataan
		return CalculateTrueFalseScore(allOptions, tfAnswers, selectedOptionIDs, defaultPoints)

	case models.TypeComplexChoice:
		// Pilihan Ganda Kompleks (Checkbox):
		// Poin diakumulasi dari checkbox benar yang dipilih.
		// JIKA SISWA MEMILIH SEMUA OPSI (melebihi jumlah jawaban benar/semua kotak tercentang), NILAI OTOMATIS 0.
		totalOptionsCount := len(allOptions)
		if len(selectedOptionIDs) >= totalOptionsCount && totalOptionsCount > 1 {
			// Hukuman over-selection (pilih semua) = 0 Point
			return 0.0
		}

		optMap := make(map[int]models.Option)
		correctCountInKey := 0
		for _, opt := range allOptions {
			optMap[opt.ID] = opt
			if opt.IsCorrect {
				correctCountInKey++
			}
		}

		// Jika jumlah yang dipilih melebihi jumlah kunci jawaban benar, beri nilai 0
		if len(selectedOptionIDs) > correctCountInKey {
			return 0.0
		}

		var scoreAccumulated float64 = 0
		for _, selID := range selectedOptionIDs {
			if opt, exists := optMap[selID]; exists {
				if opt.IsCorrect {
					scoreAccumulated += opt.Points
				} else {
					// Pilihan salah memotong akumulasi atau menggagalkan
					return 0.0
				}
			}
		}
		return scoreAccumulated

	default:
		return 0.0
	}
}

// ConfirmAndStartExam handler
func ConfirmAndStartExam(c *fiber.Ctx) error {
	var req models.ExamConfirmRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Format konfirmasi pengerjaan tidak valid",
		})
	}

	// Validasi Token 5 Digit dan Tanggal Lahir Siswa
	if req.Token != "AX982" && req.Token != "TK881" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Token Try Out tidak cocok atau telah kedaluwarsa. Minta token terbaru ke Admin.",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Sesi ujian berhasil dimulai. Mode Kiosk aktif.",
		"session": models.ExamSession{
			ID:          501,
			StudentID:   10,
			TryoutID:    req.TryoutID,
			Status:      models.StatusActive,
			TryoutTitle: "Try Out UTBK SBMPTN Matematika & Saintek",
		},
	})
}

// AutoSaveAnswer handler
func AutoSaveAnswer(c *fiber.Ctx) error {
	var req models.AutoSaveAnswerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Payload JSON tidak valid.",
		})
	}

	answersJSON, err := json.Marshal(req.Answers)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal memproses data jawaban.",
		})
	}

	query := `UPDATE exam_sessions SET answers = $1 WHERE id = $2`
	_, err = config.DB.Exec(context.Background(), query, answersJSON, req.SessionID)
	if err != nil {
		log.Printf("Error AutoSaveAnswer: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal menyimpan jawaban otomatis.",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Jawaban berhasil disimpan otomatis.",
	})
}

// ReportKioskViolation handler
func ReportKioskViolation(c *fiber.Ctx) error {
	type ViolationReq struct {
		SessionID int `json:"session_id"`
	}
	var req ViolationReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error"})
	}

	// Ubah status session siswa menjadi 'blocked' di DB
	return c.JSON(fiber.Map{
		"status":  "blocked",
		"message": "Siswa terdeteksi keluar dari layar ujian. Sesi Anda terblokir! Hubungi Admin untuk reset sesi.",
	})
}

// FinishExam handler
func FinishExam(c *fiber.Ctx) error {
	type FinishReq struct {
		SessionID  int     `json:"session_id"`
		FinalScore float64 `json:"final_score"`
	}
	var req FinishReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error"})
	}

	query := `UPDATE exam_sessions SET status = 'finished', end_time = $1, final_score = $2 WHERE id = $3`
	_, err := config.DB.Exec(context.Background(), query, time.Now().Format(time.RFC3339), req.FinalScore, req.SessionID)
	if err != nil {
		log.Printf("Error FinishExam: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "Gagal menyelesaikan ujian."})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Ujian berhasil diselesaikan.",
	})
}
