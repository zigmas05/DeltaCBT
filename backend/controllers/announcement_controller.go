package controllers

import (
	"bimbel-tryout-backend/config"
	"bimbel-tryout-backend/models"
	"context"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GetAllAnnouncements - Mengambil semua pengumuman dari database
func GetAllAnnouncements(c *fiber.Ctx) error {
	query := `SELECT id, title, target_class, content, date, author, created_at 
	          FROM announcements ORDER BY id DESC`

	rows, err := config.DB.Query(context.Background(), query)
	if err != nil {
		log.Printf("ERROR GET ALL ANNOUNCEMENTS: %v", err)
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Gagal mengambil data pengumuman"})
	}
	defer rows.Close()

	announcements := []models.Announcement{}
	for rows.Next() {
		var anno models.Announcement
		var targetClass string
		err := rows.Scan(&anno.ID, &anno.Title, &targetClass, &anno.Content, &anno.Date, &anno.AuthorName, &anno.CreatedAt)
		if err == nil {
			anno.Target = targetClass
			announcements = append(announcements, anno)
		}
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   announcements,
	})
}

// CreateAnnouncement - Membuat pengumuman baru
func CreateAnnouncement(c *fiber.Ctx) error {
	var announcement struct {
		Title       string `json:"title"`
		TargetClass string `json:"target_class"`
		Content     string `json:"content"`
		Date        string `json:"date"`
		Author      string `json:"author"`
	}

	if err := c.BodyParser(&announcement); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Data pengumuman tidak valid",
		})
	}

	// Set default values if empty
	if announcement.TargetClass == "" {
		announcement.TargetClass = "Semua Kelas"
	}
	if announcement.Author == "" {
		announcement.Author = "Admin"
	}
	if announcement.Date == "" {
		announcement.Date = time.Now().Format("02-01-2006")
	}

	query := `INSERT INTO announcements (title, target_class, content, date, author, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`

	var newID int
	err := config.DB.QueryRow(context.Background(), query,
		announcement.Title, announcement.TargetClass, announcement.Content,
		announcement.Date, announcement.Author, time.Now()).Scan(&newID)

	if err != nil {
		log.Printf("ERROR CREATE ANNOUNCEMENT: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal menyimpan pengumuman",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Pengumuman berhasil dibuat",
		"data": fiber.Map{
			"id":      newID,
			"title":   announcement.Title,
			"target":  announcement.TargetClass,
			"content": announcement.Content,
			"date":    announcement.Date,
			"author":  announcement.Author,
		},
	})
}

// UpdateAnnouncement - Mengupdate pengumuman
func UpdateAnnouncement(c *fiber.Ctx) error {
	id := c.Params("id")

	var announcement struct {
		Title       string `json:"title"`
		TargetClass string `json:"target_class"`
		Content     string `json:"content"`
		Date        string `json:"date"`
		Author      string `json:"author"`
	}

	if err := c.BodyParser(&announcement); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Data pengumuman tidak valid",
		})
	}

	query := `UPDATE announcements SET title=$1, target_class=$2, content=$3, date=$4, author=$5 WHERE id=$6`

	_, err := config.DB.Exec(context.Background(), query,
		announcement.Title, announcement.TargetClass, announcement.Content,
		announcement.Date, announcement.Author, id)

	if err != nil {
		log.Printf("ERROR UPDATE ANNOUNCEMENT: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal mengupdate pengumuman",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Pengumuman berhasil diperbarui",
	})
}

// DeleteAnnouncement - Menghapus pengumuman
func DeleteAnnouncement(c *fiber.Ctx) error {
	id := c.Params("id")

	query := `DELETE FROM announcements WHERE id = $1`
	_, err := config.DB.Exec(context.Background(), query, id)

	if err != nil {
		log.Printf("ERROR DELETE ANNOUNCEMENT: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal menghapus pengumuman",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Pengumuman berhasil dihapus",
	})
}
