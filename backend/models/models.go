package models

import "time"

type Role string

const (
	RoleAdmin Role = "admin"
	RoleGuru  Role = "guru"
	RoleSiswa Role = "siswa"
)

type QuestionType string

const (
	TypeSingleChoice  QuestionType = "single_choice"
	TypeTrueFalse     QuestionType = "true_false"
	TypeComplexChoice QuestionType = "complex_choice"
)

type SessionStatus string

const (
	StatusActive   SessionStatus = "active"
	StatusFinished SessionStatus = "finished"
	StatusBlocked  SessionStatus = "blocked"
)

type Staff struct {
	ID           int       `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	Username     string    `json:"username" db:"username"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Role         Role      `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type Student struct {
	ID           int       `json:"id" db:"id"`
	ClassID      int       `json:"class_id" db:"class_id"`
	ClassName    string    `json:"class_name,omitempty"`
	NIS          string    `json:"nis" db:"nis"`
	Name         string    `json:"name" db:"name"`
	DateOfBirth  string    `json:"date_of_birth" db:"date_of_birth"` // YYYY-MM-DD
	Username     string    `json:"username" db:"username"`
	PasswordHash string    `json:"-" db:"password_hash"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type Class struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type BimbelSettings struct {
	ID        int       `json:"id" db:"id"`
	BimbelName string   `json:"bimbel_name" db:"bimbel_name"`
	OwnerName  string   `json:"owner_name" db:"owner_name"`
	Address    string   `json:"address" db:"address"`
	Phone      string   `json:"phone" db:"phone"`
	LogoURL    string   `json:"logo_url" db:"logo_url"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

type Subject struct {
	ID   int    `json:"id" db:"id"`
	Code string `json:"code" db:"code"`
	Name string `json:"name" db:"name"`
}

type QuestionPackage struct {
	ID              int        `json:"id" db:"id"`
	SubjectID       int        `json:"subject_id" db:"subject_id"`
	SubjectName     string     `json:"subject_name,omitempty"`
	TeacherID       int        `json:"teacher_id" db:"teacher_id"`
	TeacherName     string     `json:"teacher_name,omitempty"`
	Code            string     `json:"code" db:"code"`
	Name            string     `json:"name" db:"name"`
	Classes         []string   `json:"classes,omitempty"`
	IsRandomOrder   bool       `json:"is_random_order,omitempty"`
	DurationMinutes int        `json:"duration_minutes,omitempty"`
	Questions       []Question `json:"questions"`
	CreatedAt       time.Time  `json:"created_at,omitempty" db:"created_at"`
}

type Question struct {
	ID            int          `json:"id" db:"id"`
	PackageID     int          `json:"package_id" db:"package_id"`
	QuestionType  QuestionType `json:"question_type" db:"question_type"`
	TypeLabel     string       `json:"type_label,omitempty"`
	Content       string       `json:"content" db:"content"` // Text containing LaTeX formulas
	Discussion    string       `json:"discussion,omitempty" db:"discussion"`
	PointsDefault float64      `json:"points_default,omitempty" db:"points_default"`
	Options       []Option     `json:"options" db:"options"`
	CreatedAt     time.Time    `json:"created_at,omitempty" db:"created_at"`
}

type Option struct {
	ID         int     `json:"id" db:"id"`
	QuestionID int     `json:"question_id,omitempty" db:"question_id"`
	Label      string  `json:"label,omitempty" db:"label"`
	OptionText string  `json:"optionText" db:"option_text"`
	IsCorrect  bool    `json:"isCorrect" db:"is_correct"`
	Points     float64 `json:"points" db:"points"`
}

type Tryout struct {
	ID                  int       `json:"id" db:"id"`
	PackageID           int       `json:"package_id" db:"package_id"`
	PackageName         string    `json:"package_name,omitempty"`
	Title               string    `json:"title" db:"title"`
	Token               string    `json:"token" db:"token"`
	DurationMinutes     int       `json:"duration_minutes" db:"duration_minutes"`
	StartTime           time.Time `json:"start_time" db:"start_time"`
	EndTime             time.Time `json:"end_time" db:"end_time"`
	IsRandomOrder       bool      `json:"is_random_order" db:"is_random_order"`
	ShowResultToStudent bool      `json:"show_result_to_student" db:"show_result_to_student"`
	IsActive            bool      `json:"is_active" db:"is_active"`
	AllowedClassIDs     []int     `json:"allowed_class_ids,omitempty"`
	TokenUpdatedAt      time.Time `json:"token_updated_at" db:"token_updated_at"`
}

type ExamSession struct {
	ID              int           `json:"id" db:"id"`
	StudentID       int           `json:"student_id" db:"student_id"`
	StudentName     string        `json:"student_name,omitempty"`
	TryoutID        int           `json:"tryout_id" db:"tryout_id"`
	TryoutTitle     string        `json:"tryout_title,omitempty"`
	StartTime       time.Time     `json:"start_time" db:"start_time"`
	EndTime         *time.Time    `json:"end_time,omitempty" db:"end_time"`
	Status          SessionStatus `json:"status" db:"status"`
	FinalScore      float64       `json:"final_score" db:"final_score"`
	ViolationsCount int           `json:"violations_count" db:"violations_count"`
}

type StudentAnswer struct {
	ID                int       `json:"id" db:"id"`
	SessionID         int       `json:"session_id" db:"session_id"`
	QuestionID        int       `json:"question_id" db:"question_id"`
	SelectedOptionIDs []int     `json:"selected_option_ids" db:"selected_option_ids"`
	IsDoubtful        bool      `json:"is_doubtful" db:"is_doubtful"`
	IsCorrect         bool      `json:"is_correct" db:"is_correct"`
	ScoreObtained     float64   `json:"score_obtained" db:"score_obtained"`
	AnsweredAt        time.Time `json:"answered_at" db:"answered_at"`
}

type Announcement struct {
	ID         int       `json:"id" db:"id"`
	AuthorID   int       `json:"author_id" db:"author_id"`
	AuthorName string    `json:"author_name,omitempty"`
	Title      string    `json:"title" db:"title"`
	Content    string    `json:"content" db:"content"`
	Target     string    `json:"target" db:"target"` // all, guru, siswa
	Date       string    `json:"date" db:"date"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type ExamConfirmRequest struct {
	TryoutID    int    `json:"tryout_id"`
	FullName    string `json:"full_name"`
	DateOfBirth string `json:"date_of_birth"` // YYYY-MM-DD
	Token       string `json:"token"`
}

type AutoSaveAnswerRequest struct {
	SessionID int         `json:"session_id"`
	Answers   interface{} `json:"answers"`
}
