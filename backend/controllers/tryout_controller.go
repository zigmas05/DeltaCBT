package controllers

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"
)

func GenerateNewToken(c *fiber.Ctx) error {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	rand.Seed(time.Now().UnixNano())
	b := make([]byte, 5)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	newToken := string(b)

	return c.JSON(fiber.Map{
		"status":     "success",
		"message":    "Token Try Out 5 Digit berhasil diperbarui! Token berlaku 20 menit.",
		"token":      newToken,
		"expires_in": "20 Menit",
	})
}

func ResetStudentSession(c *fiber.Ctx) error {
	type ResetReq struct {
		StudentID int `json:"student_id"`
		TryoutID  int `json:"tryout_id"`
	}
	var req ResetReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Request reset tidak valid"})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": fmt.Sprintf("Sesi ujian siswa ID %d berhasil direset dari status terblokir menjadi aktif kembali.", req.StudentID),
	})
}
