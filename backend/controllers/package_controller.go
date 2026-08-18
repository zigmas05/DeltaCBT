package controllers

import (
	"bimbel-tryout-backend/config"
	"bimbel-tryout-backend/models"
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

// InitPackageTables - Memastikan tabel dan kolom pendukung di Supabase PostgreSQL tersedia
func InitPackageTables() {
	if config.DB == nil {
		return
	}
	ctx := context.Background()

	// 1. Buat tabel question_packages jika belum ada
	_, err := config.DB.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS question_packages (
			id SERIAL PRIMARY KEY,
			subject_id INT,
			subject_name VARCHAR(150) DEFAULT '',
			teacher_id INT,
			teacher_name VARCHAR(100) DEFAULT '',
			code VARCHAR(50) DEFAULT '',
			name VARCHAR(200) DEFAULT '',
			classes JSONB DEFAULT '[]',
			is_random_order BOOLEAN DEFAULT TRUE,
			duration_minutes INT DEFAULT 90,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		log.Printf("[INIT DB] Notice question_packages table check: %v", err)
	}

	// Tambahkan kolom jika tabel lama belum lengkap
	_, _ = config.DB.Exec(ctx, `
		ALTER TABLE question_packages 
		ADD COLUMN IF NOT EXISTS subject_name VARCHAR(150) DEFAULT '',
		ADD COLUMN IF NOT EXISTS teacher_name VARCHAR(100) DEFAULT '',
		ADD COLUMN IF NOT EXISTS classes JSONB DEFAULT '[]',
		ADD COLUMN IF NOT EXISTS is_random_order BOOLEAN DEFAULT TRUE,
		ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 90;
	`)

	// 2. Buat tabel questions jika belum ada
	_, err = config.DB.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS questions (
			id SERIAL PRIMARY KEY,
			package_id INT NOT NULL,
			question_type VARCHAR(50) DEFAULT 'single_choice',
			type_label VARCHAR(50) DEFAULT '',
			content TEXT NOT NULL DEFAULT '',
			discussion TEXT DEFAULT '',
			points_default NUMERIC(5,2) DEFAULT 10.0,
			options JSONB DEFAULT '[]',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		log.Printf("[INIT DB] Notice questions table check: %v", err)
	}

	// Tambahkan kolom jika tabel questions lama belum lengkap
	_, _ = config.DB.Exec(ctx, `
		ALTER TABLE questions 
		ADD COLUMN IF NOT EXISTS type_label VARCHAR(50) DEFAULT '',
		ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]';
	`)
}

// ==========================================
// 1. MATA PELAJARAN (SUBJECTS)
// ==========================================

// CreateSubject - Menyimpan Mata Pelajaran Baru ke database
func CreateSubject(c *fiber.Ctx) error {
	var sub struct {
		Code string `json:"code"`
		Name string `json:"name"`
	}

	if err := c.BodyParser(&sub); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status": "error", "message": "Data mata pelajaran tidak valid",
		})
	}

	query := `INSERT INTO subjects (code, name) VALUES ($1, $2) RETURNING id`
	var newID int
	err := config.DB.QueryRow(context.Background(), query, sub.Code, sub.Name).Scan(&newID)

	if err != nil {
		log.Printf("ERROR INSERT SUBJECT: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status": "error", "message": "Gagal menyimpan mata pelajaran. Kode mungkin sudah ada.",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Mata pelajaran berhasil disimpan",
		"data":    fiber.Map{"id": newID, "code": sub.Code, "name": sub.Name},
	})
}

// ==========================================
// 2. PAKET SOAL (QUESTION PACKAGES)
// ==========================================

// GetAllPackages - Mengambil seluruh paket soal dari database beserta butir soal di dalamnya
func GetAllPackages(c *fiber.Ctx) error {
	InitPackageTables()

	query := `SELECT qp.id, qp.subject_id, COALESCE(s.name, ''), qp.teacher_id, COALESCE(st.name, ''), qp.code, qp.name, COALESCE(qp.classes, '[]'::jsonb), COALESCE(qp.is_random_order, true), COALESCE(qp.duration_minutes, 90)
              FROM question_packages qp
              LEFT JOIN subjects s ON qp.subject_id = s.id
              LEFT JOIN staff_users st ON qp.teacher_id = st.id
              ORDER BY qp.id DESC`

	rows, err := config.DB.Query(context.Background(), query)
	if err != nil {
		log.Printf("ERROR GET ALL PACKAGES: %v", err)
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Gagal mengambil data paket"})
	}
	defer rows.Close()

	packages := []models.QuestionPackage{}
	for rows.Next() {
		var pkg models.QuestionPackage
		var classesBytes []byte

		err := rows.Scan(&pkg.ID, &pkg.SubjectID, &pkg.SubjectName, &pkg.TeacherID, &pkg.TeacherName,
			&pkg.Code, &pkg.Name, &classesBytes, &pkg.IsRandomOrder, &pkg.DurationMinutes)

		if err == nil {
			json.Unmarshal(classesBytes, &pkg.Classes)
			if pkg.Classes == nil {
				pkg.Classes = []string{}
			}

			// Ambil butir soal untuk paket ini
			pkg.Questions = getQuestionsByPackageID(pkg.ID)
			packages = append(packages, pkg)
		} else {
			log.Printf("ERROR SCAN PACKAGE ROW: %v", err)
		}
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   packages,
	})
}

// GetAllSubjects - Mengambil semua Mata Pelajaran dari Supabase
func GetAllSubjects(c *fiber.Ctx) error {
	query := `SELECT id, code, name FROM subjects ORDER BY name ASC`

	rows, err := config.DB.Query(context.Background(), query)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": err.Error()})
	}
	defer rows.Close()

	subjects := []models.Subject{} // Pastikan struct Subject ada di models
	for rows.Next() {
		var sub models.Subject
		err := rows.Scan(&sub.ID, &sub.Code, &sub.Name)
		if err == nil {
			subjects = append(subjects, sub)
		}
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   subjects,
	})
}

// CreatePackage - Menyimpan paket soal baru
func CreatePackage(c *fiber.Ctx) error {
	InitPackageTables()

	var pkg models.QuestionPackage
	if err := c.BodyParser(&pkg); err != nil {
		return c.Status(400).JSON(fiber.Map{"status": "error", "message": "Payload paket tidak valid"})
	}

	if pkg.Classes == nil {
		pkg.Classes = []string{}
	}
	classesJSON, _ := json.Marshal(pkg.Classes)

	// Get subject name from subjects table if subject_id is provided
	var subjectName string
	if pkg.SubjectID > 0 {
		err := config.DB.QueryRow(context.Background(), `SELECT name FROM subjects WHERE id = $1`, pkg.SubjectID).Scan(&subjectName)
		if err != nil {
			subjectName = pkg.SubjectName // Fallback to provided name
		}
	} else {
		subjectName = pkg.SubjectName
	}

	// Get teacher name from staff_users table if teacher_id is provided
	var teacherName string
	if pkg.TeacherID > 0 {
		err := config.DB.QueryRow(context.Background(), `SELECT name FROM staff_users WHERE id = $1`, pkg.TeacherID).Scan(&teacherName)
		if err != nil {
			teacherName = pkg.TeacherName // Fallback to provided name
		}
	} else {
		teacherName = pkg.TeacherName
	}

	query := `INSERT INTO question_packages (subject_id, subject_name, teacher_id, teacher_name, code, name, classes, is_random_order, duration_minutes)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`

	err := config.DB.QueryRow(context.Background(), query,
		pkg.SubjectID, subjectName, pkg.TeacherID, teacherName,
		pkg.Code, pkg.Name, classesJSON, pkg.IsRandomOrder, pkg.DurationMinutes).Scan(&pkg.ID)

	if err != nil {
		log.Printf("ERROR CREATE PACKAGE: %v", err)
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Gagal simpan paket soal"})
	}

	// Update the package with the correct names
	pkg.SubjectName = subjectName
	pkg.TeacherName = teacherName
	pkg.Questions = []models.Question{}

	return c.Status(201).JSON(fiber.Map{
		"status":  "success",
		"message": "Paket soal berhasil dibuat.",
		"data":    pkg,
	})
}

// UpdatePackage - Mengedit data paket soal
func UpdatePackage(c *fiber.Ctx) error {
	InitPackageTables()

	id := c.Params("id")
	var pkg models.QuestionPackage
	if err := c.BodyParser(&pkg); err != nil {
		return c.Status(400).JSON(fiber.Map{"status": "error", "message": "Data tidak valid"})
	}

	if pkg.Classes == nil {
		pkg.Classes = []string{}
	}
	classesJSON, _ := json.Marshal(pkg.Classes)

	// Get subject name from subjects table if subject_id is provided
	var subjectName string
	if pkg.SubjectID > 0 {
		err := config.DB.QueryRow(context.Background(), `SELECT name FROM subjects WHERE id = $1`, pkg.SubjectID).Scan(&subjectName)
		if err != nil {
			subjectName = pkg.SubjectName // Fallback to provided name
		}
	} else {
		subjectName = pkg.SubjectName
	}

	// Get teacher name from staff_users table if teacher_id is provided
	var teacherName string
	if pkg.TeacherID > 0 {
		err := config.DB.QueryRow(context.Background(), `SELECT name FROM staff_users WHERE id = $1`, pkg.TeacherID).Scan(&teacherName)
		if err != nil {
			teacherName = pkg.TeacherName // Fallback to provided name
		}
	} else {
		teacherName = pkg.TeacherName
	}

	query := `UPDATE question_packages SET subject_id=$1, subject_name=$2, teacher_id=$3, teacher_name=$4, code=$5, name=$6, classes=$7, is_random_order=$8, duration_minutes=$9 WHERE id=$10`

	_, err := config.DB.Exec(context.Background(), query,
		pkg.SubjectID, subjectName, pkg.TeacherID, teacherName,
		pkg.Code, pkg.Name, classesJSON, pkg.IsRandomOrder, pkg.DurationMinutes, id)

	if err != nil {
		log.Printf("ERROR UPDATE PACKAGE: %v", err)
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Gagal memperbarui paket"})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Paket berhasil diperbarui",
	})
}

// DeletePackage - Menghapus paket soal dan butir soal di dalamnya
func DeletePackage(c *fiber.Ctx) error {
	InitPackageTables()

	id := c.Params("id")

	// Hapus soal dalam paket terlebih dahulu
	_, _ = config.DB.Exec(context.Background(), `DELETE FROM questions WHERE package_id = $1`, id)

	query := `DELETE FROM question_packages WHERE id = $1`
	_, err := config.DB.Exec(context.Background(), query, id)

	if err != nil {
		log.Printf("ERROR DELETE PACKAGE: %v", err)
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Gagal menghapus paket."})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Paket berhasil dihapus",
	})
}

// ==========================================
// 3. BUTIR SOAL (QUESTIONS)
// ==========================================

// AddQuestionWithLaTeX - Menyimpan Butir Soal Baru (Mendukung LaTeX & Gambar & Options)
func AddQuestionWithLaTeX(c *fiber.Ctx) error {
	InitPackageTables()

	var q models.Question
	if err := c.BodyParser(&q); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status": "error", "message": "Data soal tidak valid",
		})
	}

	if q.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status": "error", "message": "Konten soal tidak boleh kosong.",
		})
	}

	if q.Options == nil {
		q.Options = []models.Option{}
	}
	optionsJSON, _ := json.Marshal(q.Options)

	query := `INSERT INTO questions (package_id, question_type, type_label, content, discussion, points_default, options) 
			  VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`

	err := config.DB.QueryRow(context.Background(), query,
		q.PackageID, q.QuestionType, q.TypeLabel, q.Content, q.Discussion, q.PointsDefault, optionsJSON).Scan(&q.ID)

	if err != nil {
		log.Printf("ERROR INSERT QUESTION: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"status": "error", "message": "Gagal menyimpan butir soal ke database Supabase.",
		})
	}

	return c.Status(http.StatusCreated).JSON(fiber.Map{
		"status":  "success",
		"message": "Butir soal berhasil disimpan.",
		"data":    q,
	})
}

// UpdateQuestion - Memperbarui Butir Soal di Database
func UpdateQuestion(c *fiber.Ctx) error {
	InitPackageTables()

	id := c.Params("id")
	var q models.Question
	if err := c.BodyParser(&q); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status": "error", "message": "Data soal tidak valid",
		})
	}

	if q.Options == nil {
		q.Options = []models.Option{}
	}
	optionsJSON, _ := json.Marshal(q.Options)

	query := `UPDATE questions SET question_type=$1, type_label=$2, content=$3, discussion=$4, points_default=$5, options=$6 WHERE id=$7`

	_, err := config.DB.Exec(context.Background(), query,
		q.QuestionType, q.TypeLabel, q.Content, q.Discussion, q.PointsDefault, optionsJSON, id)

	if err != nil {
		log.Printf("ERROR UPDATE QUESTION: %v", err)
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Gagal memperbarui butir soal."})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Butir soal berhasil diperbarui.",
	})
}

// DeleteQuestion - Menghapus Butir Soal dari Database
func DeleteQuestion(c *fiber.Ctx) error {
	InitPackageTables()

	id := c.Params("id")
	query := `DELETE FROM questions WHERE id = $1`
	_, err := config.DB.Exec(context.Background(), query, id)

	if err != nil {
		log.Printf("ERROR DELETE QUESTION: %v", err)
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": "Gagal menghapus butir soal."})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Butir soal berhasil dihapus.",
	})
}

// GetQuestionsByPackage - Mengambil semua soal dalam satu paket
func GetQuestionsByPackage(c *fiber.Ctx) error {
	InitPackageTables()

	packageID := c.Params("packageId")
	questions := getQuestionsByPackageIDStr(packageID)

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   questions,
	})
}

// Helper internal untuk mengambil array Question berdasarkan package_id
func getQuestionsByPackageID(packageID int) []models.Question {
	query := `SELECT id, package_id, question_type, COALESCE(type_label, ''), content, COALESCE(discussion, ''), COALESCE(points_default, 10.0), COALESCE(options, '[]'::jsonb) 
              FROM questions WHERE package_id = $1 ORDER BY id ASC`

	rows, err := config.DB.Query(context.Background(), query, packageID)
	if err != nil {
		return []models.Question{}
	}
	defer rows.Close()

	questions := []models.Question{}
	for rows.Next() {
		var q models.Question
		var optionsBytes []byte

		err := rows.Scan(&q.ID, &q.PackageID, &q.QuestionType, &q.TypeLabel, &q.Content, &q.Discussion, &q.PointsDefault, &optionsBytes)
		if err == nil {
			json.Unmarshal(optionsBytes, &q.Options)
			if q.Options == nil {
				q.Options = []models.Option{}
			}
			questions = append(questions, q)
		}
	}
	return questions
}

func getQuestionsByPackageIDStr(packageID string) []models.Question {
	query := `SELECT id, package_id, question_type, COALESCE(type_label, ''), content, COALESCE(discussion, ''), COALESCE(points_default, 10.0), COALESCE(options, '[]'::jsonb) 
              FROM questions WHERE package_id = $1 ORDER BY id ASC`

	rows, err := config.DB.Query(context.Background(), query, packageID)
	if err != nil {
		return []models.Question{}
	}
	defer rows.Close()

	questions := []models.Question{}
	for rows.Next() {
		var q models.Question
		var optionsBytes []byte

		err := rows.Scan(&q.ID, &q.PackageID, &q.QuestionType, &q.TypeLabel, &q.Content, &q.Discussion, &q.PointsDefault, &optionsBytes)
		if err == nil {
			json.Unmarshal(optionsBytes, &q.Options)
			if q.Options == nil {
				q.Options = []models.Option{}
			}
			questions = append(questions, q)
		}
	}
	return questions
}
