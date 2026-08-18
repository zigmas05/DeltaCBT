export type UserRole = 'admin' | 'guru' | 'siswa';

export type QuestionType = 'single_choice' | 'true_false' | 'complex_choice' | 'graded_choice';

export type SessionStatus = 'active' | 'finished' | 'blocked';

export type TargetAudience = 'all' | 'guru' | 'siswa';

export interface Settings {
  bimbelName: string;
  ownerName: string;
  address: string;
  phone: string;
  logoUrl?: string;
}

export interface ClassItem {
  id: number;
  name: string;
  studentCount?: number;
}

export interface StaffUser {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'guru';
  password?: string;
}

export interface StudentUser {
  id: number;
  classId: number;
  className: string;
  nis: string;
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  username: string;
  password?: string;
  isActive: boolean;
}

export interface SubjectItem {
  id: number;
  code: string;
  name: string;
}

export interface QuestionOption {
  id: number;
  label: string; // A, B, C, D, E or 1, 2, 3
  optionText: string; // LaTeX text
  isCorrect: boolean;
  points: number;
}

export interface QuestionItem {
  id: number;
  packageId: number;
  questionType: QuestionType;
  typeLabel: string;
  content: string; // Raw LaTeX text
  discussion: string; // LaTeX explanation
  pointsDefault: number;
  options: QuestionOption[];
}

export interface QuestionPackage {
  id: number;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  code: string; // kd_soal
  name: string; // Nama Soal
  classes: string[]; // ['9A', '9B'] or ['12 IPA 1']
  isRandomOrder: boolean; // Soal diurut atau acak
  durationMinutes: number; // Durasi dalam menit
  questions: QuestionItem[];
}

export interface TryoutItem {
  id: number;
  packageId: number;
  title: string;
  token: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  isRandomOrder: boolean;
  showResultToStudent: boolean;
  isActive: boolean;
  allowedClassNames: string[];
}

export interface ExamSession {
  id: number;
  studentId: number;
  studentName: string;
  studentNis: string;
  className: string;
  tryoutId: number;
  tryoutTitle: string;
  startTime: string; // ISO date
  endTime?: string;  // ISO date
  status: SessionStatus;
  finalScore: number;
  violationsCount: number;
  answers?: any;
}

export interface StudentAnswer {
  questionId: number;
  selectedOptionIds: number[];
  isDoubtful: boolean;
}

export interface AnnouncementItem {
  id: number;
  authorName: string;
  title: string;
  content: string;
  target: TargetAudience;
  date: string;
}

export interface ExamScoreRecord {
  id: number;
  studentNis: string;
  studentName: string;
  className: string;
  subjectName: string;
  tryoutTitle: string;
  finalScore: number;
  totalCorrect: number;
  totalWrong: number;
  show_review?: boolean;
  date: string;
  answers?: any[];
}
