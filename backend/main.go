package main

import (
	"log"
	"os"

	"bimbel-tryout-backend/config"
	"bimbel-tryout-backend/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	// untuk panggil .env pakai yang bawa ini dan install sendiri di go get github.com/joho/godotenv
	"github.com/joho/godotenv"
)

func main() {
	// Membaca file .env yang ada di folder backend
	err := godotenv.Load()
	if err != nil {
		log.Println("Peringatan: File .env tidak ditemukan atau gagal dibaca.")
	}

	// Initialize Database Connection
	config.ConnectDB()

	// Create Fiber App
	app := fiber.New(fiber.Config{
		AppName:      "Aplikasi Web Try Out & Bimbel REST API",
		ServerHeader: "Go-Fiber-Backend",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"status":  "error",
				"message": err.Error(),
			})
		},
	})

	// Middlewares
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Setup Routes
	routes.SetupRoutes(app)

	// Health Check Endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "Bimbel REST API Engine",
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server REST API Golang berjalan di port %s...", port)
	log.Fatal(app.Listen(":" + port))
}