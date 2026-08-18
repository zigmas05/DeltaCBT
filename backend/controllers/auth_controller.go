package controllers

import (
	"context"
	"fmt"
	"strings"
	"time"

	"bimbel-tryout-backend/config"
	"bimbel-tryout-backend/middleware"
	"bimbel-tryout-backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func StaffLogin(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Format login tidak valid",
		})
	}

	var role models.Role = models.RoleAdmin
	var userID int = 1
	var name string = "Admin Utama"

	if config.DB != nil {
		var uID int
		var uName, uRole string
		err := config.DB.QueryRow(context.Background(),
			`SELECT id, name, role FROM staff_users WHERE username = $1 LIMIT 1`,
			strings.TrimSpace(req.Username)).Scan(&uID, &uName, &uRole)
		if err == nil {
			userID = uID
			name = uName
			if uRole == "guru" {
				role = models.RoleGuru
			} else {
				role = models.RoleAdmin
			}
		}
	} else if strings.Contains(strings.ToLower(req.Username), "guru") || req.Username == "budi_mtk" {
		role = models.RoleGuru
		userID = 2
		name = "Drs. Budi Santoso"
	}

	claims := middleware.Claims{
		UserID:   userID,
		Username: req.Username,
		Role:     string(role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(middleware.JWTSecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal generate JWT token",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Login berhasil",
		"token":   tokenString,
		"user": fiber.Map{
			"id":       userID,
			"name":     name,
			"username": req.Username,
			"role":     role,
		},
	})
}

func StudentLogin(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Format login siswa tidak valid",
		})
	}

	term := strings.TrimSpace(req.Username)
	userID := 10
	name := fmt.Sprintf("Siswa (%s)", term)
	nis := term
	className := "12 IPA 1"

	if config.DB != nil {
		var uID int
		var uName, uNis, uClass string
		err := config.DB.QueryRow(context.Background(),
			`SELECT id, name, COALESCE(nis, username), COALESCE(class_name, '12 IPA 1') FROM student_users WHERE username = $1 OR nis = $1 LIMIT 1`,
			term).Scan(&uID, &uName, &uNis, &uClass)
		if err == nil {
			userID = uID
			name = uName
			nis = uNis
			className = uClass
		}
	}

	claims := middleware.Claims{
		UserID:   userID,
		Username: term,
		Role:     string(models.RoleSiswa),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString(middleware.JWTSecret)

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Login siswa berhasil",
		"token":   tokenString,
		"user": fiber.Map{
			"id":         userID,
			"name":       name,
			"username":   term,
			"nis":        nis,
			"class_name": className,
			"role":       "siswa",
		},
	})
}
