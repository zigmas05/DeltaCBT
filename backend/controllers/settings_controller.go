package controllers

import (
	"bimbel-tryout-backend/config"
	"bimbel-tryout-backend/models"
	"context"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GetBimbelSettings - Mengambil pengaturan bimbel dari database
func GetBimbelSettings(c *fiber.Ctx) error {
	query := `SELECT id, bimbel_name, owner_name, address, phone, logo_url, created_at, updated_at 
	          FROM bimbel_settings ORDER BY id DESC LIMIT 1`

	var settings models.BimbelSettings
	err := config.DB.QueryRow(context.Background(), query).Scan(
		&settings.ID, &settings.BimbelName, &settings.OwnerName, &settings.Address,
		&settings.Phone, &settings.LogoURL, &settings.CreatedAt, &settings.UpdatedAt,
	)

	if err != nil {
		log.Printf("ERROR GET BIMBEL SETTINGS: %v", err)
		// Jika belum ada data, return default settings
		defaultSettings := models.BimbelSettings{
			ID:         1,
			BimbelName: "Bimbel Champion Academy",
			OwnerName:  "",
			Address:    "",
			Phone:      "",
			LogoURL:    "",
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		return c.JSON(fiber.Map{
			"status": "success",
			"data":   defaultSettings,
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   settings,
	})
}

// UpdateBimbelSettings - Mengupdate pengaturan bimbel
func UpdateBimbelSettings(c *fiber.Ctx) error {
	var settings models.BimbelSettings
	if err := c.BodyParser(&settings); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Data pengaturan tidak valid",
		})
	}

	// Cek apakah sudah ada data (id=1)
	var existingID int
	err := config.DB.QueryRow(context.Background(), `SELECT id FROM bimbel_settings WHERE id = 1`).Scan(&existingID)

	updatedAt := time.Now()

	if err != nil {
		// Insert baru jika belum ada
		query := `INSERT INTO bimbel_settings (bimbel_name, owner_name, address, phone, logo_url, created_at, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`
		
		err := config.DB.QueryRow(context.Background(), query,
			settings.BimbelName, settings.OwnerName, settings.Address,
			settings.Phone, settings.LogoURL, updatedAt, updatedAt).Scan(&settings.ID)

		if err != nil {
			log.Printf("ERROR INSERT BIMBEL SETTINGS: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"status":  "error",
				"message": "Gagal menyimpan pengaturan bimbel",
			})
		}
	} else {
		// Update jika sudah ada
		query := `UPDATE bimbel_settings SET bimbel_name=$1, owner_name=$2, address=$3, phone=$4, logo_url=$5, updated_at=$6 WHERE id=1`
		
		_, err := config.DB.Exec(context.Background(), query,
			settings.BimbelName, settings.OwnerName, settings.Address,
			settings.Phone, settings.LogoURL, updatedAt)

		if err != nil {
			log.Printf("ERROR UPDATE BIMBEL SETTINGS: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"status":  "error",
				"message": "Gagal mengupdate pengaturan bimbel",
			})
		}
		settings.ID = 1
	}

	settings.UpdatedAt = updatedAt

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Pengaturan bimbel berhasil disimpan",
		"data":    settings,
	})
}
