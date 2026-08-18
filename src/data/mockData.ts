/* import {
  Settings,
  ClassItem,
  StaffUser,
  StudentUser,
  SubjectItem,
  QuestionPackage,
  TryoutItem,
  AnnouncementItem,
  ExamSession,
  ExamScoreRecord,
} from '../types';

export const initialSettings: Settings = {
  bimbelName: 'Bimbel Champion Academy',
  ownerName: 'Dr. H. Ahmad Dahlan, M.Pd',
  address: 'Jl. Pendidikan No. 45, Kebayoran Baru, Jakarta Selatan',
  phone: '021-7890123 / 0812-9988-7766',
};

export const initialClasses: ClassItem[] = [
  { id: 1, name: '12 IPA 1', studentCount: 32 },
  { id: 2, name: '12 IPA 2', studentCount: 30 },
  { id: 3, name: '12 IPS 1', studentCount: 28 },
];

export const initialStaff: StaffUser[] = [
  { id: 1, name: 'Admin Utama Bimbel', username: 'admin', role: 'admin', password: '123' },
  { id: 2, name: 'Drs. Budi Santoso', username: 'budi_mtk', role: 'guru', password: '123' },
  { id: 3, name: 'Dra. Endang Rahayu', username: 'endang_fis', role: 'guru', password: '123' },
];

export const initialStudents: StudentUser[] = [
  {
    id: 10,
    classId: 1,
    className: '12 IPA 1',
    nis: '20241001',
    name: 'Ananda Rizky Pratama',
    dateOfBirth: '2006-05-14',
    username: 'ananda',
    password: '123',
    isActive: true,
  },
  {
    id: 11,
    classId: 1,
    className: '12 IPA 1',
    nis: '20241002',
    name: 'Siti Nurhaliza',
    dateOfBirth: '2006-08-20',
    username: 'siti',
    password: '123',
    isActive: true,
  },
  {
    id: 12,
    classId: 2,
    className: '12 IPA 2',
    nis: '20241003',
    name: 'Bagas Aditya',
    dateOfBirth: '2006-03-10',
    username: 'bagas',
    password: '123',
    isActive: true,
  },
  {
    id: 13,
    classId: 3,
    className: '12 IPS 1',
    nis: '20241004',
    name: 'Rina Wulandari',
    dateOfBirth: '2006-11-05',
    username: 'rina',
    password: '123',
    isActive: true,
  },
];

export const initialSubjects: SubjectItem[] = [
  { id: 1, code: 'MTK-UTBK', name: 'Matematika Penalaran' },
  { id: 2, code: 'FIS-UTBK', name: 'Fisika Terpadu' },
  { id: 3, code: 'PU-UTBK', name: 'Penalaran Umum' },
];

export const initialPackages: QuestionPackage[] = [
  {
    id: 101,
    subjectId: 1,
    subjectName: 'Matematika Penalaran',
    teacherId: 2,
    teacherName: 'Drs. Budi Santoso',
    code: 'MTK-PENALARAN',
    name: 'Soal Matematika Penalaran UTBK & SBMPTN',
    classes: ['12 IPA 1', '12 IPA 2', '12 IPS 1'],
    isRandomOrder: true,
    durationMinutes: 90,
    questions: [
      {
        id: 1001,
        packageId: 101,
        questionType: 'single_choice',
        typeLabel: 'Pilihan Ganda Biasa',
        content:
          'Diberikan persamaan kuadrat $x^2 - 5x + 6 = 0$ dengan akar-akar $\\alpha$ dan $\\beta$. Hitunglah nilai dari $\\alpha^2 + \\beta^2$!',
        discussion:
          'Berdasarkan teorema Vieta, $\\alpha + \\beta = 5$ dan $\\alpha \\cdot \\beta = 6$.\nMaka $\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta = 5^2 - 2(6) = 25 - 12 = 13$.',
        pointsDefault: 10,
        options: [
          { id: 1, label: 'A', optionText: '$13$', isCorrect: true, points: 10 },
          { id: 2, label: 'B', optionText: '$19$', isCorrect: false, points: 0 },
          { id: 3, label: 'C', optionText: '$25$', isCorrect: false, points: 0 },
          { id: 4, label: 'D', optionText: '$30$', isCorrect: false, points: 0 },
          { id: 5, label: 'E', optionText: '$36$', isCorrect: false, points: 0 },
        ],
      },
      {
        id: 1002,
        packageId: 101,
        questionType: 'complex_choice',
        typeLabel: 'Pilihan Ganda Kompleks (Checkbox)',
        content:
          'Pilihlah **SEMUA** matriks di bawah ini yang mempunyai determinan nol (Matriks Singular):',
        discussion:
          'Matriks singular adalah matriks yang nilai determinannya $det(A) = ad - bc = 0$.\nOption A: $2(2) - 4(1) = 0$ (Singular)\nOption C: $3(4) - 6(2) = 0$ (Singular)',
        pointsDefault: 10,
        options: [
          {
            id: 10,
            label: 'A',
            optionText: '$\\begin{pmatrix} 2 & 4 \\\\ 1 & 2 \\end{pmatrix}$',
            isCorrect: true,
            points: 5,
          },
          {
            id: 11,
            label: 'B',
            optionText: '$\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$',
            isCorrect: false,
            points: 0,
          },
          {
            id: 12,
            label: 'C',
            optionText: '$\\begin{pmatrix} 3 & 6 \\\\ 2 & 4 \\end{pmatrix}$',
            isCorrect: true,
            points: 5,
          },
          {
            id: 13,
            label: 'D',
            optionText: '$\\begin{pmatrix} 5 & 2 \\\\ 1 & 3 \\end{pmatrix}$',
            isCorrect: false,
            points: 0,
          },
        ],
      },
      {
        id: 1003,
        packageId: 101,
        questionType: 'true_false',
        typeLabel: 'Benar / Salah (Pernyataan Grid)',
        content:
          'Tentukan kebenaran dari pernyataan kalkulus integral berikut:',
        discussion:
          'Pernyataan 1 Benar: $\\int 2x dx = x^2 + C$.\nPernyataan 2 Salah: $\\int \\sin(x) dx = -\\cos(x) + C$.',
        pointsDefault: 10,
        options: [
          {
            id: 20,
            label: 'Pernyataan 1',
            optionText: 'Hasil integral $\\int_{0}^{2} 3x^2 dx = 8$',
            isCorrect: true,
            points: 5,
          },
          {
            id: 21,
            label: 'Pernyataan 2',
            optionText: 'Turunan pertama dari $f(x) = \\sin(x)$ adalah $-\\cos(x)$',
            isCorrect: false,
            points: 5,
          },
        ],
      },
    ],
  },
  {
    id: 102,
    subjectId: 2,
    subjectName: 'Fisika Terpadu',
    teacherId: 3,
    teacherName: 'Dra. Endang Rahayu',
    code: 'FIS-TERPADU',
    name: 'Soal Fisika Terpadu Kinematika & Gelombang',
    classes: ['12 IPA 1', '12 IPA 2'],
    isRandomOrder: true,
    durationMinutes: 90,
    questions: [
      {
        id: 2001,
        packageId: 102,
        questionType: 'single_choice',
        typeLabel: 'Pilihan Ganda Biasa',
        content:
          'Sebuah benda bergerak lurus berubah beraturan (GLBB) dengan percepatan konstan $a = 2\\text{ m/s}^2$ dari keadaan diam ($v_0 = 0$). Jarak yang ditempuh setelah $t = 4\\text{ detik}$ adalah:',
        discussion:
          'Rumus GLBB: $s = v_0 t + \\frac{1}{2} a t^2 = 0 + \\frac{1}{2}(2)(4^2) = 16\\text{ meter}$.',
        pointsDefault: 10,
        options: [
          { id: 201, label: 'A', optionText: '$8\\text{ m}$', isCorrect: false, points: 0 },
          { id: 202, label: 'B', optionText: '$16\\text{ m}$', isCorrect: true, points: 10 },
          { id: 203, label: 'C', optionText: '$32\\text{ m}$', isCorrect: false, points: 0 },
          { id: 204, label: 'D', optionText: '$64\\text{ m}$', isCorrect: false, points: 0 },
        ],
      },
      {
        id: 2002,
        packageId: 102,
        questionType: 'true_false',
        typeLabel: 'Benar / Salah (Pernyataan Grid)',
        content: 'Tentukan kebenaran hukum fisika gelombang dan bunyi berikut:',
        discussion: 'Kecepatan bunyi tergantung pada medium, frekuensi menentukan nada.',
        pointsDefault: 10,
        options: [
          { id: 210, label: 'Pernyataan 1', optionText: 'Gelombang bunyi merupakan gelombang transversal', isCorrect: false, points: 5 },
          { id: 211, label: 'Pernyataan 2', optionText: 'Panjang gelombang $\\lambda = \\frac{v}{f}$ di mana $v$ kecepatan dan $f$ frekuensi', isCorrect: true, points: 5 },
        ],
      },
    ],
  },
  {
    id: 103,
    subjectId: 3,
    subjectName: 'Penalaran Umum',
    teacherId: 1,
    teacherName: 'Admin Utama Bimbel',
    code: 'PU-SNBT',
    name: 'Soal Penalaran Umum Logika & Diagram',
    classes: ['12 IPA 1', '12 IPA 2', '12 IPS 1'],
    isRandomOrder: true,
    durationMinutes: 60,
    questions: [
      {
        id: 3001,
        packageId: 103,
        questionType: 'single_choice',
        typeLabel: 'Pilihan Ganda Biasa',
        content:
          'Jika semua siswa rajin belajar, maka nilai lulus ujian tinggi. Semua siswa bimbel lulus ujian dengan nilai tinggi. Kesimpulan yang sah adalah:',
        discussion: 'Modus Ponens & Silogisme Logika Kuantor.',
        pointsDefault: 10,
        options: [
          { id: 301, label: 'A', optionText: 'Semua siswa bimbel rajin belajar', isCorrect: true, points: 10 },
          { id: 302, label: 'B', optionText: 'Beberapa siswa bimbel tidak rajin', isCorrect: false, points: 0 },
          { id: 303, label: 'C', optionText: 'Semua siswa tidak lulus ujian', isCorrect: false, points: 0 },
          { id: 304, label: 'D', optionText: 'Tidak dapat disimpulkan', isCorrect: false, points: 0 },
        ],
      },
    ],
  },
  {
    id: 104,
    subjectId: 1,
    subjectName: 'TKA SMA',
    teacherId: 2,
    teacherName: 'Drs. Budi Santoso',
    code: 'TKA-SMA',
    name: 'Soal TKA SMA Paket Komprehensif',
    classes: ['12 IPA 1', '12 IPA 2'],
    isRandomOrder: false,
    durationMinutes: 120,
    questions: [
      {
        id: 4001,
        packageId: 104,
        questionType: 'single_choice',
        typeLabel: 'Pilihan Ganda Biasa',
        content:
          'Nilai dari turunan pertama fungsi $f(x) = 3x^4 - 4x^3 + 2x - 7$ pada $x = 1$ adalah:',
        discussion: '$f\'(x) = 12x^3 - 12x^2 + 2$. Pada $x=1$, $f\'(1) = 12(1) - 12(1) + 2 = 2$.',
        pointsDefault: 10,
        options: [
          { id: 401, label: 'A', optionText: '$0$', isCorrect: false, points: 0 },
          { id: 402, label: 'B', optionText: '$2$', isCorrect: true, points: 10 },
          { id: 403, label: 'C', optionText: '$4$', isCorrect: false, points: 0 },
          { id: 404, label: 'D', optionText: '$12$', isCorrect: false, points: 0 },
        ],
      },
    ],
  },
];

export const initialTryouts: TryoutItem[] = [
  {
    id: 501,
    packageId: 101,
    title: 'Try Out Akbar SNBT 2026 - Gelombang 1 (Matematika)',
    token: 'AX982',
    durationMinutes: 90,
    startTime: '2026-07-28 08:00',
    endTime: '2026-07-28 17:00',
    isRandomOrder: true,
    showResultToStudent: true,
    isActive: true,
    allowedClassNames: ['12 IPA 1', '12 IPA 2', '12 IPS 1'],
  },
];

export const initialSessions: ExamSession[] = [
  {
    id: 1,
    studentId: 10,
    studentName: 'Ananda Rizky Pratama',
    studentNis: '20241001',
    className: '12 IPA 1',
    tryoutId: 501,
    tryoutTitle: 'Try Out Akbar SNBT 2026 - Gelombang 1',
    startTime: '08:00 WIB',
    status: 'active',
    finalScore: 0,
    violationsCount: 0,
  },
  {
    id: 2,
    studentId: 11,
    studentName: 'Siti Nurhaliza',
    studentNis: '20241002',
    className: '12 IPA 1',
    tryoutId: 501,
    tryoutTitle: 'Try Out Akbar SNBT 2026 - Gelombang 1',
    startTime: '08:05 WIB',
    status: 'blocked',
    finalScore: 0,
    violationsCount: 2,
  },
  {
    id: 3,
    studentId: 12,
    studentName: 'Bagas Aditya',
    studentNis: '20241003',
    className: '12 IPA 2',
    tryoutId: 501,
    tryoutTitle: 'Try Out Akbar SNBT 2026 - Gelombang 1',
    startTime: '07:50 WIB',
    status: 'finished',
    finalScore: 87.5,
    violationsCount: 0,
  },
];

export const initialAnnouncements: AnnouncementItem[] = [
  {
    id: 1,
    authorName: 'Admin Utama',
    title: 'Pelaksanaan Try Out Akbar SNBT Gelombang 1',
    content:
      'Dimohon seluruh siswa kelas 12 untuk hadir tepat waktu. Siapkan Token 5 digit yang akan diberikan oleh admin/tentor saat sesi ujian dimulai.',
    target: 'all',
    date: '28 Juli 2026',
  },
  {
    id: 2,
    authorName: 'Drs. Budi Santoso',
    title: 'Jadwal Pendalaman Materi Matematika Penalaran',
    content:
      'Pembahasan Try Out Matematika akan dilaksanakan pada hari Jumat pukul 15.30 WIB di Ruang Utama.',
    target: 'siswa',
    date: '27 Juli 2026',
  },
];

export const initialScores: ExamScoreRecord[] = [
  {
    id: 1,
    studentName: 'Ananda Rizky Pratama',
    className: '12 IPA 1',
    subjectName: 'Matematika Penalaran',
    tryoutTitle: 'Try Out Simulasi Mandiri 1',
    score: 68.0,
    totalCorrect: 12,
    totalWrong: 8,
    date: '05/07/2026',
  },
  {
    id: 2,
    studentName: 'Ananda Rizky Pratama',
    className: '12 IPA 1',
    subjectName: 'Literasi Bahasa Indonesia',
    tryoutTitle: 'Try Out Mingguan Ke-1',
    score: 74.5,
    totalCorrect: 15,
    totalWrong: 5,
    date: '12/07/2026',
  },
  {
    id: 3,
    studentName: 'Ananda Rizky Pratama',
    className: '12 IPA 1',
    subjectName: 'Penalaran Umum',
    tryoutTitle: 'Try Out Mingguan Ke-2',
    score: 82.0,
    totalCorrect: 17,
    totalWrong: 3,
    date: '19/07/2026',
  },
  {
    id: 4,
    studentName: 'Ananda Rizky Pratama',
    className: '12 IPA 1',
    subjectName: 'Pengetahuan Kuantitatif',
    tryoutTitle: 'Try Out Evaluasi Tengah Semester',
    score: 78.5,
    totalCorrect: 16,
    totalWrong: 4,
    date: '24/07/2026',
  },
  {
    id: 5,
    studentName: 'Ananda Rizky Pratama',
    className: '12 IPA 1',
    subjectName: 'Matematika Penalaran',
    tryoutTitle: 'Try Out Akbar SNBT Gel. 1',
    score: 88.0,
    totalCorrect: 18,
    totalWrong: 2,
    date: '28/07/2026',
  },
  {
    id: 6,
    studentName: 'Bagas Aditya',
    className: '12 IPA 2',
    subjectName: 'Matematika Penalaran',
    tryoutTitle: 'Try Out Akbar SNBT Gel. 1',
    score: 87.5,
    totalCorrect: 17,
    totalWrong: 3,
    date: '28/07/2026',
  },
  {
    id: 7,
    studentName: 'Rina Wulandari',
    className: '12 IPS 1',
    subjectName: 'Matematika Penalaran',
    tryoutTitle: 'Try Out Simulasi Mandiri 1',
    score: 75.0,
    totalCorrect: 15,
    totalWrong: 5,
    date: '25/07/2026',
  },
];
*/
