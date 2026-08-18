package controllers

import (
	"context"
	"log"

	"bimbel-tryout-backend/config"

	"github.com/gofiber/fiber/v2"
)

type CreateStaffRequest struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

// ==========================================
// FUNGSI UNTUK MENAMBAH DATA STAFF (INSERT)
// ==========================================
func CreateStaff(c *fiber.Ctx) error {
	var req CreateStaffRequest

	if err := c.BodyParser(&req); err != nil {
		log.Printf("Gagal membaca input Vue: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status": "error", "message": "Format input tidak valid",
		})
	}

	query := `
        INSERT INTO staff_users (name, username, password_hash, role) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id
    `
	var newID int
	err := config.DB.QueryRow(context.Background(), query, req.Name, req.Username, req.Password, req.Role).Scan(&newID)

	if err != nil {
		// INI KUNCI UTAMANYA: Mencetak error asli dari Supabase ke terminal VS Code
		log.Printf("ERROR SUPABASE: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status": "error", "message": "Gagal menyimpan ke database.",
		})
	}

	log.Printf("SUKSES: Staff %s berhasil disimpan dengan ID %d", req.Name, newID)
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"id": newID, "name": req.Name, "username": req.Username, "role": req.Role,
		},
	})
}

// ==========================================
// FUNGSI UNTUK MENGUPDATE DATA STAFF (EDIT)
// ==========================================
func UpdateStaff(c *fiber.Ctx) error {
	// 1. Ambil ID dari URL parameter
	id := c.Params("id")

	// 2. Baca data baru yang dikirim dari Frontend
	var req CreateStaffRequest
	if err := c.BodyParser(&req); err != nil {
		log.Printf("Gagal membaca input update: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status": "error", "message": "Format input tidak valid",
		})
	}

	// 3. Jalankan query UPDATE ke Supabase
	query := `
		UPDATE staff_users 
		SET name = $1, username = $2, password_hash = $3, role = $4 
		WHERE id = $5
	`

	_, err := config.DB.Exec(context.Background(), query, req.Name, req.Username, req.Password, req.Role, id)

	if err != nil {
		log.Printf("ERROR UPDATE SUPABASE: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status": "error", "message": "Gagal mengupdate database.",
		})
	}

	log.Printf("SUKSES: Staff dengan ID %s berhasil diupdate", id)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Data staff berhasil diperbarui",
	})
}

// ==========================================
// FUNGSI UNTUK MENGHAPUS DATA STAFF (DELETE)
// ==========================================
func DeleteStaff(c *fiber.Ctx) error {
	id := c.Params("id")

	// Gunakan Exec untuk menghapus dan ambil hasilnya
	result, err := config.DB.Exec(context.Background(), `DELETE FROM staff_users WHERE id = $1`, id)

	if err != nil {
		log.Printf("ERROR DELETE: %v", err)
		// Cek jika error karena Foreign Key (misal: guru ini punya paket soal)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal menghapus. Staff mungkin masih terkait dengan data Paket Soal.",
		})
	}

	// Cek apakah ada baris yang terhapus
	if result.RowsAffected() == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status": "error", "message": "Data staff tidak ditemukan di database.",
		})
	}

	log.Printf("SUKSES: Staff dengan ID %s berhasil dihapus", id)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Data staff berhasil dihapus dari database",
	})
}
