package routes

import (
	"bimbel-tryout-backend/controllers"
	"bimbel-tryout-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// Inisialisasi/Verifikasi tabel dan kolom di database
	controllers.InitPackageTables()

	api := app.Group("/api/v1")

	// --- AREA PUBLIK (TIDAK DIJAGA TOKEN) ---
	auth := api.Group("/auth")
	auth.Post("/staff/login", controllers.StaffLogin)
	auth.Post("/student/login", controllers.StudentLogin)

	// API Staff / Guru
	app.Post("/api/staff", controllers.CreateStaff)
	app.Put("/api/staff/:id", controllers.UpdateStaff)
	app.Delete("/api/staff/:id", controllers.DeleteStaff)
	api.Post("/admin/staff", controllers.CreateStaff)

	// API Mata Pelajaran
	app.Post("/api/subjects", controllers.CreateSubject)
	app.Get("/api/subjects", controllers.GetAllSubjects)

	// API Bimbel Settings
	app.Get("/api/bimbel-settings", controllers.GetBimbelSettings)
	app.Put("/api/bimbel-settings", controllers.UpdateBimbelSettings)

	// API Announcements
	app.Get("/api/announcements", controllers.GetAllAnnouncements)
	app.Post("/api/announcements", controllers.CreateAnnouncement)
	app.Put("/api/announcements/:id", controllers.UpdateAnnouncement)
	app.Delete("/api/announcements/:id", controllers.DeleteAnnouncement)

	// API Paket Soal
	app.Get("/api/packages", controllers.GetAllPackages)
	app.Post("/api/packages", controllers.CreatePackage)
	app.Put("/api/packages/:id", controllers.UpdatePackage)
	app.Delete("/api/packages/:id", controllers.DeletePackage)

	// API Butir Soal
	app.Get("/api/questions/:packageId", controllers.GetQuestionsByPackage)
	app.Post("/api/questions", controllers.AddQuestionWithLaTeX)
	app.Put("/api/questions/:id", controllers.UpdateQuestion)
	app.Delete("/api/questions/:id", controllers.DeleteQuestion)

	// --- AREA TERLINDUNGI ---
	protected := api.Group("", middleware.JWTMiddleware())

	student := protected.Group("/student", middleware.RoleGuard("siswa"))
	student.Post("/exam/confirm", controllers.ConfirmAndStartExam)
	student.Post("/exam/autosave", controllers.AutoSaveAnswer)
	student.Post("/exam/finish", controllers.FinishExam)
	student.Post("/exam/report-violation", controllers.ReportKioskViolation)

	staff := protected.Group("/staff", middleware.RoleGuard("admin", "guru"))
	staff.Get("/packages", controllers.GetAllPackages)
	staff.Post("/packages", controllers.CreatePackage)
	staff.Post("/questions/latex", controllers.AddQuestionWithLaTeX)

	adminOnly := protected.Group("/admin", middleware.RoleGuard("admin"))
	adminOnly.Post("/tryouts/refresh-token", controllers.GenerateNewToken)
	adminOnly.Post("/tryouts/reset-student", controllers.ResetStudentSession)
}
