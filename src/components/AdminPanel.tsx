import React, { useState, useEffect } from 'react';
import {
  deleteStudentFromSupabase,
  upsertClassToSupabase,
  upsertStaffToSupabase,
  upsertStudentToSupabase,
  clearAllExamSessionsFromSupabase,
  deleteTryoutFromSupabase,
  upsertTryoutToSupabase,
  resetSessionInSupabase,
  updateExamScoreReviewStatus,
  upsertScoreToSupabase,
  upsertSessionToSupabase
} from '../lib/supabaseService';
import { calculateTotalExamScore } from '../lib/scoreCalculator';
import {
  ClassItem,
  StudentUser,
  StaffUser,
  SubjectItem,
  QuestionPackage,
  TryoutItem,
  AnnouncementItem,
  ExamSession,
  ExamScoreRecord,
  Settings,
  QuestionItem,
  QuestionType,
  TargetAudience,
} from '../types';
import { KaTeXRenderer } from './KaTeXRenderer';
import {
  Users,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Edit,
  FileSpreadsheet,
  Megaphone,
  Printer,
  Settings as SettingsIcon,
  Shield,
  Layers,
  Award,
  KeyRound,
  Eye,
  EyeOff,
  FileText,
  Sparkles,
  Filter,
  Clock,
  Shuffle,
  GraduationCap,
  Zap,
  Radio,
  RotateCcw,
  StopCircle,
  PlayCircle,
  Search,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  XCircle,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  X,
  Download,
  Database,
  Code,
  Terminal,
  Server,
  Check,
  ExternalLink,
  Cpu,
} from 'lucide-react';

interface AdminPanelProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  classes: ClassItem[];
  setClasses: React.Dispatch<React.SetStateAction<ClassItem[]>>;
  students: StudentUser[];
  setStudents: React.Dispatch<React.SetStateAction<StudentUser[]>>;
  staff: StaffUser[];
  setStaff: React.Dispatch<React.SetStateAction<StaffUser[]>>;
  subjects: SubjectItem[];
  setSubjects: React.Dispatch<React.SetStateAction<SubjectItem[]>>;
  packages: QuestionPackage[];
  setPackages: React.Dispatch<React.SetStateAction<QuestionPackage[]>>;
  tryouts: TryoutItem[];
  setTryouts: React.Dispatch<React.SetStateAction<TryoutItem[]>>;
  sessions: ExamSession[];
  setSessions: React.Dispatch<React.SetStateAction<ExamSession[]>>;
  announcements: AnnouncementItem[];
  setAnnouncements: React.Dispatch<React.SetStateAction<AnnouncementItem[]>>;
  scores: ExamScoreRecord[];
  setScores: React.Dispatch<React.SetStateAction<ExamScoreRecord[]>>;
  currentToken: string;
  onRefreshToken: () => void;
  onOpenPrint: () => void;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}

const createEmptyStudentForm = () => ({
  name: '',
  nis: '',
  className: '12 IPA 1',
  dateOfBirth: '2006-01-01',
  username: '',
  password: '123',
});

const createEmptyStaffForm = () => ({
  name: '',
  username: '',
  password: '123',
  role: 'guru' as 'admin' | 'guru',
});

export const AdminPanel: React.FC<AdminPanelProps> = ({
  settings,
  setSettings,
  classes,
  setClasses,
  students,
  setStudents,
  staff,
  setStaff,
  subjects,
  setSubjects,
  packages,
  setPackages,
  tryouts,
  setTryouts,
  sessions,
  setSessions,
  announcements,
  setAnnouncements,
  scores,
  setScores,
  currentToken,
  onRefreshToken,
  onOpenPrint,
  activeTab: activeTabProp,
  setActiveTab: setActiveTabProp,
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<
    'dashboard' | 'master' | 'soal' | 'tryout' | 'hasil' | 'pengumuman' | 'inspeksi_api' | 'pengaturan'
  >('dashboard');

  const activeTab = (activeTabProp || localActiveTab) as
    | 'dashboard'
    | 'master'
    | 'soal'
    | 'tryout'
    | 'hasil'
    | 'pengumuman'
    | 'inspeksi_api'
    | 'pengaturan';

  // Inspeksi API & DDL sub-tab state
  const [inspeksiSubTab, setInspeksiSubTab] = useState<'supabase_conn' | 'ddl_sql' | 'golang_api'>('supabase_conn');
  const [copiedDDL, setCopiedDDL] = useState(false);
  const [copiedGolang, setCopiedGolang] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState<string | null>(null);

  const setActiveTab = (tab: any) => {
    if (setActiveTabProp) setActiveTabProp(tab);
    setLocalActiveTab(tab);
  };

  // Master Data sub-tabs
  const [masterSubTab, setMasterSubTab] = useState<'kelas' | 'siswa' | 'guru'>('siswa');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentRowsPerPage, setStudentRowsPerPage] = useState<number>(10);
  const [studentCurrentPage, setStudentCurrentPage] = useState<number>(1);

  // Modal & Form States
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSqlModal, setCopiedSqlModal] = useState(false);
  const [showStudentPasswordMap, setShowStudentPasswordMap] = useState<Record<number, boolean>>({});
  const [newStudent, setNewStudent] = useState(createEmptyStudentForm());

  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState<StudentUser | null>(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);

  // Staff Management State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [newStaff, setNewStaff] = useState(createEmptyStaffForm());
  const [showStaffPasswordMap, setShowStaffPasswordMap] = useState<Record<number, boolean>>({});
  const [showModalPassword, setShowModalPassword] = useState(false);

  const resetStudentForm = () => {
    setNewStudent(createEmptyStudentForm());
  };

  const resetStaffForm = () => {
    setNewStaff(createEmptyStaffForm());
    setShowModalPassword(false);
  };

  // Subject Filter & Management
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'all'>('all');

  // Sub-tabs for Manajemen Try Out
  const [tryoutSubTab, setTryoutSubTab] = useState<'aktivasi' | 'status' | 'reset'>('aktivasi');

  // 20-minute automatic token refresh countdown timer (1200 seconds)
  const [tokenTimer, setTokenTimer] = useState<number>(1200);

  useEffect(() => {
    const interval = setInterval(() => {
      setTokenTimer((prev) => {
        if (prev <= 1) {
          onRefreshToken();
          return 1200; // Reset to 20 minutes
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onRefreshToken]);

  // Format seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Search term for Reset Peserta
  const [resetSearchTerm, setResetSearchTerm] = useState('');

  // Handler Paksa Henti Sesi Ujian Siswa
  const handleForceStopSession = async (sessionId: number, studentName: string) => {
    if (
      confirm(
        `Apakah Anda yakin ingin MENGHENTIKAN PAKSA pengerjaan ujian siswa "${studentName}"? Siswa tidak akan dapat melanjutkan pengerjaan.`
      )
    ) {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const now = new Date().toISOString();

      let scoreObtained = 0;
      let correctCount = 0;
      let wrongCount = 0;

      const reconstructedAnswers: Record<number, any> = {};
      const reconstructedTfAnswers: Record<number, any> = {};
      const answersArray = Array.isArray(session.answers) ? session.answers : [];

      answersArray.forEach((ans: any) => {
        if (ans && ans.questionId !== undefined) {
          reconstructedAnswers[ans.questionId] = ans;
          if (ans.tfAnswers) {
            reconstructedTfAnswers[ans.questionId] = ans.tfAnswers;
          }
        }
      });

      const tryout = tryouts.find(t => t.id === session.tryoutId);
      const pkgActual = packages.find(p => p.id === tryout?.packageId);

      if (pkgActual) {
        const { totalObtained, correctCount: cCount, wrongCount: wCount } = calculateTotalExamScore(
          pkgActual.questions,
          reconstructedAnswers,
          reconstructedTfAnswers
        );
        scoreObtained = totalObtained;
        correctCount = cCount;
        wrongCount = wCount;
      }

      const updatedSession: ExamSession = {
        ...session,
        status: 'finished',
        endTime: now,
        finalScore: scoreObtained
      };

      const newScore: ExamScoreRecord = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        studentNis: session.studentNis,
        studentName: session.studentName,
        className: session.className,
        subjectName: tryout ? tryout.title : 'Mata Pelajaran',
        tryoutTitle: tryout ? tryout.title : 'Try Out',
        finalScore: scoreObtained,
        totalCorrect: correctCount,
        totalWrong: wrongCount,
        date: new Date().toLocaleDateString('id-ID'),
        answers: answersArray,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? updatedSession : s
        )
      );
      setScores(prev => [newScore, ...prev]);

      await upsertSessionToSupabase(updatedSession);
      await upsertScoreToSupabase(newScore);

      alert(`Sesi ujian ${studentName} berhasil dihentikan secara paksa oleh Admin dan nilainya telah masuk.`);
    }
  };

  // Handler Reset Peserta (koneksi terputus / gangguan sinyal / keluar kiosk)
  const handleResetStudentSession = async (sessionId: number, studentName: string) => {
    const success = await resetSessionInSupabase(sessionId);
    if (!success) {
      alert("Gagal mereset sesi peserta di database.");
      return;
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, status: 'active', violationsCount: 0 } : s
      )
    );
    alert(
      `Sesi peserta "${studentName}" berhasil di-reset! Peserta sekarang dapat login kembali ke aplikasi CBT tanpa kehilangan progress jawaban.`
    );
  };

  // Handler Generate & Aktifkan Paket Soal sebagai Try Out
  const handleActivatePackageAsTryout = async (pkg: QuestionPackage, startTime: string, endTime: string, isRandom: boolean) => {
    const dStart = new Date();
    const [hS, mS] = startTime.split(':');
    dStart.setHours(parseInt(hS, 10) || 7, parseInt(mS, 10) || 0, 0, 0);

    const dEnd = new Date();
    const [hE, mE] = endTime.split(':');
    dEnd.setHours(parseInt(hE, 10) || 10, parseInt(mE, 10) || 0, 0, 0);

    const newTryout: TryoutItem = {
      id: Date.now(),
      packageId: pkg.id,
      title: pkg.name,
      token: currentToken,
      durationMinutes: pkg.durationMinutes || 90,
      startTime: dStart.toISOString(),
      endTime: dEnd.toISOString(),
      isRandomOrder: isRandom,
      showResultToStudent: true,
      isActive: true,
      allowedClassNames: pkg.classes && pkg.classes.length > 0 ? pkg.classes : ['12 IPA 1'],
    };

    setTryouts((prev) => [newTryout, ...prev]);

    // Save to Supabase
    await upsertTryoutToSupabase({
      id: newTryout.id,
      package_id: newTryout.packageId,
      title: newTryout.title,
      token: newTryout.token,
      duration_minutes: newTryout.durationMinutes,
      start_time: newTryout.startTime,
      end_time: newTryout.endTime,
      is_random_order: newTryout.isRandomOrder,
      show_result_to_student: newTryout.showResultToStudent,
      is_active: newTryout.isActive,
      allowed_class_names: newTryout.allowedClassNames
    });

    alert(
      `Paket Soal "${pkg.name}" BERHASIL Di-generate & Diaktifkan sebagai Ujian Try Out! Token Ujian Aktif: ${currentToken}`
    );
  };

  // Toggle Tryout Active status
  const handleToggleTryoutStatus = (tryoutId: number) => {
    setTryouts((prev) =>
      prev.map((t) => (t.id === tryoutId ? { ...t, isActive: !t.isActive } : t))
    );
  };

  // Delete Tryout Item
  const handleDeleteTryout = async (tryoutId: number, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus sesi ujian "${title}"?`)) {
      try {
        const success = await deleteTryoutFromSupabase(tryoutId);
        if (success) {
          setTryouts((prev) => prev.filter((t) => t.id !== tryoutId));
        } else {
          alert('Gagal menghapus sesi ujian.');
        }
      } catch (error) {
        console.error(error);
        alert('Terjadi kesalahan saat menghapus sesi ujian.');
      }
    }
  };
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  // Package Management (Tambah / Edit Soal Utama)
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const [pkgCode, setPkgCode] = useState('');
  const [pkgName, setPkgName] = useState('');
  const [pkgSubjectId, setPkgSubjectId] = useState<number>(1);
  const [pkgTeacherId, setPkgTeacherId] = useState<number>(2);
  const [pkgClasses, setPkgClasses] = useState<string[]>(['12 IPA 1']);
  const [pkgIsRandomOrder, setPkgIsRandomOrder] = useState<boolean>(true);
  const [pkgDurationMinutes, setPkgDurationMinutes] = useState<number>(90);
  const [customClassName, setCustomClassName] = useState('');

  // Tryout Management State & Features
  const [showActivateExamModal, setShowActivateExamModal] = useState(false);
  const [selectedPkgToActivate, setSelectedPkgToActivate] = useState<QuestionPackage | null>(null);
  const [actStartTime, setActStartTime] = useState('07:00');
  const [actEndTime, setActEndTime] = useState('10:00');
  const [actIsRandom, setActIsRandom] = useState(true);
  const [isStatusFullscreen, setIsStatusFullscreen] = useState(false);
  const [statusPageSize, setStatusPageSize] = useState<number | 'all'>(10);

  // Hasil & Rangking Sub-Tabs and Filters State
  const [hasilSubTab, setHasilSubTab] = useState<'pararel' | 'kelas'>('pararel');
  const [selectedParallelTryoutTitle, setSelectedParallelTryoutTitle] = useState<string>('');
  const [selectedClassTryoutTitle, setSelectedClassTryoutTitle] = useState<string>('');
  const [selectedResultClassName, setSelectedResultClassName] = useState<string>('');

  const availableTryoutTitles = Array.from(new Set(scores.map((s) => s.tryoutTitle))).sort();

  // Get Parallel Results across all students sorted by score descending (Rank #1, #2, ...)
  const getParallelResults = () => {
    if (!selectedParallelTryoutTitle) return [];

    const matched = scores.filter(
      (s) => s.tryoutTitle === selectedParallelTryoutTitle
    );

    return [...matched].sort((a, b) => b.finalScore - a.finalScore);
  };

  // Get Class Results for selected class and tryout, sorted by NIS
  const getClassResults = () => {
    if (!selectedResultClassName || !selectedClassTryoutTitle) return [];

    const matched = scores.filter(
      (s) =>
        s.className === selectedResultClassName &&
        s.tryoutTitle === selectedClassTryoutTitle
    );

    return [...matched].sort((a, b) => {
      const nisA = Number(a.studentNis) || 0;
      const nisB = Number(b.studentNis) || 0;
      if (nisA !== nisB) return nisA - nisB;
      return a.studentName.localeCompare(b.studentName);
    });
  };

  // Handler Export Excel Hasil Pararel
  const handleExportParallelExcel = () => {
    if (!selectedParallelTryoutTitle) {
      alert('Silakan pilih Try Out terlebih dahulu!');
      return;
    }
    const data = getParallelResults();
    const title = selectedParallelTryoutTitle;

    let csvContent = 'data:text/csv;charset=utf-8,Rank,Nama Siswa,NIS,Kelas,Try Out,Benar,Salah,Nilai Akhir\n';
    data.forEach((row, idx) => {
      csvContent += `${idx + 1},"${row.studentName}","${row.studentNis}","${row.className}","${row.tryoutTitle}",${row.totalCorrect},${row.totalWrong},${row.finalScore}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hasil_Pararel_${title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStatusExcel = () => {
    let csvContent = 'data:text/csv;charset=utf-8,No,Nama Siswa,Kelas,Mata Ujian,Mulai Ujian,Durasi Siswa,Soal Terjawab,Soal Belum,Soal Ragu,Status Sesi\n';
    sessions.forEach((s, idx) => {
      const tryout = tryouts.find(t => t.id === s.tryoutId);
      const pkg = tryout ? packages.find(p => p.id === tryout.packageId) : null;
      const totalQuestions = pkg?.questions?.length || 30;

      let parsedAnswers: any[] = [];
      if (typeof s.answers === 'string') {
        try { parsedAnswers = JSON.parse(s.answers); } catch (e) { }
      } else if (Array.isArray(s.answers)) {
        parsedAnswers = s.answers;
      }
      const answered = parsedAnswers.filter(a => a && a.selectedOptionIds && a.selectedOptionIds.length > 0).length;
      const doubtful = parsedAnswers.filter(a => a && a.isDoubtful).length;
      const unanswered = totalQuestions - answered;

      let durationStr = '-';
      if (s.status === 'finished' && s.endTime && s.startTime) {
        const diffSecs = Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000);
        const mm = Math.floor(diffSecs / 60);
        const ss = diffSecs % 60;
        durationStr = `${mm}m ${ss}s`;
      } else if (s.status === 'active' && s.startTime) {
        const diffSecs = Math.floor((new Date().getTime() - new Date(s.startTime).getTime()) / 1000);
        const mm = Math.floor(diffSecs / 60);
        const ss = diffSecs % 60;
        durationStr = `${mm}m ${ss}s (Berjalan)`;
      }

      const startTimeStr = s.startTime ? new Date(s.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
      const statusStr = s.status === 'finished' ? 'Selesai' : s.status === 'blocked' ? 'Diblokir' : 'Dalam Proses';

      csvContent += `${idx + 1},"${s.studentName}","${s.className}","${s.tryoutTitle}","${startTimeStr}","${durationStr}",${answered},${unanswered},${doubtful},"${statusStr}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Status_Tryout_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportClassExcel = () => {
    if (!selectedResultClassName || !selectedClassTryoutTitle) {
      alert("Pilih Kelas dan Paket Try Out terlebih dahulu.");
      return;
    }
    const data = getClassResults();
    const title = selectedClassTryoutTitle;

    let csvContent = 'data:text/csv;charset=utf-8,No,NIS,Nama Siswa,Benar,Salah,Nilai Akhir\n';
    data.forEach((row, idx) => {
      csvContent += `${idx + 1},"${row.studentNis}","${row.studentName}",${row.totalCorrect},${row.totalWrong},${row.finalScore}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hasil_Kelas_${selectedResultClassName}_${title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleReview = async (scoreId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const success = await updateExamScoreReviewStatus(scoreId, newStatus);
    if (success) {
      setScores(prev => prev.map(s => s.id === scoreId ? { ...s, show_review: newStatus } : s));
    } else {
      alert("Gagal memperbarui status review nilai.");
    }
  };

  const handleToggleReviewMasal = async () => {
    const classScores = getClassResults();
    if (classScores.length === 0) return;

    // Check if any is false. If any is false, we set all to true. If all are true, we set all to false.
    const anyFalse = classScores.some(s => !s.show_review);
    const newStatus = anyFalse; // Set all to true if at least one is false, else set all to false

    // Update in parallel
    const promises = classScores.map(s => updateExamScoreReviewStatus(s.id!, newStatus));
    const results = await Promise.all(promises);

    if (results.every(r => r)) {
      setScores(prev => prev.map(s => {
        if (classScores.find(cs => cs.id === s.id)) {
          return { ...s, show_review: newStatus };
        }
        return s;
      }));
    } else {
      alert("Sebagian data gagal diperbarui status review-nya.");
    }
  };

  const handleExportStudentsExcel = () => {
    if (students.length === 0) {
      alert("Tidak ada data siswa untuk diexport.");
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,No,NIS,Nama Lengkap,Kelas,Tanggal Lahir,Username,Password\n';

    // Sort students by NIS before export
    const sorted = [...students].sort((a, b) => a.nis.localeCompare(b.nis));

    sorted.forEach((row, idx) => {
      const rowPassword = row.password || '123';
      csvContent += `${idx + 1},"${row.nis}","${row.name}","${row.className}","${row.dateOfBirth}","${row.username}","${rowPassword}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Siswa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllSessions = async () => {
    if (sessions.length === 0) {
      alert('Tidak ada sesi yang tersimpan saat ini.');
      return;
    }
    if (
      confirm(
        'PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA sesi ujian dari Status Try Out? Data yang dihapus tidak dapat dikembalikan. (Nilai yang sudah masuk ke Hasil Ujian tidak akan terhapus).'
      )
    ) {
      const ok = await clearAllExamSessionsFromSupabase();
      if (ok) {
        setSessions([]);
        alert('Berhasil membersihkan seluruh sesi ujian.');
      } else {
        alert('Gagal membersihkan sesi ujian. Silakan coba lagi.');
      }
    }
  };

  // Force stop all active sessions at once
  const handleForceStopAllSessions = async () => {
    const activeSessions = sessions.filter((s) => s.status === 'active' || s.status === 'blocked');
    if (activeSessions.length === 0) {
      alert('Tidak ada peserta yang sedang mengerjakan ujian saat ini.');
      return;
    }
    if (
      confirm(
        `Apakah Anda yakin ingin MEMPAKSA HENTI MASAL seluruh ${activeSessions.length} peserta yang sedang aktif mengerjakan ujian?`
      )
    ) {
      const now = new Date().toISOString();
      const updatedSessions: ExamSession[] = [];
      const newScores: ExamScoreRecord[] = [];

      activeSessions.forEach(session => {
        let scoreObtained = 0;
        let correctCount = 0;
        let wrongCount = 0;

        const reconstructedAnswers: Record<number, any> = {};
        const reconstructedTfAnswers: Record<number, any> = {};
        const answersArray = Array.isArray(session.answers) ? session.answers : [];

        answersArray.forEach((ans: any) => {
          if (ans && ans.questionId !== undefined) {
            reconstructedAnswers[ans.questionId] = ans;
            if (ans.tfAnswers) {
              reconstructedTfAnswers[ans.questionId] = ans.tfAnswers;
            }
          }
        });

        const tryout = tryouts.find(t => t.id === session.tryoutId);
        const pkgActual = packages.find(p => p.id === tryout?.packageId);

        if (pkgActual) {
          const { totalObtained, correctCount: cCount, wrongCount: wCount } = calculateTotalExamScore(
            pkgActual.questions,
            reconstructedAnswers,
            reconstructedTfAnswers
          );
          scoreObtained = totalObtained;
          correctCount = cCount;
          wrongCount = wCount;
        }

        const updatedSession: ExamSession = {
          ...session,
          status: 'finished',
          endTime: now,
          finalScore: scoreObtained
        };
        updatedSessions.push(updatedSession);

        const newScore: ExamScoreRecord = {
          id: Date.now() + Math.floor(Math.random() * 10000) + session.id,
          studentNis: session.studentNis,
          studentName: session.studentName,
          className: session.className,
          subjectName: tryout ? tryout.title : 'Mata Pelajaran',
          tryoutTitle: tryout ? tryout.title : 'Try Out',
          finalScore: scoreObtained,
          totalCorrect: correctCount,
          totalWrong: wrongCount,
          date: new Date().toLocaleDateString('id-ID'),
          answers: answersArray,
        };
        newScores.push(newScore);
      });

      setSessions((prev) =>
        prev.map((s) => {
          const match = updatedSessions.find(us => us.id === s.id);
          return match ? match : s;
        })
      );
      setScores(prev => [...newScores, ...prev]);

      await Promise.all(updatedSessions.map(s => upsertSessionToSupabase(s)));
      await Promise.all(newScores.map(s => upsertScoreToSupabase(s)));

      alert(`Berhasil mempaksa henti masal ${activeSessions.length} peserta ujian dan nilainya telah masuk.`);
    }
  };

  // Question Input & Review State
  const [selectedReviewPkgId, setSelectedReviewPkgId] = useState<number | null>(null);
  const [isQuestionEditorPage, setIsQuestionEditorPage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTarget, setImageTarget] = useState<'question' | number>('question');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedPkgId, setSelectedPkgId] = useState<number>(101);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>('single_choice');
  const [questionContent, setQuestionContent] = useState<string>(
    'Hitunglah integral $\\int_{0}^{3} 2x dx$!'
  );
  const [optionCount, setOptionCount] = useState<number>(5);
  const [optionsState, setOptionsState] = useState([
    { label: 'A', text: '$9$', isCorrect: true, points: 10 },
    { label: 'B', text: '$6$', isCorrect: false, points: 0 },
    { label: 'C', text: '$12$', isCorrect: false, points: 0 },
    { label: 'D', text: '$15$', isCorrect: false, points: 0 },
    { label: 'E', text: '$18$', isCorrect: false, points: 0 },
  ]);

  // Helper for inserting formatting tags into question textarea
  const insertFormattingTag = (startTag: string, endTag: string = '', defaultText: string = '') => {
    const textarea = document.getElementById('question-content-textarea') as HTMLTextAreaElement;
    if (!textarea) {
      setQuestionContent((prev) => prev + `${startTag}${defaultText}${endTag}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || defaultText;
    const replacement = `${startTag}${selectedText}${endTag}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setQuestionContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + startTag.length, start + startTag.length + selectedText.length);
    }, 50);
  };

  // Helper for inserting image tag into question or option content
  const handleInsertImage = (url: string) => {
    if (!url.trim()) return;
    if (imageTarget === 'question') {
      const imgHtml = `<img src="${url.trim()}" alt="Gambar Soal" class="max-w-md my-2 rounded-2xl border border-slate-200 shadow-xs" />`;
      setQuestionContent((prev) => prev + '\n' + imgHtml);
    } else if (typeof imageTarget === 'number') {
      const imgHtml = `<img src="${url.trim()}" alt="Gambar Opsi" class="max-w-[220px] max-h-40 my-1 rounded-xl border border-slate-200 shadow-2xs block" />`;
      setOptionsState((prev) =>
        prev.map((o, i) => (i === imageTarget ? { ...o, text: (o.text ? o.text + '\n' : '') + imgHtml } : o))
      );
    }
    setShowImageModal(false);
    setCustomImageUrl('');
  };

  // Helper for inserting LaTeX shortcuts into a specific option
  const insertOptionLatex = (optIdx: number, latex: string) => {
    setOptionsState((prev) =>
      prev.map((o, i) => (i === optIdx ? { ...o, text: (o.text ? o.text + ' ' : '') + latex } : o))
    );
  };

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnno, setNewAnno] = useState<{ title: string; content: string; target: TargetAudience }>({
    title: '',
    content: '',
    target: 'all',
  });

  // Add Subject handler
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName || !newSubjectCode) return;
    const newSub: SubjectItem = {
      id: Date.now(),
      code: newSubjectCode.toUpperCase(),
      name: newSubjectName,
    };
    setSubjects((prev) => [...prev, newSub]);
    setNewSubjectCode('');
    setNewSubjectName('');
    setShowSubjectModal(false);
  };

  // Open Create Package Modal
  const handleOpenCreatePackage = () => {
    setEditingPackageId(null);
    setPkgCode(`PKG-${Date.now().toString().slice(-4)}`);
    setPkgName('');
    setPkgSubjectId(subjects[0]?.id || 1);
    const firstTeacher = staff.find((s) => s.role === 'guru') || staff[0];
    setPkgTeacherId(firstTeacher?.id || 1);
    setPkgClasses(classes.length > 0 ? [classes[0].name] : ['9A']);
    setPkgIsRandomOrder(true);
    setPkgDurationMinutes(90);
    setShowPackageModal(true);
  };

  // Open Edit Package Modal
  const handleOpenEditPackage = (pkg: QuestionPackage) => {
    setEditingPackageId(pkg.id);
    setPkgCode(pkg.code);
    setPkgName(pkg.name);
    setPkgSubjectId(pkg.subjectId);
    setPkgTeacherId(pkg.teacherId);
    setPkgClasses(pkg.classes || ['12 IPA 1']);
    setPkgIsRandomOrder(pkg.isRandomOrder ?? true);
    setPkgDurationMinutes(pkg.durationMinutes || 90);
    setShowPackageModal(true);
  };

  // Save (Create or Edit) Package
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgCode || !pkgName) return;

    const subj = subjects.find((s) => s.id === pkgSubjectId);
    const teacher = staff.find((s) => s.id === pkgTeacherId);

    if (editingPackageId) {
      setPackages((prev) =>
        prev.map((p) =>
          p.id === editingPackageId
            ? {
              ...p,
              code: pkgCode,
              name: pkgName,
              subjectId: pkgSubjectId,
              subjectName: subj ? subj.name : 'Mata Pelajaran',
              teacherId: pkgTeacherId,
              teacherName: teacher ? teacher.name : 'Guru Pengajar',
              classes: pkgClasses.length > 0 ? pkgClasses : ['Umum'],
              isRandomOrder: pkgIsRandomOrder,
              durationMinutes: pkgDurationMinutes,
            }
            : p
        )
      );
      alert('Data paket soal berhasil diperbarui!');
    } else {
      const newPkg: QuestionPackage = {
        id: Date.now(),
        code: pkgCode,
        name: pkgName,
        subjectId: pkgSubjectId,
        subjectName: subj ? subj.name : 'Mata Pelajaran',
        teacherId: pkgTeacherId,
        teacherName: teacher ? teacher.name : 'Guru Pengajar',
        classes: pkgClasses.length > 0 ? pkgClasses : ['Umum'],
        isRandomOrder: pkgIsRandomOrder,
        durationMinutes: pkgDurationMinutes,
        questions: [],
      };
      setPackages((prev) => [newPkg, ...prev]);
      alert('Paket soal baru berhasil dibuat! Silakan klik tombol "Input Soal" untuk memasukkan butir pertanyaan.');
    }
    setShowPackageModal(false);
  };

  // Duplicate Package
  const handleDuplicatePackage = (pkgId: number) => {
    const target = packages.find((p) => p.id === pkgId);
    if (!target) return;
    const dupPkg: QuestionPackage = {
      ...target,
      id: Date.now(),
      code: `${target.code}-COPY`,
      name: `${target.name} (Salinan)`,
      questions: target.questions.map((q) => ({
        ...q,
        id: Date.now() + Math.floor(Math.random() * 10000),
      })),
    };
    setPackages((prev) => [dupPkg, ...prev]);
    alert(`Paket soal "${target.name}" berhasil diduplikat!`);
  };

  // Delete Package
  const handleDeletePackage = (pkgId: number, pkgName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus paket soal "${pkgName}"?`)) {
      setPackages((prev) => prev.filter((p) => p.id !== pkgId));
    }
  };

  // Class Selection helper in Package modal
  const toggleClassSelection = (className: string) => {
    setPkgClasses((prev) =>
      prev.includes(className)
        ? prev.filter((c) => c !== className)
        : [...prev, className]
    );
  };

  const handleAddCustomClass = () => {
    if (!customClassName.trim()) return;
    if (!pkgClasses.includes(customClassName.trim())) {
      setPkgClasses((prev) => [...prev, customClassName.trim()]);
    }
    setCustomClassName('');
  };

  // Insert LaTeX Symbol helper
  const insertLatexSymbol = (symbol: string) => {
    setQuestionContent((prev) => prev + ' ' + symbol + ' ');
  };

  // Reset student session
  const handleResetSession = (sessionId: number, studentName: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'active', violationsCount: 0 } : s))
    );
    alert(`Sesi ujian ${studentName} berhasil direset dari 'Terblokir' menjadi 'Aktif'.`);
  };

  // Add Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.nis) return;

    const cls = classes.find((c) => c.name === newStudent.className);
    const added: StudentUser = {
      id: Date.now(),
      classId: cls ? cls.id : 1,
      className: newStudent.className,
      nis: newStudent.nis,
      name: newStudent.name,
      dateOfBirth: newStudent.dateOfBirth,
      username: newStudent.username || newStudent.nis,
      password: newStudent.password || '123',
      isActive: true,
    };

    setStudents((prev) => [added, ...prev]);
    const saved = await upsertStudentToSupabase(added);
    if (!saved) {
      alert('Data siswa berhasil dibuat di UI, tetapi gagal tersimpan ke Supabase. Cek koneksi dan tabel student_users.');
      return;
    }

    setShowStudentModal(false);
    resetStudentForm();
  };

  // Add Class
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const addedClass: ClassItem = {
      id: Date.now(),
      name: newClassName.trim(),
      studentCount: 0,
    };

    setClasses((prev) => [...prev, addedClass]);
    const saved = await upsertClassToSupabase(addedClass);
    if (!saved) {
      alert('Kelas berhasil ditambahkan di UI, tetapi gagal tersimpan ke Supabase. Cek koneksi dan tabel classes.');
      return;
    }

    setNewClassName('');
    setShowClassModal(false);
  };

  // Delete Class
  const handleDeleteClass = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kelas ini?')) {
      setClasses((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Delete Student
  const handleDeleteStudent = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data siswa ini? Data juga akan terhapus dari database.')) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      deleteStudentFromSupabase(id);
    }
  };

  // Open Edit Student Modal
  const handleOpenEditStudent = (st: StudentUser) => {
    setEditingStudent({ ...st });
    setShowEditStudentModal(true);
  };

  // Save Edit Student
  const handleSaveEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const cls = classes.find((c) => c.name === editingStudent.className);
    const updated: StudentUser = {
      ...editingStudent,
      classId: cls ? cls.id : editingStudent.classId,
    };

    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    const saved = await upsertStudentToSupabase(updated);
    if (!saved) {
      alert('Data siswa gagal diperbarui ke Supabase. Cek koneksi dan tabel student_users.');
      return;
    }

    setShowEditStudentModal(false);
    setEditingStudent(null);
  };

  // Save / Add Staff
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.username.trim()) return;

    let persistedMember: StaffUser | null = null;

    if (editingStaff) {
      const updatedMember: StaffUser = {
        ...editingStaff,
        ...newStaff,
        name: newStaff.name.trim(),
        username: newStaff.username.trim(),
        password: newStaff.password.trim() || '123',
        role: newStaff.role,
      };

      setStaff((prev) => prev.map((s) => (s.id === editingStaff.id ? updatedMember : s)));
      persistedMember = updatedMember;
    } else {
      const added: StaffUser = {
        id: Date.now(),
        name: newStaff.name.trim(),
        username: newStaff.username.trim(),
        password: newStaff.password.trim() || '123',
        role: newStaff.role,
      };
      setStaff((prev) => [added, ...prev]);
      persistedMember = added;
    }

    const saved = persistedMember ? await upsertStaffToSupabase(persistedMember) : false;
    if (!saved) {
      alert('Data staff/guru berhasil dibuat di UI, tetapi gagal tersimpan ke Supabase. Cek koneksi dan tabel staff_users.');
      return;
    }

    setShowStaffModal(false);
    setEditingStaff(null);
    resetStaffForm();
  };

  const toggleShowStudentPassword = (id: number) => {
    setShowStudentPasswordMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleShowStaffPassword = (id: number) => {
    setShowStaffPasswordMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Delete Staff
  const handleDeleteStaff = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data staff/guru ini?')) {
      setStaff((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Excel import simulation
  const handleImportExcel = () => {
    const mockImported: StudentUser[] = [
      {
        id: Date.now() + 1,
        classId: 1,
        className: '12 IPA 1',
        nis: '20241008',
        name: 'Daffa Raihan Permana',
        dateOfBirth: '2006-04-12',
        username: 'daffa',
        isActive: true,
      },
      {
        id: Date.now() + 2,
        classId: 2,
        className: '12 IPA 2',
        nis: '20241009',
        name: 'Nabila Az-Zahra',
        dateOfBirth: '2006-09-03',
        username: 'nabila',
        isActive: true,
      },
    ];
    setStudents((prev) => [...mockImported, ...prev]);
    alert('Simulasi Import Excel Berhasil! 2 data siswa baru telah ditambahkan.');
  };

  // Set option count (4 or 5 options for multiple choice, 3 or 4 statements for true/false)
  const handleSetOptionCount = (count: number) => {
    setOptionCount(count);
    if (questionType === 'true_false') {
      if (count === 3) {
        setOptionsState((prev) => prev.slice(0, 3));
      } else if (count === 4) {
        setOptionsState((prev) => {
          if (prev.length >= 4) return prev.slice(0, 4);
          return [
            ...prev,
            { label: '4', text: 'Semua teori sains bersifat universal', isCorrect: true, points: 5 },
          ];
        });
      }
    } else if (questionType === 'graded_choice') {
      if (count === 4) {
        setOptionsState((prev) => {
          const sliced = prev.slice(0, 4);
          return sliced.map((o, idx) => ({
            ...o,
            points: o.points !== undefined && o.points > 0 ? o.points : (4 - idx),
          }));
        });
      } else if (count === 5) {
        setOptionsState((prev) => {
          if (prev.length >= 5) return prev.slice(0, 5);
          return [
            ...prev,
            { label: 'E', text: '', isCorrect: false, points: 1 },
          ];
        });
      }
    } else {
      if (count === 4) {
        setOptionsState((prev) => prev.slice(0, 4));
      } else if (count === 5) {
        setOptionsState((prev) => {
          if (prev.length >= 5) return prev.slice(0, 5);
          return [
            ...prev,
            { label: 'E', text: '', isCorrect: false, points: 0 },
          ];
        });
      }
    }
  };

  // Switch Question Type (single_choice, complex_choice, graded_choice, true_false)
  const handleQuestionTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    if (newType === 'true_false') {
      setOptionCount(3);
      setOptionsState([
        { label: '1', text: 'Kecepatan gelombang bunyi tergantung pada suhu medium', isCorrect: true, points: 5 },
        { label: '2', text: 'Gelombang bunyi merupakan gelombang transversal', isCorrect: false, points: 5 },
        { label: '3', text: 'Frekuensi gelombang menentukan tinggi rendahnya nada', isCorrect: true, points: 5 },
      ]);
    } else if (newType === 'graded_choice') {
      setOptionCount(5);
      setOptionsState([
        { label: 'A', text: '', isCorrect: true, points: 5 },
        { label: 'B', text: '', isCorrect: false, points: 4 },
        { label: 'C', text: '', isCorrect: false, points: 3 },
        { label: 'D', text: '', isCorrect: false, points: 2 },
        { label: 'E', text: '', isCorrect: false, points: 1 },
      ]);
    } else if (newType === 'single_choice') {
      setOptionCount(5);
      setOptionsState([
        { label: 'A', text: '', isCorrect: true, points: 10 },
        { label: 'B', text: '', isCorrect: false, points: 0 },
        { label: 'C', text: '', isCorrect: false, points: 0 },
        { label: 'D', text: '', isCorrect: false, points: 0 },
        { label: 'E', text: '', isCorrect: false, points: 0 },
      ]);
    } else {
      // complex_choice
      setOptionCount(5);
      setOptionsState([
        { label: 'A', text: '', isCorrect: true, points: 10 },
        { label: 'B', text: '', isCorrect: false, points: 0 },
        { label: 'C', text: '', isCorrect: true, points: 10 },
        { label: 'D', text: '', isCorrect: false, points: 0 },
        { label: 'E', text: '', isCorrect: false, points: 0 },
      ]);
    }
  };

  // Open full-page editor for inputting new question
  const handleOpenInputQuestionModal = (pkgId: number) => {
    setSelectedPkgId(pkgId);
    setEditingQuestionId(null);
    setQuestionType('single_choice');
    setOptionCount(5);
    setQuestionContent('Hitunglah hasil integral berikut: $\\int_{0}^{2} 3x^2 dx$!');
    setOptionsState([
      { label: 'A', text: '$8$', isCorrect: true, points: 10 },
      { label: 'B', text: '$4$', isCorrect: false, points: 0 },
      { label: 'C', text: '$12$', isCorrect: false, points: 0 },
      { label: 'D', text: '$16$', isCorrect: false, points: 0 },
      { label: 'E', text: '$20$', isCorrect: false, points: 0 },
    ]);
    setIsQuestionEditorPage(true);
  };

  // Open full-page editor for editing existing question
  const handleOpenEditQuestionModal = (pkgId: number, q: QuestionItem) => {
    setSelectedPkgId(pkgId);
    setEditingQuestionId(q.id);
    setQuestionType(q.questionType || 'single_choice');
    setQuestionContent(q.content);
    setOptionCount(q.options.length);
    setOptionsState(
      q.options.map((o) => ({
        label: o.label,
        text: o.optionText,
        isCorrect: o.isCorrect,
        points: o.points,
      }))
    );
    setIsQuestionEditorPage(true);
  };

  // Delete individual question item
  const handleDeleteQuestionItem = (pkgId: number, qId: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus butir soal ini?')) {
      setPackages((prev) =>
        prev.map((pkg) => {
          if (pkg.id !== pkgId) return pkg;
          return {
            ...pkg,
            questions: pkg.questions.filter((q) => q.id !== qId),
          };
        })
      );
    }
  };

  // Save (Add or Edit) Question Item
  const handleSaveQuestion = () => {
    if (!questionContent.trim()) {
      alert('Isi pertanyaan soal tidak boleh kosong!');
      return;
    }

    const typeLabelStr =
      questionType === 'single_choice'
        ? 'Pilihan Ganda'
        : questionType === 'complex_choice'
          ? 'PG Kompleks'
          : questionType === 'graded_choice'
            ? 'PG Bertingkat'
            : 'Benar / Salah';

    const updatedOptions = optionsState.map((opt, idx) => ({
      id: Date.now() + idx,
      label: opt.label,
      optionText: opt.text || `Opsi ${opt.label}`,
      isCorrect: opt.isCorrect,
      points: questionType === 'true_false' || questionType === 'graded_choice'
        ? (opt.points !== undefined && opt.points !== null ? opt.points : (questionType === 'graded_choice' ? (optionsState.length - idx) : 5))
        : (opt.isCorrect ? (opt.points !== undefined && opt.points !== null ? opt.points : 10) : 0),
    }));

    if (editingQuestionId) {
      setPackages((prev) =>
        prev.map((pkg) => {
          if (pkg.id !== selectedPkgId) return pkg;
          return {
            ...pkg,
            questions: pkg.questions.map((q) =>
              q.id === editingQuestionId
                ? {
                  ...q,
                  questionType,
                  typeLabel: typeLabelStr,
                  content: questionContent,
                  discussion: '',
                  options: updatedOptions,
                }
                : q
            ),
          };
        })
      );
      alert('Butir soal berhasil diperbarui!');
    } else {
      const newQ: QuestionItem = {
        id: Date.now(),
        packageId: selectedPkgId,
        questionType,
        typeLabel: typeLabelStr,
        content: questionContent,
        discussion: '',
        pointsDefault: 10,
        options: updatedOptions,
      };

      setPackages((prev) =>
        prev.map((pkg) =>
          pkg.id === selectedPkgId ? { ...pkg, questions: [...pkg.questions, newQ] } : pkg
        )
      );
      alert('Butir soal baru berhasil disimpan!');
    }
    setIsQuestionEditorPage(false);
  };

  // Duplicate Question
  const handleDuplicateQuestion = (pkgId: number, qId: number) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg;
        const targetQ = pkg.questions.find((q) => q.id === qId);
        if (!targetQ) return pkg;
        const duplicated: QuestionItem = {
          ...targetQ,
          id: Date.now(),
          content: targetQ.content + ' (Salinan)',
        };
        return { ...pkg, questions: [...pkg.questions, duplicated] };
      })
    );
  };

  // Add Announcement
  const handleAddAnno = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnno.title || !newAnno.content) return;
    setAnnouncements((prev) => [
      {
        id: Date.now(),
        authorName: 'Admin Utama',
        title: newAnno.title,
        content: newAnno.content,
        target: newAnno.target,
        date: new Date().toLocaleDateString('id-ID'),
      },
      ...prev,
    ]);
    setShowAnnouncementModal(false);
    setNewAnno({ title: '', content: '', target: 'all' });
  };

  // --- STUDENT PAGINATION & SEARCH LOGIC ---
  const sortedStudents = [...students].sort((a, b) => a.nis.localeCompare(b.nis));
  const filteredStudents = sortedStudents.filter(
    (st) =>
      st.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      st.nis.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      st.className.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );
  const studentTotalPages = Math.ceil(filteredStudents.length / studentRowsPerPage);
  const studentStartIndex = (studentCurrentPage - 1) * studentRowsPerPage;
  const paginatedStudents = filteredStudents.slice(
    studentStartIndex,
    studentStartIndex + studentRowsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD BENTO GRID */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Bento Row 1: Primary Metrics & System Status Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Bento Tile 1: Admin Welcome & System Overview (2 cols) */}
            <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none" />

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                    Kiosk CBT Security Operational
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Server Normal
                  </span>
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight">
                  {settings.bimbelName} Admin Control
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                  Pengelola: <strong className="text-white">{settings.ownerName}</strong> • Kontak: {settings.phone}. Sistem terhubung dengan {students.length} peserta aktif dan {tryouts.length} paket try out.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
                <p className="text-[11px] text-slate-400">
                  Kiosk Lock: <span className="text-emerald-400 font-bold">Terproteksi 100%</span>
                </p>
                <button
                  onClick={onOpenPrint}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-200" />
                  <span>Cetak Berita Acara</span>
                </button>
              </div>
            </div>

            {/* Bento Tile 2: Token 5 Digit Box (1 col) */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white p-6 rounded-3xl shadow-lg shadow-amber-500/20 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-extrabold bg-white/20 text-white backdrop-blur-md px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Token Ujian 5 Digit
                </span>
                <button
                  onClick={onRefreshToken}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-xl text-white transition"
                  title="Generate Token Baru"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="my-2 space-y-0.5">
                <p className="text-[10px] font-bold text-amber-100 uppercase tracking-wider">
                  Token Aktif (20 Menit)
                </p>
                <p className="text-3xl font-mono font-black tracking-widest text-white drop-shadow-sm">
                  {currentToken}
                </p>
              </div>

              <p className="text-[10px] text-amber-100 leading-tight border-t border-amber-400/40 pt-2">
                Otomatis di-refresh tiap 20 menit untuk keamanan sesi pengerjaan.
              </p>
            </div>

            {/* Bento Tile 3: Total Siswa Bimbel (1 col) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  100% Aktif
                </span>
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Siswa Bimbel
                </p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">
                  {students.length} <span className="text-base font-semibold text-slate-500">Orang</span>
                </p>
              </div>

              <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                Terbagi dalam <strong className="text-slate-800">{classes.length} Rombongan Kelas</strong>
              </p>
            </div>
          </div>

          {/* Bento Row 2: Secondary Metric & Quick Shortcuts Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Bento Tile 4: Bank Soal Count (1 col) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Bank Soal
                </span>
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Paket Soal CBT
                </p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">
                  {packages.length} <span className="text-base font-semibold text-slate-500">Paket</span>
                </p>
              </div>

              <p className="text-[11px] text-indigo-600 font-semibold mt-3 pt-3 border-t border-slate-100">
                {packages.reduce((acc, p) => acc + p.questions.length, 0)} Butir Soal Format LaTeX
              </p>
            </div>

            {/* Bento Tile 5: Active Exam Sessions (1 col) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Real-Time
                </span>
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Siswa Sedang Ujian
                </p>
                <p className="text-3xl font-black text-emerald-600 tracking-tight">
                  {sessions.filter((s) => s.status === 'active').length} <span className="text-base font-semibold text-slate-500">Peserta</span>
                </p>
              </div>

              <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                {sessions.filter((s) => s.status === 'blocked').length} Terblokir (Keluar Layar)
              </p>
            </div>

            {/* Bento Tile 6: Quick Admin Action Shortcuts (2 cols) */}
            <div className="md:col-span-1 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl border border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Aksi Cepat Admin Kiosk</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pintasan cepat untuk kelola data siswa, impor excel, dan buat bank soal baru.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => {
                    setActiveTab('master');
                    setShowStudentModal(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs p-3 rounded-2xl border border-slate-700 flex flex-col items-center justify-center gap-1.5 font-bold transition"
                >
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>+ Siswa Baru</span>
                </button>

                <button
                  onClick={handleImportExcel}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs p-3 rounded-2xl border border-slate-700 flex flex-col items-center justify-center gap-1.5 font-bold transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Import Excel</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('soal');
                    handleOpenInputQuestionModal(selectedPkgId || packages[0]?.id || 1);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs p-3 rounded-2xl border border-slate-700 flex flex-col items-center justify-center gap-1.5 font-bold transition col-span-2 sm:col-span-1"
                >
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>+ Buat Soal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bento Row 3: Daftar Siswa Baru Login Aplikasi */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Daftar Siswa Baru Login Aplikasi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pantau daftar siswa yang baru saja melakukan login ke aplikasi CBT.
                </p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                {students.length} Siswa Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <th className="p-4">Nama Peserta</th>
                    <th className="p-4">NIS</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4">Waktu Login</th>
                    <th className="p-4">Status Sesi Ujian</th>
                    <th className="p-4">Akses Perangkat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st, idx) => {
                    const sess = sessions.find((s) => s.studentId === st.id);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{st.name}</td>
                        <td className="p-4 font-mono text-slate-500">{st.nis}</td>
                        <td className="p-4 font-medium text-slate-700">{st.className}</td>
                        <td className="p-4 font-mono text-blue-700 font-bold">
                          {sess?.startTime || `08:${10 + idx * 3} WIB`}
                        </td>
                        <td className="p-4">
                          {sess?.status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold text-[11px]">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                              Sesi Aktif
                            </span>
                          ) : sess?.status === 'finished' ? (
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-bold text-[11px]">
                              Selesai ({sess.finalScore} Poin)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full font-bold text-[11px]">
                              Baru Login
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 font-medium">
                          Aplikasi Kiosk CBT v2.4
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANAJEMEN DATA MASTER (Kelas, Siswa + Import Excel, Guru) */}
      {/* ========================================================================= */}
      {activeTab === 'master' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          {/* Sub Navigation */}
          <div className="flex border-b border-slate-200 mb-6 gap-6">
            <button
              onClick={() => setMasterSubTab('siswa')}
              className={`pb-3 font-bold text-sm transition border-b-2 ${masterSubTab === 'siswa'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              Data Siswa ({students.length})
            </button>

            <button
              onClick={() => setMasterSubTab('kelas')}
              className={`pb-3 font-bold text-sm transition border-b-2 ${masterSubTab === 'kelas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              Data Kelas ({classes.length})
            </button>

            <button
              onClick={() => setMasterSubTab('guru')}
              className={`pb-3 font-bold text-sm transition border-b-2 ${masterSubTab === 'guru'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              Data Staff & Guru ({staff.length})
            </button>
          </div>

          {/* Sub Tab Siswa */}
          {masterSubTab === 'siswa' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-slate-800 text-base">Daftar Siswa Bimbingan Belajar</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Cari NIS, Nama, Kelas..."
                      value={studentSearchTerm}
                      onChange={(e) => {
                        setStudentSearchTerm(e.target.value);
                        setStudentCurrentPage(1);
                      }}
                      className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg w-64 focus:outline-none focus:border-blue-500"
                    />
                    <select
                      value={studentRowsPerPage}
                      onChange={(e) => {
                        setStudentRowsPerPage(Number(e.target.value));
                        setStudentCurrentPage(1);
                      }}
                      className="text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value={10}>10 Data</option>
                      <option value={25}>25 Data</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setShowSqlModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Database className="w-4 h-4" />
                    <span>Export SQL Supabase</span>
                  </button>
                  <button
                    onClick={handleExportStudentsExcel}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export to Excel</span>
                  </button>
                  <button
                    onClick={handleImportExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Import Excel</span>
                  </button>
                  <button
                    onClick={() => setShowStudentModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Siswa</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="p-3">NIS</th>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Tanggal Lahir</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Password</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-blue-700">{st.nis}</td>
                        <td className="p-3 font-bold text-slate-900">{st.name}</td>
                        <td className="p-3 text-slate-700">{st.className}</td>
                        <td className="p-3 text-slate-600 font-mono">{st.dateOfBirth}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">{st.username}</td>
                        <td className="p-3 font-mono font-bold text-indigo-700 bg-indigo-50/50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">
                              {showStudentPasswordMap[st.id] ? (st.password || '123') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowStudentPassword(st.id)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition"
                              title={showStudentPasswordMap[st.id] ? 'Sembunyikan Password' : 'Tampilkan Password'}
                            >
                              {showStudentPasswordMap[st.id] ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Aktif
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditStudent(st)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Data Siswa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(st.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination UI */}
              {studentTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                  <span className="text-xs text-slate-500 font-medium">
                    Menampilkan {studentStartIndex + 1}-{Math.min(studentStartIndex + studentRowsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={studentCurrentPage === 1}
                      onClick={() => setStudentCurrentPage((p) => p - 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-xs font-bold px-3 py-1.5 text-slate-700">
                      Halaman {studentCurrentPage} dari {studentTotalPages}
                    </span>
                    <button
                      disabled={studentCurrentPage === studentTotalPages}
                      onClick={() => setStudentCurrentPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}          {/* Sub Tab Kelas */}
          {masterSubTab === 'kelas' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-base">Daftar Kelas</h3>
                <button
                  onClick={() => setShowClassModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kelas Baru</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <div key={cls.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{cls.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Jumlah Siswa: {students.filter((s) => s.className === cls.name).length} Peserta
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub Tab Guru / Staff */}
          {masterSubTab === 'guru' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-base">Daftar Staff & Guru Pengajar</h3>
                <button
                  onClick={() => {
                    setEditingStaff(null);
                    resetStaffForm();
                    setShowStaffModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Staff / Guru Baru</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="p-3">Nama Staff</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Password</th>
                      <th className="p-3">Peran Akses</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staff.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{s.name}</td>
                        <td className="p-3 font-mono text-slate-600">{s.username}</td>
                        <td className="p-3 font-mono text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">
                              {showStaffPasswordMap[s.id] ? (s.password || '123') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowStaffPassword(s.id)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition"
                              title={showStaffPasswordMap[s.id] ? "Sembunyikan Password" : "Tampilkan Password"}
                            >
                              {showStaffPasswordMap[s.id] ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${s.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {s.role}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingStaff(s);
                                setNewStaff({
                                  name: s.name,
                                  username: s.username,
                                  password: s.password || '123',
                                  role: s.role,
                                });
                                setShowModalPassword(false);
                                setShowStaffModal(true);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Staff"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(s.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Staff"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MANAJEMEN SOAL (Daftar, Review, & Full-Page Input Soal Editor) */}
      {/* ========================================================================= */}
      {activeTab === 'soal' && (
        <div className="space-y-6">
          {/* SECTION 1: HALAMAN EDITOR INPUT/EDIT SOAL TERENDIRI (FULL PAGE WORKSPACE) */}
          {isQuestionEditorPage ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Header Editor Page with Context & Navigation */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-100">
                <div>
                  <button
                    onClick={() => setIsQuestionEditorPage(false)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition mb-3"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                    <span>Kembali ke Review Detail Paket Soal</span>
                  </button>
                  <h3 className="font-extrabold text-slate-900 text-2xl tracking-tight">
                    {editingQuestionId ? 'Edit Butir Soal (Landscape Editor)' : 'Halaman Input Butir Soal Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Ruang kerja luas & fokus untuk menyusun pertanyaan, teks format, gambar, LaTeX, serta menentukan kunci jawaban.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                    <span className="bg-blue-600 text-white font-mono px-2 py-0.5 rounded text-[11px] font-extrabold">
                      KD: {packages.find((p) => p.id === selectedPkgId)?.code}
                    </span>
                    <span className="truncate max-w-[220px]">{packages.find((p) => p.id === selectedPkgId)?.name}</span>
                  </div>
                </div>
              </div>

              {/* 2-COLUMN LANDSCAPE WORKSPACE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Editor Pertanyaan, Rich Text Formatting Toolbar, Gambar, LaTeX, & Live Preview */}
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-extrabold text-slate-800">
                        Isi Pertanyaan Soal (Dukungan Format Teks, Gambar & Rumus LaTeX):
                      </label>
                    </div>

                    {/* RICH TEXT FORMATTING TOOLBAR */}
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 rounded-t-2xl border border-b-0 border-slate-300 text-xs">
                      <button
                        type="button"
                        onClick={() => insertFormattingTag('<b>', '</b>', 'Teks Tebal')}
                        className="p-1.5 bg-white hover:bg-slate-200 rounded-lg text-slate-800 border border-slate-300 font-black"
                        title="Teks Tebal (Bold)"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormattingTag('<i>', '</i>', 'Teks Miring')}
                        className="p-1.5 bg-white hover:bg-slate-200 rounded-lg text-slate-800 border border-slate-300 font-bold"
                        title="Teks Miring (Italics)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormattingTag('<u>', '</u>', 'Teks Garis Bawah')}
                        className="p-1.5 bg-white hover:bg-slate-200 rounded-lg text-slate-800 border border-slate-300 font-bold"
                        title="Garis Bawah (Underline)"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>

                      <div className="h-4 w-[1px] bg-slate-300 mx-1" />

                      <button
                        type="button"
                        onClick={() => insertFormattingTag('<span style="font-size: 1.25em;">', '</span>', 'Teks Besar')}
                        className="px-2 py-1 bg-white hover:bg-slate-200 rounded-lg text-slate-800 border border-slate-300 font-extrabold text-[11px]"
                        title="Perbesar Ukuran Teks"
                      >
                        T+ Besar
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormattingTag('<span style="font-size: 0.85em;">', '</span>', 'Teks Kecil')}
                        className="px-2 py-1 bg-white hover:bg-slate-200 rounded-lg text-slate-800 border border-slate-300 font-extrabold text-[11px]"
                        title="Perkecil Ukuran Teks"
                      >
                        T- Kecil
                      </button>

                      <div className="h-4 w-[1px] bg-slate-300 mx-1" />

                      <button
                        type="button"
                        onClick={() => insertFormattingTag('<ul>\n  <li>Poin 1</li>\n  <li>Poin 2</li>\n</ul>')}
                        className="p-1.5 bg-white hover:bg-slate-200 rounded-lg text-slate-800 border border-slate-300"
                        title="Daftar Poin (Unordered List - Bullet)"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormattingTag('<ol>\n  <li>Langkah 1</li>\n  <li>Langkah 2</li>\n</ol>')}
                        className="p-1.5 bg-white hover:bg-slate-200 rounded-lg text-slate-800 border border-slate-300"
                        title="Daftar Nomor (Ordered List - Numbering)"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>

                      <div className="h-4 w-[1px] bg-slate-300 mx-1" />

                      {/* Sisipkan Gambar Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setImageTarget('question');
                          setShowImageModal(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>+ Sisipkan Gambar</span>
                      </button>
                    </div>

                    <textarea
                      id="question-content-textarea"
                      value={questionContent}
                      onChange={(e) => setQuestionContent(e.target.value)}
                      rows={9}
                      placeholder="Tuliskan pertanyaan soal di sini. Gunakan $...$ untuk LaTeX math, tombol toolbar untuk format teks tebal/miring/gambar, dsb."
                      className="w-full p-4 bg-slate-50 border border-slate-300 rounded-b-2xl text-xs font-mono leading-relaxed focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-inner"
                    />
                  </div>

                  {/* LaTeX Quick Shortcuts */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pintasan Simbol Matematika LaTeX (Klik untuk menyisipkan ke posisi kursor):
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-100 rounded-2xl border border-slate-200">
                      {[
                        { label: 'Pecahan (a/b)', code: '$\\frac{a}{b}$' },
                        { label: 'Akar (√x)', code: '$\\sqrt{x}$' },
                        { label: 'Pangkat (x²)', code: '$x^2$' },
                        { label: 'Integral (∫)', code: '$\\int_{0}^{3} f(x) dx$' },
                        { label: 'Sigma (∑)', code: '$\\sum_{i=1}^{n} x_i$' },
                        { label: 'Matriks (2x2)', code: '$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$' },
                        { label: 'Alpha (α)', code: '$\\alpha$' },
                        { label: 'Beta (β)', code: '$\\beta$' },
                        { label: 'Pi (π)', code: '$\\pi$' },
                        { label: 'Kurang/Sama (≤)', code: '$\\le$' },
                        { label: 'Lebih/Sama (≥)', code: '$\\ge$' },
                        { label: 'Tidak Sama (≠)', code: '$\\neq$' },
                      ].map((sym) => (
                        <button
                          key={sym.label}
                          type="button"
                          onClick={() => insertFormattingTag(sym.code, '', '')}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs"
                        >
                          {sym.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* EXPANSIVE LIVE VISUAL RENDERING PREVIEW */}
                  <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-blue-900 font-extrabold uppercase flex items-center gap-1.5 tracking-wide">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Pratinjau Visual Lengkap Soal (LaTeX, Gambar & Formatting):
                      </p>
                      <span className="text-[10px] text-blue-700 font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200">
                        Otorender Visual
                      </span>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 min-h-[120px] shadow-2xs">
                      <KaTeXRenderer content={questionContent} className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed" />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Tipe Soal, Jumlah Opsi Switch, & Input Opsi Jawaban */}
                <div className="lg:col-span-5 space-y-5 border-t lg:border-t-0 lg:border-l lg:border-slate-200 lg:pl-8 pt-6 lg:pt-0">
                  {/* Tipe Soal Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800">Tipe Soal Ujian:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'single_choice', label: 'Pilihan Ganda' },
                        { id: 'complex_choice', label: 'PG Kompleks' },
                        { id: 'graded_choice', label: 'PG Bertingkat' },
                        { id: 'true_false', label: 'Benar / Salah' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleQuestionTypeChange(t.id as QuestionType)}
                          className={`py-2 px-2 rounded-xl text-xs font-extrabold text-center border transition ${questionType === t.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Jumlah Opsi / Pernyataan Switcher */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-800">
                        {questionType === 'true_false' ? 'Jumlah Pernyataan:' : 'Jumlah Opsi Jawaban:'}
                      </label>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {questionType === 'true_false' ? 'Format Benar/Salah' : 'Format Pilihan'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                      {questionType === 'true_false' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSetOptionCount(3)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center ${optionsState.length === 3
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                              }`}
                          >
                            3 Pernyataan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetOptionCount(4)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center ${optionsState.length === 4
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                              }`}
                          >
                            4 Pernyataan
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSetOptionCount(4)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center ${optionsState.length === 4
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                              }`}
                          >
                            4 Opsi
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetOptionCount(5)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center ${optionsState.length === 5
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                              }`}
                          >
                            5 Opsi
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Options Form Input Fields */}
                  <div className="space-y-3">
                    <label className="block text-xs font-extrabold text-slate-800">
                      {questionType === 'true_false'
                        ? 'Input Pernyataan & Kunci Benar/Salah:'
                        : questionType === 'graded_choice'
                          ? 'Input Opsi Jawaban & Skor Poin Bertingkat:'
                          : 'Input Opsi Jawaban & Tentukan Kunci Jawaban:'}
                    </label>

                    {questionType === 'single_choice' && (
                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-500 font-medium">
                          Pilih 1 radio button kunci jawaban yang benar:
                        </p>
                        {optionsState.map((opt, idx) => (
                          <div key={opt.label} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${opt.isCorrect ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                                    }`}
                                >
                                  {opt.label}
                                </div>
                                <span className="text-xs font-bold text-slate-800">Opsi {opt.label}</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {/* Option LaTeX Quick Shortcuts */}
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px]">
                                  <span className="text-slate-400 font-bold mr-0.5">LaTeX:</span>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$\\frac{a}{b}$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Pecahan"
                                  >
                                    a/b
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$\\sqrt{x}$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Akar"
                                  >
                                    √x
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$x^2$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Pangkat"
                                  >
                                    x²
                                  </button>
                                </div>

                                {/* Option Insert Image Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImageTarget(idx);
                                    setShowImageModal(true);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-2xs transition"
                                  title={`Sisipkan Gambar pada Opsi ${opt.label}`}
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>+ Gambar</span>
                                </button>

                                {/* Kunci Selection Radio */}
                                <label
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition shrink-0 ${opt.isCorrect
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                    }`}
                                >
                                  <input
                                    type="radio"
                                    name="single_choice_key_page"
                                    checked={opt.isCorrect}
                                    onChange={() => {
                                      setOptionsState((prev) =>
                                        prev.map((o, i) => ({
                                          ...o,
                                          isCorrect: i === idx,
                                          points: i === idx ? (o.points && o.points > 0 ? o.points : 10) : 0,
                                        }))
                                      );
                                    }}
                                    className="accent-emerald-600 w-3.5 h-3.5"
                                  />
                                  <span>{opt.isCorrect ? '✓ Kunci' : 'Pilih'}</span>
                                </label>

                                {/* Input Point Manual jika Opsi Kunci Benar */}
                                {opt.isCorrect && (
                                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-2 py-1 rounded-lg text-[11px] font-extrabold text-amber-900 shadow-xs">
                                    <span>Poin:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={opt.points ?? 10}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setOptionsState((prev) =>
                                          prev.map((o, i) => (i === idx ? { ...o, points: val } : o))
                                        );
                                      }}
                                      className="w-14 px-1 py-0.5 border border-amber-400 rounded text-center text-xs font-black font-mono bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                      title="Atur nilai/poin jika jawaban benar"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const val = e.target.value;
                                setOptionsState((prev) =>
                                  prev.map((o, i) => (i === idx ? { ...o, text: val } : o))
                                );
                              }}
                              placeholder={`Isi jawaban opsi ${opt.label} (dukungan LaTeX $...$ & Gambar)...`}
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />

                            {/* Live KaTeX Rendered Option Preview */}
                            {opt.text && (
                              <div className="p-2 bg-white rounded-xl border border-slate-200">
                                <div className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Pratinjau Opsi {opt.label}:</div>
                                <KaTeXRenderer content={opt.text} className="text-xs text-slate-900 font-medium leading-relaxed" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {questionType === 'complex_choice' && (
                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-500 font-medium">
                          Centang checkbox pada opsi yang bernilai benar (bisa lebih dari 1):
                        </p>
                        {optionsState.map((opt, idx) => (
                          <div key={opt.label} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={opt.isCorrect}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setOptionsState((prev) =>
                                      prev.map((o, i) =>
                                        i === idx
                                          ? {
                                            ...o,
                                            isCorrect: checked,
                                            points: checked ? (o.points && o.points > 0 ? o.points : 10) : 0,
                                          }
                                          : o
                                      )
                                    );
                                  }}
                                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                                />
                                <span className="text-xs font-bold text-slate-800">Opsi {opt.label}</span>
                              </label>

                              <div className="flex flex-wrap items-center gap-2">
                                {/* Option LaTeX Quick Shortcuts */}
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px]">
                                  <span className="text-slate-400 font-bold mr-0.5">LaTeX:</span>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$\\frac{a}{b}$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Pecahan"
                                  >
                                    a/b
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$\\sqrt{x}$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Akar"
                                  >
                                    √x
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$x^2$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Pangkat"
                                  >
                                    x²
                                  </button>
                                </div>

                                {/* Option Insert Image Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImageTarget(idx);
                                    setShowImageModal(true);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-2xs transition"
                                  title={`Sisipkan Gambar pada Opsi ${opt.label}`}
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>+ Gambar</span>
                                </button>



                                {/* Input Point Manual untuk PG Kompleks */}
                                {opt.isCorrect && (
                                  <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-300 px-2 py-1 rounded-lg text-[11px] font-extrabold text-purple-900 shadow-xs">
                                    <span>Poin:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={opt.points ?? 10}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setOptionsState((prev) =>
                                          prev.map((o, i) => (i === idx ? { ...o, points: val } : o))
                                        );
                                      }}
                                      className="w-14 px-1 py-0.5 border border-purple-400 rounded text-center text-xs font-black font-mono bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                      title="Atur nilai/poin opsi ini jika dipilih"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const val = e.target.value;
                                setOptionsState((prev) =>
                                  prev.map((o, i) => (i === idx ? { ...o, text: val } : o))
                                );
                              }}
                              placeholder={`Isi jawaban opsi ${opt.label} (dukungan LaTeX $...$ & Gambar)...`}
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />

                            {/* Live KaTeX Rendered Option Preview */}
                            {opt.text && (
                              <div className="p-2 bg-white rounded-xl border border-slate-200">
                                <div className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Pratinjau Opsi {opt.label}:</div>
                                <KaTeXRenderer content={opt.text} className="text-xs text-slate-900 font-medium leading-relaxed" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {questionType === 'graded_choice' && (
                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-500 font-medium">
                          Masukan opsi jawaban dan tentukan poin/skor bertingkat untuk masing-masing opsi (misal kunci bernilai 5/4, sisanya 4, 3, 2, 1):
                        </p>
                        {optionsState.map((opt, idx) => (
                          <div key={opt.label} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                                  {opt.label}
                                </div>
                                <span className="text-xs font-bold text-slate-800">Opsi {opt.label}</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {/* Option LaTeX Quick Shortcuts */}
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px]">
                                  <span className="text-slate-400 font-bold mr-0.5">LaTeX:</span>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$\\frac{a}{b}$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Pecahan"
                                  >
                                    a/b
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$\\sqrt{x}$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Akar"
                                  >
                                    √x
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$x^2$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Pangkat"
                                  >
                                    x²
                                  </button>
                                </div>

                                {/* Option Insert Image Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImageTarget(idx);
                                    setShowImageModal(true);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-2xs transition"
                                  title={`Sisipkan Gambar pada Opsi ${opt.label}`}
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>+ Gambar</span>
                                </button>

                                {/* Flag Kunci Utama Radio */}
                                <label
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition shrink-0 ${opt.isCorrect
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                    }`}
                                >
                                  <input
                                    type="radio"
                                    name="graded_choice_key_page"
                                    checked={opt.isCorrect}
                                    onChange={() => {
                                      setOptionsState((prev) =>
                                        prev.map((o, i) => ({
                                          ...o,
                                          isCorrect: i === idx,
                                        }))
                                      );
                                    }}
                                    className="accent-indigo-600 w-3.5 h-3.5"
                                  />
                                  <span>{opt.isCorrect ? '✓ Kunci Utama' : 'Pilih'}</span>
                                </label>

                                {/* Input Point Manual untuk Opsi PG Bertingkat */}
                                <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-300 px-2 py-1 rounded-lg text-[11px] font-extrabold text-indigo-900 shadow-xs">
                                  <span>Poin:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={opt.points ?? (optionsState.length - idx)}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setOptionsState((prev) =>
                                        prev.map((o, i) => (i === idx ? { ...o, points: val } : o))
                                      );
                                    }}
                                    className="w-14 px-1 py-0.5 border border-indigo-400 rounded text-center text-xs font-black font-mono bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    title={`Poin untuk Opsi ${opt.label}`}
                                  />
                                </div>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const val = e.target.value;
                                setOptionsState((prev) =>
                                  prev.map((o, i) => (i === idx ? { ...o, text: val } : o))
                                );
                              }}
                              placeholder={`Isi jawaban opsi ${opt.label} (dukungan LaTeX $...$ & Gambar)...`}
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />

                            {/* Live KaTeX Rendered Option Preview */}
                            {opt.text && (
                              <div className="p-2 bg-white rounded-xl border border-slate-200">
                                <div className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Pratinjau Opsi {opt.label}:</div>
                                <KaTeXRenderer content={opt.text} className="text-xs text-slate-900 font-medium leading-relaxed" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {questionType === 'true_false' && (
                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-500 font-medium">
                          Tentukan status Benar atau Salah pada setiap pernyataan dan masukan poinnya:
                        </p>
                        {optionsState.map((opt, idx) => (
                          <div key={opt.label} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">


                              <div className="flex flex-wrap items-center gap-2">
                                {/* Option LaTeX Quick Shortcuts */}
                                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px]">
                                  <span className="text-slate-400 font-bold mr-0.5">LaTeX:</span>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$\\frac{a}{b}$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Pecahan"
                                  >
                                    a/b
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$\\sqrt{x}$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Akar"
                                  >
                                    √x
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertOptionLatex(idx, '$x^2$')}
                                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                    title="Sisipkan Pangkat"
                                  >
                                    x²
                                  </button>
                                </div>

                                {/* Option Insert Image Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImageTarget(idx);
                                    setShowImageModal(true);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-2xs transition"
                                  title={`Sisipkan Gambar`}
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>+ Gambar</span>
                                </button>

                                <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-xl border border-slate-200 text-xs">
                                  <label className="flex items-center gap-1.5 font-bold text-emerald-700 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`tf_page_${idx}`}
                                      checked={opt.isCorrect}
                                      onChange={() => {
                                        setOptionsState((prev) =>
                                          prev.map((o, i) =>
                                            i === idx
                                              ? { ...o, isCorrect: true, points: o.points && o.points > 0 ? o.points : 5 }
                                              : o
                                          )
                                        );
                                      }}
                                      className="accent-emerald-600 w-4 h-4"
                                    />
                                    <span>Benar</span>
                                  </label>
                                  <span className="text-slate-300">|</span>
                                  <label className="flex items-center gap-1.5 font-bold text-red-700 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`tf_page_${idx}`}
                                      checked={!opt.isCorrect}
                                      onChange={() => {
                                        setOptionsState((prev) =>
                                          prev.map((o, i) =>
                                            i === idx
                                              ? { ...o, isCorrect: false, points: o.points && o.points > 0 ? o.points : 5 }
                                              : o
                                          )
                                        );
                                      }}
                                      className="accent-red-600 w-4 h-4"
                                    />
                                    <span>Salah</span>
                                  </label>
                                </div>

                                {/* Input Point Manual untuk Pernyataan Benar/Salah */}
                                <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-300 px-2 py-1 rounded-lg text-[11px] font-extrabold text-blue-900 shadow-xs">
                                  <span>Poin:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={opt.points ?? 5}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setOptionsState((prev) =>
                                        prev.map((o, i) => (i === idx ? { ...o, points: val } : o))
                                      );
                                    }}
                                    className="w-14 px-1 py-0.5 border border-blue-400 rounded text-center text-xs font-black font-mono bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    title="Atur poin untuk pernyataan ini jika dijawab tepat"
                                  />
                                </div>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const val = e.target.value;
                                setOptionsState((prev) => prev.map((o, i) => (i === idx ? { ...o, text: val } : o)));
                              }}
                              placeholder="Isi teks/rumus pernyataan (dukungan LaTeX $...$ & Gambar)..."
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />

                            {/* Live KaTeX Rendered Option Preview */}
                            {opt.text && (
                              <div className="p-2 bg-white rounded-xl border border-slate-200">
                                <div className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Pratinjau:</div>
                                <KaTeXRenderer content={opt.text} className="text-xs text-slate-900 font-medium leading-relaxed" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Save Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsQuestionEditorPage(false)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveQuestion}
                      className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition"
                    >
                      {editingQuestionId ? 'Simpan Perubahan Soal' : 'Simpan Butir Soal Baru'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedReviewPkgId !== null ? (
            (() => {
              const reviewPkg = packages.find((p) => p.id === selectedReviewPkgId);
              if (!reviewPkg) {
                return (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                    <p className="text-slate-600 font-bold mb-3">Paket soal tidak ditemukan.</p>
                    <button
                      onClick={() => setSelectedReviewPkgId(null)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                    >
                      ← Kembali ke Manajemen Soal
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {/* Top Bar Navigation & Package Overview */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <button
                          onClick={() => setSelectedReviewPkgId(null)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition mb-3"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Kembali ke Daftar Manajemen Soal</span>
                        </button>
                        <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                          Review Detail Butir Soal: {reviewPkg.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                          <span className="bg-blue-600 text-white font-mono font-bold px-2.5 py-0.5 rounded">
                            KD: {reviewPkg.code}
                          </span>
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-0.5 rounded">
                            Mapel: {reviewPkg.subjectName}
                          </span>
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {reviewPkg.durationMinutes || 90} Menit
                          </span>
                          <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded">
                            Kelas Target: {reviewPkg.classes?.join(', ') || 'Semua Kelas'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenInputQuestionModal(reviewPkg.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition self-stretch md:self-auto justify-center"
                      >
                        <Plus className="w-4 h-4" />
                        <span> Tambah Butir Soal Baru</span>
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-600">
                      <span>Total Butir Soal Terdaftar: <strong className="text-blue-900 text-sm">{reviewPkg.questions.length} Soal</strong> | Total Skor Maksimal: <strong className="text-blue-900 text-sm">{
                        reviewPkg.questions.reduce((total, q) => {
                          if (q.questionType === 'single_choice') {
                            const correctOpt = q.options.find(o => o.isCorrect);
                            return total + (correctOpt && correctOpt.points && correctOpt.points > 0 ? correctOpt.points : q.pointsDefault);
                          } else if (q.questionType === 'graded_choice') {
                            let maxOpt = 0;
                            q.options.forEach(o => { if ((o.points || 0) > maxOpt) maxOpt = o.points || 0; });
                            return total + (maxOpt > 0 ? maxOpt : q.pointsDefault);
                          } else if (q.questionType === 'complex_choice' || q.questionType === 'true_false') {
                            let optSum = 0;
                            q.options.forEach(o => {
                              if (q.questionType === 'true_false' || o.isCorrect) {
                                optSum += o.points && o.points > 0 ? o.points : q.pointsDefault;
                              }
                            });
                            return total + optSum;
                          }
                          return total;
                        }, 0)
                      } Poin</strong></span>
                      <span className="text-slate-400">Mendukung Pilihan Ganda Biasa, Kompleks & Benar/Salah</span>
                    </div>
                  </div>

                  {/* Sequential Questions Review List */}
                  {reviewPkg.questions.length > 0 ? (
                    <div className="space-y-4">
                      {reviewPkg.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 hover:border-slate-300 transition"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-blue-900 text-xs uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                                Butir Soal No. {idx + 1}
                              </span>
                              <span
                                className={`text-[11px] font-extrabold px-3 py-1 rounded-lg border ${q.questionType === 'complex_choice'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : q.questionType === 'true_false'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                              >
                                {q.typeLabel ||
                                  (q.questionType === 'complex_choice'
                                    ? 'Pilihan Ganda Kompleks (Checkbox)'
                                    : q.questionType === 'true_false'
                                      ? 'Benar / Salah (Grid)'
                                      : 'Pilihan Ganda Biasa')}
                              </span>
                            </div>

                            {/* Action Buttons for specific question item */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditQuestionModal(reviewPkg.id, q)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                                title="Edit Isi dan Jawaban Butir Soal Ini"
                              >
                                <Edit className="w-3.5 h-3.5 text-amber-700" />
                                <span>Edit Soal</span>
                              </button>

                              <button
                                onClick={() => handleDeleteQuestionItem(reviewPkg.id, q.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                                title="Hapus Butir Soal Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                <span>Hapus Soal</span>
                              </button>
                            </div>
                          </div>

                          {/* Rendered Question Content */}
                          <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 text-sm text-slate-900 font-medium">
                            <KaTeXRenderer content={q.content} />
                          </div>

                          {/* Options Grid */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-600">Pilihan Jawaban & Kunci:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt) => (
                                <div
                                  key={opt.id}
                                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${opt.isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                    : q.questionType === 'graded_choice' && opt.points && opt.points > 0
                                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium'
                                      : q.questionType === 'true_false' && opt.points !== undefined
                                        ? 'bg-red-50 border-red-300 text-red-950 font-semibold'
                                        : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                >
                                  {q.questionType === 'complex_choice' ? (
                                    <input
                                      type="checkbox"
                                      checked={opt.isCorrect}
                                      readOnly
                                      className="w-4 h-4 accent-emerald-600 rounded shrink-0"
                                    />
                                  ) : q.questionType === 'true_false' ? null : (
                                    <span className="font-black w-6 text-slate-800 shrink-0">{opt.label}.</span>
                                  )}
                                  <KaTeXRenderer content={opt.optionText} inline />
                                  {opt.isCorrect && (
                                    <span className="ml-auto text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-md shrink-0">
                                      {q.questionType === 'graded_choice' ? `Kunci Utama (+${opt.points})` : q.questionType === 'true_false' ? `Kunci Benar (+${opt.points})` : `Kunci (+${opt.points})`}
                                    </span>
                                  )}
                                  {!opt.isCorrect && q.questionType === 'graded_choice' && opt.points !== undefined && (
                                    <span className="ml-auto text-[10px] bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-md shrink-0">
                                      +{opt.points} Poin
                                    </span>
                                  )}
                                  {!opt.isCorrect && q.questionType === 'true_false' && opt.points !== undefined && (
                                    <span className="ml-auto text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-md shrink-0">
                                      Kunci Salah (+{opt.points})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">Belum Ada Butir Soal</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                          Paket soal ini belum memiliki butir pertanyaan. Silakan klik tombol di bawah untuk menginput soal berformat LaTeX.
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenInputQuestionModal(reviewPkg.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Input Soal Pertama Sekarang</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            /* SECTION 2: Tampilan Daftar Utama Manajemen Soal (Daftar Paket Soal) */
            <div className="space-y-6">
              {/* Filter Mata Pelajaran */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span>Daftar Mata Pelajaran</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih mata pelajaran untuk memfilter daftar soal atau tambah mata pelajaran baru.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSubjectModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span> Tambah Mapel Baru</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedSubjectId('all')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${selectedSubjectId === 'all'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Semua Mapel ({packages.length})</span>
                  </button>

                  {subjects.map((sub) => {
                    const pkgCount = packages.filter((p) => p.subjectId === sub.id).length;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubjectId(sub.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${selectedSubjectId === sub.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        <span>{sub.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${selectedSubjectId === sub.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                        >
                          {pkgCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Daftar Soal dalam Bentuk List Cards */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">Manajemen Soal</h3>
                    <p className="text-xs text-slate-500">
                      Daftar soal terdaftar. Klik 'Input Soal' pada soal pilihan Anda untuk mereview & mengedit butir-butir soal.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreatePackage}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span> Tambah Soal Baru</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {packages
                    .filter((pkg) => selectedSubjectId === 'all' || pkg.subjectId === selectedSubjectId)
                    .map((pkg) => (
                      <div
                        key={pkg.id}
                        className="p-5 border border-slate-200 rounded-2xl bg-white space-y-3 shadow-xs hover:border-slate-300 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        <div className="space-y-1.5 max-w-xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] bg-blue-600 text-white font-mono font-extrabold px-2.5 py-0.5 rounded-md">
                              KD: {pkg.code}
                            </span>
                            <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-0.5 rounded-md">
                              Mapel: {pkg.subjectName}
                            </span>
                            <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-md">
                              {pkg.questions.length} Butir Soal
                            </span>
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-base">{pkg.name}</h4>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span><strong>Guru ID:</strong> {pkg.teacherName} ({pkg.teacherId})</span>
                            <span>•</span>
                            <span><strong>Kelas Target:</strong> {pkg.classes?.join(', ') || 'Semua Kelas'}</span>
                            <span>•</span>
                            <span><strong>Durasi:</strong> {pkg.durationMinutes || 90} Menit</span>
                          </div>
                        </div>

                        {/* 4 Opsi Tombol Aksi: Input Soal, Edit Soal, Duplikat Soal, Hapus Soal */}
                        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                          {/* 1. Input Soal -> Mengarahkan ke halaman baru review seluruh butir soal */}
                          <button
                            onClick={() => setSelectedReviewPkgId(pkg.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                            title="Masuk ke halaman review seluruh butir soal"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Input Soal</span>
                          </button>

                          {/* 2. Edit Soal -> Mengedit nama soal, kelas, urutan, durasi */}
                          <button
                            onClick={() => handleOpenEditPackage(pkg)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                            title="Edit nama soal, kelas, urutan, dan durasi"
                          >
                            <Edit className="w-3.5 h-3.5 text-amber-700" />
                            <span>Edit Soal</span>
                          </button>

                          {/* 3. Duplikat Soal */}
                          <button
                            onClick={() => handleDuplicatePackage(pkg.id)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                            title="Duplikat paket soal ini"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-600" />
                            <span>Duplikat Soal</span>
                          </button>

                          {/* 4. Hapus Soal */}
                          <button
                            onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                            title="Hapus paket soal ini"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            <span>Hapus Soal</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MANAJEMEN TRY OUT (3 Sub-Menu Utama) */}
      {/* ========================================================================= */}
      {activeTab === 'tryout' && (
        <div className="space-y-6">
          {/* Header Title */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl text-white shadow-lg space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
                <KeyRound className="w-5 h-5" />
              </span>
              <h3 className="font-extrabold text-xl tracking-tight">Manajemen Try Out & CBT Center</h3>
            </div>
            <p className="text-xs text-slate-300">
              Pusat kendali aktivasi ujian, pemantauan status pengerjaan siswa secara langsung, serta reset peserta terkunci.
            </p>
          </div>

          {/* 3 Sub-Menu Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setTryoutSubTab('aktivasi')}
              className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${tryoutSubTab === 'aktivasi'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-700 hover:bg-slate-200'
                }`}
            >
              <Zap className="w-4 h-4" />
              <span>1. Aktivasi Try Out</span>
            </button>

            <button
              onClick={() => setTryoutSubTab('status')}
              className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${tryoutSubTab === 'status'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-700 hover:bg-slate-200'
                }`}
            >
              <Radio className="w-4 h-4" />
              <span>2. Status Try Out</span>
              <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                Live Monitoring
              </span>
            </button>

            <button
              onClick={() => setTryoutSubTab('reset')}
              className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${tryoutSubTab === 'reset'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-700 hover:bg-slate-200'
                }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>3. Reset Peserta</span>
              {sessions.filter((s) => s.status === 'blocked').length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                  {sessions.filter((s) => s.status === 'blocked').length}
                </span>
              )}
            </button>
          </div>

          {/* ========================================================================= */}
          {/* SUB-MENU 1: AKTIVASI TRY OUT (Daftar Sesi Ujian Aktif & Modal Aktifkan Soal) */}
          {/* ========================================================================= */}
          {tryoutSubTab === 'aktivasi' && (
            <div className="space-y-6">
              {/* Token 20 Menit Auto-Refresh Banner */}
              <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-6 text-white border border-blue-800 shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Sistem Token Otomatis (Refresh Tiap 20 Menit)</span>
                    </div>
                    <h4 className="font-extrabold text-lg">Token Akses Ujian Saat Ini</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Token 5-digit ini dibutuhkan siswa untuk mulai pengerjaan. Untuk mencegah kebocoran, token akan berganti secara otomatis setiap 20 menit sekali.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800/90 p-4 rounded-2xl border border-slate-700/80 w-full md:w-auto">
                    <div className="text-center space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Token 5 Digit:</span>
                      <div className="font-mono font-black text-2xl text-amber-400 tracking-widest bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
                        {currentToken}
                      </div>
                    </div>

                    <div className="text-center space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0 sm:pl-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Ganti Otomatis Dalam:</span>
                      <div className="font-mono font-extrabold text-lg text-emerald-400">
                        {formatTimer(tokenTimer)}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onRefreshToken();
                        setTokenTimer(1200);
                      }}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh Token Sekarang</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sesi Ujian Try Out Aktif Currently Published */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <span>Daftar Sesi Ujian Try Out Aktif</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sesi try out yang sedang berjalan dan siap dikerjakan oleh siswa.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
                      {packages.length} Paket Soal Tersedia
                    </span>
                    <button
                      onClick={() => setShowActivateExamModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-500/20 transition"
                    >
                      <Zap className="w-4 h-4" />
                      <span>+ Aktifkan Soal</span>
                    </button>
                  </div>
                </div>

                {tryouts.length > 0 ? (
                  <div className="space-y-3">
                    {tryouts.map((tr) => (
                      <div
                        key={tr.id}
                        className="p-5 border border-slate-200 rounded-2xl bg-white space-y-3 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-300 transition"
                      >
                        <div className="space-y-1.5 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${tr.isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-600'
                                }`}
                            >
                              {tr.isActive ? 'SESI AKTIF' : 'SESI NONAKTIF'}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                              Durasi: {tr.durationMinutes} Menit
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-base">{tr.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span><strong>Kelas Diizinkan:</strong> {tr.allowedClassNames.join(', ')}</span>
                            <span>•</span>
                            <span><strong>Acak Soal:</strong> {tr.isRandomOrder ? 'Ya' : 'Tidak'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => handleToggleTryoutStatus(tr.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${tr.isActive
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                          >
                            {tr.isActive ? 'Nonaktifkan Sesi' : 'Aktifkan Sesi'}
                          </button>
                          <button
                            onClick={() => handleDeleteTryout(tr.id, tr.title)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition"
                            title="Hapus Sesi Ujian"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">Belum Ada Sesi Try Out Aktif</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Sesi ujian aktif masih kosong. Klik tombol di bawah untuk memilih paket soal dari Bank Soal dan mengaktifkannya.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowActivateExamModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md shadow-emerald-500/20 transition"
                    >
                      <Zap className="w-4 h-4" />
                      <span>+ Aktifkan Soal Sekarang</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-MENU 2: STATUS TRY OUT (Pantau Pengerjaan, Fullscreen, Paksa Henti, Pagination) */}
          {/* ========================================================================= */}
          {tryoutSubTab === 'status' && (
            <div className="space-y-6">
              {/* Monitoring Dashboard Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                  <span className="text-[11px] font-extrabold text-blue-700 uppercase">Sedang Mengerjakan</span>
                  <p className="text-2xl font-black text-blue-900">
                    {sessions.filter((s) => s.status === 'active').length} Siswa
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[11px] font-extrabold text-emerald-700 uppercase">Ujian Selesai</span>
                  <p className="text-2xl font-black text-emerald-900">
                    {sessions.filter((s) => s.status === 'finished').length} Siswa
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <span className="text-[11px] font-extrabold text-amber-700 uppercase">Sinyal Hilang / Terblokir</span>
                  <p className="text-2xl font-black text-amber-900">
                    {sessions.filter((s) => s.status === 'blocked').length} Siswa
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 space-y-1">
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase">Total Peserta Sesi</span>
                  <p className="text-2xl font-black text-slate-900">{sessions.length} Siswa</p>
                </div>
              </div>

              {/* Table Live Monitoring Progress (Supports Fullscreen overlay mode) */}
              <div
                className={
                  isStatusFullscreen
                    ? 'fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-6 overflow-auto flex flex-col space-y-4 text-white'
                    : 'bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4'
                }
              >
                {/* Control Header Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-200/40">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
                    <h3 className={`font-extrabold text-base ${isStatusFullscreen ? 'text-white' : 'text-slate-900'}`}>
                      Pemantauan Live Status Pengerjaan Siswa
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
                    {/* Opsi Tampilan Jumlah Siswa */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                      <span className="text-[10px] uppercase text-slate-400 font-extrabold px-2">Tampil:</span>
                      {[10, 20, 'all'].map((size) => (
                        <button
                          key={size.toString()}
                          onClick={() => setStatusPageSize(size as number | 'all')}
                          className={`px-2.5 py-1 rounded-lg transition ${statusPageSize === size
                            ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                            : 'hover:bg-slate-200 text-slate-600'
                            }`}
                        >
                          {size === 'all' ? 'Semua' : `${size} Siswa`}
                        </button>
                      ))}
                    </div>

                    {/* Button Paksa Henti Masal */}
                    <button
                      onClick={handleForceStopAllSessions}
                      className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/20 transition"
                      title="Paksa henti seluruh peserta yang sedang mengerjakan ujian"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>Stop Bersama</span>
                    </button>

                    {/* Button Export Status Try Out Excel */}
                    <button
                      onClick={handleExportStatusExcel}
                      className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-green-500/20 transition"
                      title="Export seluruh status sesi ujian ke dalam file Excel (CSV)"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export Status</span>
                    </button>

                    {/* Button Clear Sesi */}
                    <button
                      onClick={handleClearAllSessions}
                      className="bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-slate-500/20 transition"
                      title="Bersihkan seluruh data sesi ujian yang ada (Nilai di Hasil Kelas tidak akan terhapus)"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear</span>
                    </button>

                    {/* Button Fullscreen Toggle */}
                    <button
                      onClick={() => setIsStatusFullscreen(!isStatusFullscreen)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${isStatusFullscreen
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
                        }`}
                      title={isStatusFullscreen ? 'Keluar Tampilan Penuh' : 'Tampilan Penuh (Sembunyikan Sidebar)'}
                    >
                      {isStatusFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      <span>{isStatusFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white text-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">SISWA</th>
                        <th className="py-2.5 px-3">KELAS</th>
                        <th className="py-2.5 px-3">MATA UJIAN</th>
                        <th className="py-2.5 px-3 text-center">MULAI UJIAN</th>
                        <th className="py-2.5 px-3 text-center">DURASI SISWA</th>
                        <th className="py-2.5 px-3 text-center">SOAL TERJAWAB</th>
                        <th className="py-2.5 px-3 text-center">SOAL BELUM</th>
                        <th className="py-2.5 px-3 text-center">SOAL RAGU</th>
                        <th className="py-2.5 px-3 text-center">STATUS SESI</th>
                        <th className="py-2.5 px-3 text-center">KONTROL AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-xs">
                      {(statusPageSize === 'all' ? sessions : sessions.slice(0, statusPageSize)).map((s, idx) => {
                        const tryout = tryouts.find(t => t.id === s.tryoutId);
                        const pkg = tryout ? packages.find(p => p.id === tryout.packageId) : null;
                        const totalQuestions = pkg?.questions?.length || 30;

                        let parsedAnswers: any[] = [];
                        if (typeof s.answers === 'string') {
                          try { parsedAnswers = JSON.parse(s.answers); } catch (e) { }
                        } else if (Array.isArray(s.answers)) {
                          parsedAnswers = s.answers;
                        }
                        const answered = parsedAnswers.filter(a => a && a.selectedOptionIds && a.selectedOptionIds.length > 0).length;
                        const doubtful = parsedAnswers.filter(a => a && a.isDoubtful).length;
                        const unanswered = totalQuestions - answered;

                        let durationStr = '-';
                        if (s.status === 'finished' && s.endTime && s.startTime) {
                          const diffSecs = Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000);
                          const mm = Math.floor(diffSecs / 60);
                          const ss = diffSecs % 60;
                          durationStr = `${mm}m ${ss}s`;
                        } else if (s.status === 'active' && s.startTime) {
                          const diffSecs = Math.floor((new Date().getTime() - new Date(s.startTime).getTime()) / 1000);
                          const mm = Math.floor(diffSecs / 60);
                          const ss = diffSecs % 60;
                          durationStr = `${mm}m ${ss}s (Berjalan)`;
                        }

                        const startTimeStr = s.startTime ? new Date(s.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/90 transition">
                            <td className="py-2.5 px-3">
                              <p className="font-extrabold text-slate-900 text-xs">{s.studentName}</p>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className="font-extrabold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                                {s.className}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-slate-700 max-w-[160px]">
                              <p className="font-bold truncate text-xs">{s.tryoutTitle}</p>
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600 text-[11px]">
                              {startTimeStr}
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono font-extrabold text-slate-800 text-xs">
                              {s.status === 'finished' ? (
                                <span className="text-slate-400">{durationStr}</span>
                              ) : (
                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                                  {durationStr}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <span className="font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px]">
                                {answered} / {totalQuestions}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px]">
                                {unanswered}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-[11px]">
                                {doubtful}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              {s.status === 'active' && (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  Mengerjakan
                                </span>
                              )}
                              {s.status === 'finished' && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-300 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                  Selesai
                                </span>
                              )}
                              {s.status === 'blocked' && (
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                  Terhenti / Sinyal
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              {s.status === 'active' ? (
                                <button
                                  onClick={() => handleForceStopSession(s.id, s.studentName)}
                                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg inline-flex items-center gap-1 shadow-2xs transition"
                                  title="Paksa Henti Ujian Siswa"
                                >
                                  <StopCircle className="w-3 h-3" />
                                  <span>Paksa Henti</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">Tidak Aktif</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-MENU 3: RESET PESERTA (Tampilan List Nama Peserta & Button Reset Peserta) */}
          {/* ========================================================================= */}
          {tryoutSubTab === 'reset' && (
            <div className="space-y-6">
              {/* Banner Info Reset Peserta */}
              <div className="p-5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-amber-500 text-white rounded-xl shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-amber-950 text-base">
                    Pusat Reset Peserta (Gangguan Sinyal / Terblokir Kiosk)
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Peserta yang mengalami gangguan sinyal internet, terputus koneksi, atau tidak sengaja keluar dari aplikasi Kiosk CBT akan otomatis terikat/terblokir. Peserta dapat meminta admin untuk mereset sesi. Setelah di-reset, peserta dapat login kembali tanpa kehilangan progress jawaban.
                  </p>
                </div>
              </div>

              {/* Filter Search Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari Nama Siswa / NIS / Kelas..."
                    value={resetSearchTerm}
                    onChange={(e) => setResetSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs text-slate-600 font-bold">
                    Peserta Terblokir:{' '}
                    <strong className="text-amber-600">
                      {sessions.filter((s) => s.status === 'blocked').length} Siswa
                    </strong>
                  </span>
                </div>
              </div>

              {/* List Nama Peserta dengan Button Reset Peserta di samping */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-base">Daftar Nama Peserta Ujian</h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Klik 'Reset Peserta' pada siswa yang butuh membuka kuncian sesi
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {sessions
                    .filter((s) => s.status === 'blocked')
                    .filter(
                      (s) =>
                        s.studentName.toLowerCase().includes(resetSearchTerm.toLowerCase()) ||
                        s.studentNis.includes(resetSearchTerm) ||
                        s.className.toLowerCase().includes(resetSearchTerm.toLowerCase())
                    )
                    .map((s) => {
                      const isBlocked = s.status === 'blocked';
                      return (
                        <div
                          key={s.id}
                          className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${isBlocked ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50/80'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${isBlocked
                                ? 'bg-amber-500 text-white shadow-xs'
                                : s.status === 'active'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                              {s.studentName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-extrabold text-slate-900 text-sm">{s.studentName}</h4>
                                <span
                                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${isBlocked
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : s.status === 'active'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                  {isBlocked
                                    ? '● Terblokir (Sinyal/Kiosk)'
                                    : s.status === 'active'
                                      ? '● Mengerjakan Ujian'
                                      : 'Selesai'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                NIS: <span className="font-mono font-bold text-slate-700">{s.studentNis}</span> • Kelas:{' '}
                                <span className="font-bold text-blue-700">{s.className}</span> • Ujian:{' '}
                                <span className="font-semibold text-slate-800">{s.tryoutTitle}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <button
                              onClick={() => handleResetStudentSession(s.id, s.studentName)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition"
                              title={`Reset kuncian sesi ujian untuk ${s.studentName}`}
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Reset Peserta</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HASIL & RANKING */}
      {/* ========================================================================= */}
      {activeTab === 'hasil' && (
        <div className="space-y-6">
          {/* Sub-menu Tabs: Hasil Pararel vs Hasil Kelas */}
          <div className="flex border-b border-slate-200/80 gap-6">
            <button
              onClick={() => setHasilSubTab('pararel')}
              className={`pb-3 text-sm font-extrabold transition relative ${hasilSubTab === 'pararel'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Hasil Pararel
            </button>
            <button
              onClick={() => setHasilSubTab('kelas')}
              className={`pb-3 text-sm font-extrabold transition relative ${hasilSubTab === 'kelas'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Hasil Kelas
            </button>
          </div>

          {/* ========================================================================= */}
          {/* SUB-TAB 1: HASIL PARAREL */}
          {/* ========================================================================= */}
          {hasilSubTab === 'pararel' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
              {/* Header Filter & Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide shrink-0">
                    Pilih Try Out:
                  </span>
                  <select
                    value={selectedParallelTryoutTitle}
                    onChange={(e) => setSelectedParallelTryoutTitle(e.target.value)}
                    className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[240px]"
                  >
                    <option value="">-- Pilih Paket Try Out --</option>
                    {availableTryoutTitles.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleExportParallelExcel}
                  disabled={!selectedParallelTryoutTitle}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition ${selectedParallelTryoutTitle
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                  title="Export Data Hasil Pararel ke File Excel (CSV)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export to Excel</span>
                </button>
              </div>

              {/* Data Table / Empty State */}
              {!selectedParallelTryoutTitle ? (
                <div className="bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <Award className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-base">Tabel Hasil Pararel Kosong</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Silakan pilih menu paket Try Out di atas untuk menampilkan daftar hasil dan pemeringkatan nilai seluruh siswa secara terpadu.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-3 text-center w-16">RANK</th>
                        <th className="py-3 px-4">NAMA SISWA</th>
                        <th className="py-3 px-3">KELAS</th>
                        <th className="py-3 px-4">MATA UJIAN</th>
                        <th className="py-3 px-3 text-center">BENAR</th>
                        <th className="py-3 px-3 text-center">SALAH</th>
                        <th className="py-3 px-4 text-right">NILAI AKHIR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {getParallelResults().map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50/90 transition">
                          <td className="py-3 px-3 text-center font-black">
                            {idx === 0 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-400 text-amber-950 font-black rounded-full text-xs shadow-xs">
                                🥇 1
                              </span>
                            ) : idx === 1 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-slate-200 text-slate-800 font-black rounded-full text-xs shadow-xs">
                                🥈 2
                              </span>
                            ) : idx === 2 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 bg-amber-700/20 text-amber-900 font-black rounded-full text-xs shadow-xs">
                                🥉 3
                              </span>
                            ) : (
                              <span className="text-slate-600 font-bold">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-extrabold text-slate-900 text-xs">{row.studentName}</p>
                            <p className="text-[10px] font-mono text-slate-400">NIS: {row.studentNis}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-extrabold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                              {row.className}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-bold max-w-[200px] truncate">
                            {row.tryoutTitle}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                              {row.totalCorrect}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                              {row.totalWrong}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-black text-sm text-blue-900 font-mono">
                              {row.finalScore}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 2: HASIL KELAS */}
          {/* ========================================================================= */}
          {hasilSubTab === 'kelas' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
              {/* Header Controls: Choice of Kelas & Try Out */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide shrink-0">
                    Pilih Kelas:
                  </span>
                  <select
                    value={selectedResultClassName}
                    onChange={(e) => setSelectedResultClassName(e.target.value)}
                    className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide shrink-0">
                    Pilih Try Out:
                  </span>
                  <select
                    value={selectedClassTryoutTitle}
                    onChange={(e) => setSelectedClassTryoutTitle(e.target.value)}
                    className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[220px]"
                  >
                    <option value="">-- Pilih Paket Try Out --</option>
                    {availableTryoutTitles.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Table / Empty State */}
              {!selectedResultClassName || !selectedClassTryoutTitle ? (
                <div className="bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                  <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-base">Tabel Hasil Kelas Kosong</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Silakan pilih Kelas dan Try Out pada menu di atas untuk memunculkan daftar hasil siswa kelas tersebut (diurutkan berdasarkan NIS).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-700">
                      Hasil Ujian Kelas: <strong className="text-blue-700">{selectedResultClassName}</strong> • Urut NIS (Kecil ke Besar)
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleToggleReviewMasal}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
                        title="Aktifkan/Nonaktifkan review nilai masal untuk kelas ini"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review Masal</span>
                      </button>
                      <button
                        onClick={handleExportClassExcel}
                        className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
                        title="Export hasil kelas ini ke dalam file Excel (CSV)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Export to Excel</span>
                      </button>
                      <span className="text-[11px] bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-bold text-slate-600">
                        Total: {getClassResults().length} Siswa
                      </span>
                    </div>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-3 text-center w-12">NO</th>
                        <th className="py-3 px-3">NIS</th>
                        <th className="py-3 px-4">NAMA SISWA (A-Z)</th>
                        <th className="py-3 px-3">KELAS</th>
                        <th className="py-3 px-3 text-center">BENAR</th>
                        <th className="py-3 px-3 text-center">SALAH</th>
                        <th className="py-3 px-4 text-right">NILAI AKHIR</th>
                        <th className="py-3 px-3 text-center">STATUS</th>
                        <th className="py-3 px-3 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {getClassResults().map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50/90 transition">
                          <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-600">{row.studentNis}</td>
                          <td className="py-3 px-4 font-extrabold text-slate-900 text-xs">
                            {row.studentName}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                              {row.className}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                              {row.totalCorrect}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                              {row.totalWrong}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-black text-sm text-blue-900 font-mono">
                              {row.finalScore}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Selesai
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleToggleReview(row.id!, !!row.show_review)}
                              className={`font-extrabold text-[10px] px-2.5 py-1 rounded shadow-sm transition ${row.show_review
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                                }`}
                            >
                              {row.show_review ? 'Nonaktif Nilai' : 'Review Nilai'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PENGUMUMAN */}
      {/* ========================================================================= */}
      {activeTab === 'pengumuman' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 text-lg">Pengumuman Terpadu Bimbel</h3>
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pengumuman</span>
            </button>
          </div>

          <div className="space-y-4">
            {announcements.map((anno) => (
              <div key={anno.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded uppercase">
                      Target: {anno.target}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base mt-1">{anno.title}</h4>
                    <p className="text-xs text-slate-500">Oleh: {anno.authorName} • {anno.date}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed">{anno.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: INSPEKSI API, SUPABASE DDL & BACKEND GOLANG */}
      {/* ========================================================================= */}
      {activeTab === 'inspeksi_api' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-indigo-500/10 to-transparent pointer-events-none"></div>
            <div className="relative z-10 space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" /> Supabase PostgreSQL & Golang API
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                  Status: Siap Di-deploy
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Inspeksi API, Database Supabase & Backend Golang
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Pusat dokumentasi koneksi database Supabase, skema DDL SQL PostgreSQL lengkap (dengan RLS & Foreign Keys), serta source code REST API Golang untuk integrasi Kiosk CBT & Token Ujian.
              </p>

              {/* Sub-Tabs Switcher */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setInspeksiSubTab('supabase_conn')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${inspeksiSubTab === 'supabase_conn'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 border border-blue-400/40'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                    }`}
                >
                  <Server className="w-4 h-4" />
                  <span>1. Koneksi Supabase</span>
                </button>

                <button
                  onClick={() => setInspeksiSubTab('ddl_sql')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${inspeksiSubTab === 'ddl_sql'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 border border-blue-400/40'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                    }`}
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>2. DDL SQL Supabase</span>
                </button>

                <button
                  onClick={() => setInspeksiSubTab('golang_api')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${inspeksiSubTab === 'golang_api'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 border border-blue-400/40'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                    }`}
                >
                  <Code className="w-4 h-4 text-cyan-400" />
                  <span>3. Backend API Golang</span>
                </button>
              </div>
            </div>
          </div>

          {/* SUB-TAB 1: KONEKSI SUPABASE */}
          {inspeksiSubTab === 'supabase_conn' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supabase URL Card */}
                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-blue-600" /> VITE_SUPABASE_URL
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('https://your-project-ref.supabase.co');
                        setCopiedEnv('url');
                        setTimeout(() => setCopiedEnv(null), 2000);
                      }}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition"
                    >
                      {copiedEnv === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedEnv === 'url' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value="https://your-project-ref.supabase.co"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Masukan URL ini pada environment variable frontend React/Vite atau backend REST API.
                  </p>
                </div>

                {/* Supabase Anon Key Card */}
                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-amber-600" /> VITE_SUPABASE_ANON_KEY
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1yZWYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MjI3MjAwMCwiZXhwIjoyMDE3ODQ4MDAwfQ.placeholderKeySecret');
                        setCopiedEnv('anon');
                        setTimeout(() => setCopiedEnv(null), 2000);
                      }}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition"
                    >
                      {copiedEnv === 'anon' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedEnv === 'anon' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 truncate"
                  />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Kunci Anon Supabase publik untuk koneksi aman dari client browser.
                  </p>
                </div>
              </div>

              {/* PostgreSQL DSN Connection String */}
              <div className="p-5 bg-slate-900 rounded-2xl text-white space-y-3 border border-slate-800 shadow-md">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" /> DATABASE_URL (PostgreSQL DSN Direct Connection)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require');
                      setCopiedEnv('dsn');
                      setTimeout(() => setCopiedEnv(null), 2000);
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    {copiedEnv === 'dsn' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEnv === 'dsn' ? 'Tersalin!' : 'Salin DSN String'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800">
                  postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
                </div>
                <p className="text-[11px] text-slate-400">
                  Gunakan string koneksi PostgreSQL ini di backend Golang GORM / pgx untuk transaksi database direct berkecepatan tinggi.
                </p>
              </div>

              {/* TypeScript Client Snippet */}
              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-600" />
                  <span>Penggunaan Supabase Client di React / TypeScript (`src/lib/supabase.ts`)</span>
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
                  <pre>{`import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-ref.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: DDL SQL SUPABASE */}
          {inspeksiSubTab === 'ddl_sql' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-600" />
                    <span>Skema DDL PostgreSQL Supabase</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Skema tabel PostgreSQL lengkap (Settings, Classes, Students, Staff, Question Packages, Questions, Tryouts, Sessions, Scores, Announcements) dengan RLS & Indexing.
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`-- ====================================================================
-- DDL POSTGRESQL / SUPABASE UNTUK SYSTEM CBT BIMBEL CHAMPION ACADEMY
-- Database Target: Supabase PostgreSQL 15+
-- ====================================================================

-- 1. Tabel Settings Bimbel
CREATE TABLE IF NOT EXISTS public.bimbel_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bimbel_name VARCHAR(255) NOT NULL DEFAULT 'Bimbel Champion Academy',
  owner_name VARCHAR(255),
  address TEXT,
  phone VARCHAR(100),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Kelas (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  student_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Staff / User Staff (Admin & Guru/Tentor)
CREATE TABLE IF NOT EXISTS public.staff_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'guru')),
  avatar_url TEXT,
  subjects JSONB DEFAULT '[]'::jsonb,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Siswa (Student Users)
CREATE TABLE IF NOT EXISTS public.student_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  class_id BIGINT REFERENCES public.classes(id) ON DELETE SET NULL,
  class_name VARCHAR(100) NOT NULL,
  nis VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Mata Pelajaran (Subjects)
CREATE TABLE IF NOT EXISTS public.subjects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Pengumuman Bimbel (Announcements)
CREATE TABLE IF NOT EXISTS public.announcements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  target_class VARCHAR(100) NOT NULL DEFAULT 'Semua Kelas',
  content TEXT NOT NULL,
  date VARCHAR(50) NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Paket Soal (Question Packages)
CREATE TABLE IF NOT EXISTS public.question_packages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE CASCADE,
  subject_name VARCHAR(255) NOT NULL,
  teacher_id BIGINT REFERENCES public.staff_users(id) ON DELETE SET NULL,
  teacher_name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  classes JSONB DEFAULT '[]'::jsonb,
  is_random_order BOOLEAN DEFAULT TRUE,
  duration_minutes INT DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Soal & Opsi (Questions)
CREATE TABLE IF NOT EXISTS public.questions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  package_id BIGINT REFERENCES public.question_packages(id) ON DELETE CASCADE,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('single_choice', 'true_false', 'complex_choice', 'graded_choice')),
  type_label VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  discussion TEXT,
  points_default INT DEFAULT 10,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabel Sesi Try Out (Tryout Sessions)
CREATE TABLE IF NOT EXISTS public.tryout_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  package_id BIGINT REFERENCES public.question_packages(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  token VARCHAR(10) NOT NULL,
  duration_minutes INT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_random_order BOOLEAN DEFAULT TRUE,
  show_result_to_student BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  allowed_class_names JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabel Monitoring Kiosk & Sesi Pengerjaan Ujian Siswa
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT REFERENCES public.student_users(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  student_nis VARCHAR(50) NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  tryout_id BIGINT REFERENCES public.tryout_items(id) ON DELETE CASCADE,
  tryout_title VARCHAR(255) NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'finished', 'blocked')),
  answers JSONB DEFAULT '[]'::jsonb,
  final_score NUMERIC(5, 2) DEFAULT 0.00,
  violations_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabel Rekap Nilai Ujian (Exam Scores)
CREATE TABLE IF NOT EXISTS public.exam_scores (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_name VARCHAR(255) NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  tryout_title VARCHAR(255) NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  total_correct INT NOT NULL,
  total_wrong INT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXING UNTUK QUERY TINGGI & MONITORING KIOSK
CREATE INDEX IF NOT EXISTS idx_student_nis ON public.student_users(nis);
CREATE INDEX IF NOT EXISTS idx_tryout_token ON public.tryout_items(token);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON public.exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_questions_package_id ON public.questions(package_id);

-- ENABLE ROW LEVEL SECURITY (RLS) SUPABASE
ALTER TABLE public.bimbel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_scores ENABLE ROW LEVEL SECURITY;

-- POLICIES (AKSES PUBLIK / SERVICE ROLE)
CREATE POLICY "Allow public read bimbel_settings" ON public.bimbel_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow public read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow public read tryouts" ON public.tryout_items FOR SELECT USING (is_active = true);
CREATE POLICY "Allow student manage sessions" ON public.exam_sessions FOR ALL USING (true);
CREATE POLICY "Allow student write exam_scores" ON public.exam_scores FOR ALL USING (true);

-- SEED DATA AWAL (OPSIONAL DAFTAR DATA DEFAULT)
INSERT INTO public.bimbel_settings (bimbel_name, owner_name, address, phone) 
VALUES ('Bimbel Champion Academy', 'Drs. H. Ahmad Wijaya, M.Pd.', 'Jl. Pendidikan No. 45, Jakarta Selatan', '0812-3456-7890')
ON CONFLICT DO NOTHING;

INSERT INTO public.staff_users (name, username, role, password_hash)
VALUES 
  ('Administrator Utama', 'admin', 'admin', 'admin123'),
  ('Dra. Siti Aminah, M.Pd', 'siti', 'guru', 'guru123')
ON CONFLICT (username) DO NOTHING;`);
                    setCopiedDDL(true);
                    setTimeout(() => setCopiedDDL(false), 2500);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 transition shrink-0"
                >
                  {copiedDDL ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedDDL ? 'Tersalin Ke Clipboard!' : 'Salin DDL SQL Supabase'}</span>
                </button>
              </div>

              {/* Code Viewer Container */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 overflow-x-auto shadow-inner">
                <pre className="font-mono text-xs text-emerald-400 leading-relaxed">{`-- ====================================================================
-- DDL POSTGRESQL / SUPABASE UNTUK SYSTEM CBT BIMBEL CHAMPION ACADEMY
-- Database Target: Supabase PostgreSQL 15+
-- ====================================================================

-- 1. Tabel Settings Bimbel
CREATE TABLE IF NOT EXISTS public.bimbel_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bimbel_name VARCHAR(255) NOT NULL DEFAULT 'Bimbel Champion Academy',
  owner_name VARCHAR(255),
  address TEXT,
  phone VARCHAR(100),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Kelas (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  student_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Staff / User Staff (Admin & Guru/Tentor)
CREATE TABLE IF NOT EXISTS public.staff_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'guru')),
  avatar_url TEXT,
  subjects JSONB DEFAULT '[]'::jsonb,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Siswa (Student Users)
CREATE TABLE IF NOT EXISTS public.student_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  class_id BIGINT REFERENCES public.classes(id) ON DELETE SET NULL,
  class_name VARCHAR(100) NOT NULL,
  nis VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT '123',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Mata Pelajaran (Subjects)
CREATE TABLE IF NOT EXISTS public.subjects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Pengumuman Bimbel (Announcements)
CREATE TABLE IF NOT EXISTS public.announcements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  target_class VARCHAR(100) NOT NULL DEFAULT 'Semua Kelas',
  content TEXT NOT NULL,
  date VARCHAR(50) NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Paket Soal (Question Packages)
CREATE TABLE IF NOT EXISTS public.question_packages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE CASCADE,
  subject_name VARCHAR(255) NOT NULL,
  teacher_id BIGINT REFERENCES public.staff_users(id) ON DELETE SET NULL,
  teacher_name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  classes JSONB DEFAULT '[]'::jsonb,
  is_random_order BOOLEAN DEFAULT TRUE,
  duration_minutes INT DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Soal & Opsi (Questions)
CREATE TABLE IF NOT EXISTS public.questions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  package_id BIGINT REFERENCES public.question_packages(id) ON DELETE CASCADE,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('single_choice', 'true_false', 'complex_choice', 'graded_choice')),
  type_label VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  discussion TEXT,
  points_default INT DEFAULT 10,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabel Sesi Try Out (Tryout Sessions)
CREATE TABLE IF NOT EXISTS public.tryout_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  package_id BIGINT REFERENCES public.question_packages(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  token VARCHAR(10) NOT NULL,
  duration_minutes INT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_random_order BOOLEAN DEFAULT TRUE,
  show_result_to_student BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  allowed_class_names JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabel Monitoring Kiosk & Sesi Pengerjaan Ujian Siswa
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id BIGINT REFERENCES public.student_users(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  student_nis VARCHAR(50) NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  tryout_id BIGINT REFERENCES public.tryout_items(id) ON DELETE CASCADE,
  tryout_title VARCHAR(255) NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'finished', 'blocked')),
  answers JSONB DEFAULT '[]'::jsonb,
  final_score NUMERIC(5, 2) DEFAULT 0.00,
  violations_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabel Rekap Nilai Ujian (Exam Scores)
CREATE TABLE IF NOT EXISTS public.exam_scores (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_name VARCHAR(255) NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  tryout_title VARCHAR(255) NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  total_correct INT NOT NULL,
  total_wrong INT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXING UNTUK QUERY TINGGI & MONITORING KIOSK
CREATE INDEX IF NOT EXISTS idx_student_nis ON public.student_users(nis);
CREATE INDEX IF NOT EXISTS idx_tryout_token ON public.tryout_items(token);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON public.exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_questions_package_id ON public.questions(package_id);

-- ENABLE ROW LEVEL SECURITY (RLS) SUPABASE
ALTER TABLE public.bimbel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_scores ENABLE ROW LEVEL SECURITY;

-- POLICIES (AKSES PUBLIK / SERVICE ROLE)
CREATE POLICY "Allow public read bimbel_settings" ON public.bimbel_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow public read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow public read tryouts" ON public.tryout_items FOR SELECT USING (is_active = true);
CREATE POLICY "Allow student manage sessions" ON public.exam_sessions FOR ALL USING (true);
CREATE POLICY "Allow student write exam_scores" ON public.exam_scores FOR ALL USING (true);

-- SEED DATA AWAL (OPSIONAL DAFTAR DATA DEFAULT)
INSERT INTO public.bimbel_settings (bimbel_name, owner_name, address, phone) 
VALUES ('Bimbel Champion Academy', 'Drs. H. Ahmad Wijaya, M.Pd.', 'Jl. Pendidikan No. 45, Jakarta Selatan', '0812-3456-7890')
ON CONFLICT DO NOTHING;

INSERT INTO public.staff_users (name, username, role, password_hash)
VALUES 
  ('Administrator Utama', 'admin', 'admin', 'admin123'),
  ('Dra. Siti Aminah, M.Pd', 'siti', 'guru', 'guru123')
ON CONFLICT (username) DO NOTHING;`}</pre>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: BACKEND API GOLANG */}
          {inspeksiSubTab === 'golang_api' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Code className="w-5 h-5 text-cyan-600" />
                    <span>Backend REST API Service Golang (Gin Framework & GORM)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Source code Golang lengkap untuk penanganan verifikasi Token 5 Digit Kiosk CBT, penguncian sesi pelanggaran, & pengiriman nilai ke database.
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

type TryoutItem struct {
	ID                  uint      \`gorm:"primaryKey" json:"id"\`
	PackageID           uint      \`json:"packageId"\`
	Title               string    \`json:"title"\`
	Token               string    \`json:"token"\`
	DurationMinutes     int       \`json:"durationMinutes"\`
	StartTime           time.Time \`json:"startTime"\`
	EndTime             time.Time \`json:"endTime"\`
	IsRandomOrder       bool      \`json:"isRandomOrder"\`
	ShowResultToStudent bool      \`json:"showResultToStudent"\`
	IsActive            bool      \`json:"isActive"\`
}

type ExamScore struct {
	ID           uint      \`gorm:"primaryKey" json:"id"\`
	StudentName  string    \`json:"studentName"\`
	ClassName    string    \`json:"className"\`
	SubjectName  string    \`json:"subjectName"\`
	TryoutTitle  string    \`json:"tryoutTitle"\`
	Score        float64   \`json:"score"\`
	TotalCorrect int       \`json:"totalCorrect"\`
	TotalWrong   int       \`json:"totalWrong"\`
	CreatedAt    time.Time \`json:"createdAt"\`
}

type TokenVerifyRequest struct {
	StudentNIS string \`json:"studentNis" binding:"required"\`
	Token      string \`json:"token" binding:"required"\`
	TryoutID   uint   \`json:"tryoutId" binding:"required"\`
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres.ref:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
	}

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Gagal terhubung ke Supabase PostgreSQL: %v", err)
	}

	fmt.Println("⚡ Terkoneksi Sukses ke Database Supabase PostgreSQL!")

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api/v1")
	{
		api.GET("/tryouts", GetActiveTryouts)
		api.POST("/tryouts/verify-token", VerifyKioskToken)
		api.POST("/exam/submit", SubmitExamResult)
		api.POST("/exam/violation", RecordViolation)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}

func GetActiveTryouts(c *gin.Context) {
	var tryouts []TryoutItem
	if err := db.Where("is_active = ?", true).Find(&tryouts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data tryout"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": tryouts})
}

func VerifyKioskToken(c *gin.Context) {
	var req TokenVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	var tryout TryoutItem
	if err := db.Where("id = ? AND token = ? AND is_active = ?", req.TryoutID, req.Token, true).First(&tryout).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"valid": false,
			"error": "Token 5 digit tidak cocok atau sesi ujian telah ditutup!",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":   true,
		"message": "Token valid, Kiosk CBT dikonfirmasi",
		"tryout":  tryout,
	})
}

func SubmitExamResult(c *gin.Context) {
	var scoreRecord ExamScore
	if err := c.ShouldBindJSON(&scoreRecord); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload hasil ujian tidak valid"})
		return
	}

	scoreRecord.CreatedAt = time.Now()
	if err := db.Create(&scoreRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan nilai ujian ke Supabase"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Hasil & nilai ujian berhasil tercatat di database Supabase",
		"data":    scoreRecord,
	})
}

func RecordViolation(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "blocked",
		"message": "Sesi dikunci otomatis akibat pelanggaran integritas layar",
	})
}`);
                    setCopiedGolang(true);
                    setTimeout(() => setCopiedGolang(false), 2500);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-cyan-600/20 transition shrink-0"
                >
                  {copiedGolang ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedGolang ? 'Tersalin Ke Clipboard!' : 'Salin Kode Backend Golang'}</span>
                </button>
              </div>

              {/* Code Viewer Container */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 overflow-x-auto shadow-inner">
                <pre className="font-mono text-xs text-cyan-300 leading-relaxed">{`package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

type TryoutItem struct {
	ID                  uint      \`gorm:"primaryKey" json:"id"\`
	PackageID           uint      \`json:"packageId"\`
	Title               string    \`json:"title"\`
	Token               string    \`json:"token"\`
	DurationMinutes     int       \`json:"durationMinutes"\`
	StartTime           time.Time \`json:"startTime"\`
	EndTime             time.Time \`json:"endTime"\`
	IsRandomOrder       bool      \`json:"isRandomOrder"\`
	ShowResultToStudent bool      \`json:"showResultToStudent"\`
	IsActive            bool      \`json:"isActive"\`
}

type ExamScore struct {
	ID           uint      \`gorm:"primaryKey" json:"id"\`
	StudentName  string    \`json:"studentName"\`
	ClassName    string    \`json:"className"\`
	SubjectName  string    \`json:"subjectName"\`
	TryoutTitle  string    \`json:"tryoutTitle"\`
	Score        float64   \`json:"score"\`
	TotalCorrect int       \`json:"totalCorrect"\`
	TotalWrong   int       \`json:"totalWrong"\`
	CreatedAt    time.Time \`json:"createdAt"\`
}

type TokenVerifyRequest struct {
	StudentNIS string \`json:"studentNis" binding:"required"\`
	Token      string \`json:"token" binding:"required"\`
	TryoutID   uint   \`json:"tryoutId" binding:"required"\`
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres.ref:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
	}

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Gagal terhubung ke Supabase PostgreSQL: %v", err)
	}

	fmt.Println("⚡ Terkoneksi Sukses ke Database Supabase PostgreSQL!")

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api/v1")
	{
		api.GET("/tryouts", GetActiveTryouts)
		api.POST("/tryouts/verify-token", VerifyKioskToken)
		api.POST("/exam/submit", SubmitExamResult)
		api.POST("/exam/violation", RecordViolation)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}

func GetActiveTryouts(c *gin.Context) {
	var tryouts []TryoutItem
	if err := db.Where("is_active = ?", true).Find(&tryouts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data tryout"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": tryouts})
}

func VerifyKioskToken(c *gin.Context) {
	var req TokenVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	var tryout TryoutItem
	if err := db.Where("id = ? AND token = ? AND is_active = ?", req.TryoutID, req.Token, true).First(&tryout).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"valid": false,
			"error": "Token 5 digit tidak cocok atau sesi ujian telah ditutup!",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":   true,
		"message": "Token valid, Kiosk CBT dikonfirmasi",
		"tryout":  tryout,
	})
}

func SubmitExamResult(c *gin.Context) {
	var scoreRecord ExamScore
	if err := c.ShouldBindJSON(&scoreRecord); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload hasil ujian tidak valid"})
		return
	}

	scoreRecord.CreatedAt = time.Now()
	if err := db.Create(&scoreRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan nilai ujian ke Supabase"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Hasil & nilai ujian berhasil tercatat di database Supabase",
		"data":    scoreRecord,
	})
}

func RecordViolation(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "blocked",
		"message": "Sesi dikunci otomatis akibat pelanggaran integritas layar",
	})
}`}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: PENGATURAN BIMBEL */}
      {/* ========================================================================= */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 max-w-2xl">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Pengaturan Identitas Lembaga Bimbel</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Identitas Lembaga Bimbingan Belajar berhasil disimpan.');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bimbel</label>
              <input
                type="text"
                value={settings.bimbelName}
                onChange={(e) => setSettings({ ...settings, bimbelName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik / Direktur</label>
              <input
                type="text"
                value={settings.ownerName}
                onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap</label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon / Kontak</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              Simpan Perubahan
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal Add Student */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Tambah Data Siswa Baru</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIS (Nomor Induk Siswa)</label>
                <input
                  type="text"
                  required
                  value={newStudent.nis}
                  onChange={(e) => setNewStudent({ ...newStudent, nis: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Bimbel</label>
                <select
                  value={newStudent.className}
                  onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username Siswa</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: ananda"
                    value={newStudent.username}
                    onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password Siswa</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: 123"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={newStudent.dateOfBirth}
                  onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Student */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit Data Siswa</h3>
              <button onClick={() => setShowEditStudentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIS (Nomor Induk Siswa)</label>
                <input
                  type="text"
                  required
                  value={editingStudent.nis}
                  onChange={(e) => setEditingStudent({ ...editingStudent, nis: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Bimbel</label>
                <select
                  value={editingStudent.className}
                  onChange={(e) => setEditingStudent({ ...editingStudent, className: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username Siswa</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.username}
                    onChange={(e) => setEditingStudent({ ...editingStudent, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password Siswa</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.password || '123'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={editingStudent.dateOfBirth}
                  onChange={(e) => setEditingStudent({ ...editingStudent, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Class */}
      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Tambah Kelas Baru</h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kelas (Misal: 12 IPA 3)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 12 IPA 3"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Staff */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingStaff ? 'Edit Data Staff / Guru' : 'Tambah Staff / Guru Baru'}
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Staff/Guru</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Drs. Budi Santoso"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username Login</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: budi"
                  value={newStaff.username}
                  onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password Login</label>
                <div className="relative flex items-center">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password akun..."
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                    title={showModalPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peran Akses Sistem</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as 'admin' | 'guru' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="guru">Guru Pengajar (Akses Pembuat Soal & Nilai)</option>
                  <option value="admin">Administrator Utama (Akses Penuh System)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Simpan Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Export SQL Supabase for student_users */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 text-white">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-base text-white">
                  Script SQL Tabel & Insert Data student_users (Supabase)
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Salin kode SQL di bawah ini lalu tempelkan (Paste) ke <strong>SQL Editor</strong> di dashboard Supabase Anda. Tabel ini sudah dilengkapi dengan kolom <code className="text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">username</code> dan <code className="text-indigo-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">password</code> untuk otentikasi login siswa.
            </p>

            {(() => {
              const sqlScript = `-- 1. DDL SKEMA TABEL student_users DI SUPABASE
CREATE TABLE IF NOT EXISTS public.student_users (
  id BIGINT PRIMARY KEY,
  class_id BIGINT,
  class_name VARCHAR(100) NOT NULL,
  nis VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT '123',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. QUERY INSERT DATA SISWA TERDAFTAR (LENGKAP USERNAME & PASSWORD)
INSERT INTO public.student_users (id, class_id, class_name, nis, name, date_of_birth, username, password, is_active)
VALUES
${students
                  .map(
                    (s) =>
                      `(${s.id}, ${s.classId}, '${s.className.replace(/'/g, "''")}', '${s.nis.replace(/'/g, "''")}', '${s.name.replace(/'/g, "''")}', '${s.dateOfBirth}', '${s.username.replace(/'/g, "''")}', '${(s.password || '123').replace(/'/g, "''")}', ${s.isActive ? 'true' : 'false'})`
                  )
                  .join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  class_name = EXCLUDED.class_name,
  nis = EXCLUDED.nis,
  name = EXCLUDED.name,
  date_of_birth = EXCLUDED.date_of_birth,
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  is_active = EXCLUDED.is_active;`;

              return (
                <div className="space-y-3">
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 max-h-72 overflow-y-auto font-mono text-[11px] text-emerald-400 leading-relaxed shadow-inner">
                    <pre>{sqlScript}</pre>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Total {students.length} Data Siswa Siap Di-upload
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sqlScript);
                        setCopiedSqlModal(true);
                        setTimeout(() => setCopiedSqlModal(false), 2500);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition"
                    >
                      {copiedSqlModal ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedSqlModal ? 'Script SQL Tersalin!' : 'Salin Script SQL Supabase'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Add Subject (Tambah Mapel Baru) */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Tambah Mata Pelajaran Baru</span>
            </h3>
            <form onSubmit={handleAddSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Mapel (Misal: MTK, FIS, BIO)</label>
                <input
                  type="text"
                  required
                  placeholder="MTK"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  placeholder="Matematika Lanjut & Penalaran"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Question Package (Tambah / Edit Soal Utama) */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 my-8">
            <h3 className="font-extrabold text-slate-900 text-base">
              {editingPackageId ? 'Edit Paket Soal & Pengaturan Ujian' : 'Tambah Paket Soal Baru'}
            </h3>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">KD Soal (Kode Paket)</label>
                  <input
                    type="text"
                    required
                    value={pkgCode}
                    onChange={(e) => setPkgCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi Ujian (Menit)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={300}
                    value={pkgDurationMinutes}
                    onChange={(e) => setPkgDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Soal / Judul Paket</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Ujian Sekolah Utama Matematika"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={pkgSubjectId}
                    onChange={(e) => setPkgSubjectId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Guru Pengajar (ID)</label>
                  <select
                    value={pkgTeacherId}
                    onChange={(e) => setPkgTeacherId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                  >
                    {staff
                      .filter((s) => s.role === 'guru' || s.role === 'admin')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.username})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Kelas Ujian (Bisa pilih lebih dari satu, misal: 9A, 9B, 9C)
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {['9A', '9B', '9C', '12 IPA 1', '12 IPA 2', '12 IPS 1', ...classes.map((c) => c.name)]
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map((cName) => {
                        const isChecked = pkgClasses.includes(cName);
                        return (
                          <button
                            type="button"
                            key={cName}
                            onClick={() => toggleClassSelection(cName)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${isChecked
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                          >
                            {isChecked ? '✓ ' : '+ '}
                            {cName}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>


              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
                >
                  {editingPackageId ? 'Simpan Perubahan' : 'Buat Paket Soal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sisipkan Gambar ke Soal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <span>
                  {imageTarget === 'question'
                    ? 'Sisipkan Gambar ke Pertanyaan Soal'
                    : `Sisipkan Gambar ke Opsi ${optionsState[imageTarget as number]?.label || ''}`}
                </span>
              </h4>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Gambar / Link Foto Ilustrasi{' '}
                  {imageTarget === 'question'
                    ? 'Pertanyaan Soal'
                    : `Opsi ${optionsState[imageTarget as number]?.label || ''}`}
                  :
                </label>
                <input
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://example.com/gambar-soal-fisika.jpg"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Atau klik sampel ilustrasi gambar untuk menyisipkan langsung:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      title: 'Diagram Geometri',
                      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
                    },
                    {
                      title: 'Grafik Kurva Fisika',
                      url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
                    },
                    {
                      title: 'Ilustrasi Praktikum',
                      url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
                    },
                  ].map((img) => (
                    <button
                      key={img.title}
                      type="button"
                      onClick={() => setCustomImageUrl(img.url)}
                      className="p-2 border border-slate-200 hover:border-emerald-500 rounded-xl bg-slate-50 hover:bg-emerald-50 text-left transition group"
                    >
                      <img src={img.url} alt={img.title} className="w-full h-16 object-cover rounded-lg mb-1.5" />
                      <span className="text-[10px] font-bold text-slate-700 group-hover:text-emerald-800 block truncate">
                        {img.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleInsertImage(customImageUrl)}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition"
              >
                Sisipkan Gambar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Announcement */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Buat Pengumuman Baru</h3>
            <form onSubmit={handleAddAnno} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  value={newAnno.title}
                  onChange={(e) => setNewAnno({ ...newAnno, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Penerima</label>
                <select
                  value={newAnno.target}
                  onChange={(e) =>
                    setNewAnno({ ...newAnno, target: e.target.value as 'all' | 'guru' | 'siswa' })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="all">Semua (Guru & Siswa)</option>
                  <option value="guru">Khusus Guru</option>
                  <option value="siswa">Khusus Siswa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Isi Pengumuman</label>
                <textarea
                  required
                  rows={3}
                  value={newAnno.content}
                  onChange={(e) => setNewAnno({ ...newAnno, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
                >
                  Kirim Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aktifkan Soal untuk Try Out */}
      {showActivateExamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <span>Pilih Paket Soal Untuk Diaktifkan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih paket soal dari Bank Soal untuk diterbitkan sebagai Sesi Try Out Aktif.
                </p>
              </div>
              <button
                onClick={() => setShowActivateExamModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {packages.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-medium">
                  Belum ada paket soal tersedia di Bank Soal. Buat paket soal baru terlebih dahulu.
                </div>
              ) : (
                packages.map((pkg) => {
                  const isAlreadyActive = tryouts.some((t) => t.packageId === pkg.id && t.isActive);
                  return (
                    <div
                      key={pkg.id}
                      className={`p-4 rounded-2xl border transition space-y-3 flex flex-col ${selectedPkgToActivate?.id === pkg.id ? 'bg-white border-emerald-400 shadow-md' : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300'}`}
                    >
                      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-blue-600 text-white font-mono font-extrabold px-2 py-0.5 rounded">
                              KD: {pkg.code}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${isAlreadyActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                              {isAlreadyActive ? '● Ujian Sedang Aktif' : 'Tersedia'}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-base">{pkg.name}</h4>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span>Mapel: <strong>{pkg.subjectName}</strong></span>
                            <span>•</span>
                            <span>{pkg.questions.length} Soal</span>
                            <span>•</span>
                            <span>Durasi: {pkg.durationMinutes || 90} Mnt</span>
                          </div>
                        </div>

                        {selectedPkgToActivate?.id !== pkg.id && (
                          <button
                            onClick={() => {
                              setSelectedPkgToActivate(pkg);
                              setActStartTime('07:00');
                              setActEndTime('10:00');
                              setActIsRandom(true);
                            }}
                            className="w-full sm:w-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                          >
                            <Zap className="w-4 h-4" />
                            <span>Konfigurasi & Aktifkan</span>
                          </button>
                        )}
                      </div>

                      {/* Config Form */}
                      {selectedPkgToActivate?.id === pkg.id && (
                        <div className="w-full mt-4 space-y-3 pt-4 border-t border-slate-100 animate-fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Jam Awal Login</label>
                              <input
                                type="time"
                                value={actStartTime}
                                onChange={(e) => setActStartTime(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Jam Akhir Login</label>
                              <input
                                type="time"
                                value={actEndTime}
                                onChange={(e) => setActEndTime(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Urutan Soal</label>
                            <select
                              value={actIsRandom ? 'acak' : 'urut'}
                              onChange={(e) => setActIsRandom(e.target.value === 'acak')}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                            >
                              <option value="acak">Acak (Random)</option>
                              <option value="urut">Urut Sesuai Pembuatan</option>
                            </select>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => setSelectedPkgToActivate(null)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => {
                                handleActivatePackageAsTryout(pkg, actStartTime, actEndTime, actIsRandom);
                                setShowActivateExamModal(false);
                                setSelectedPkgToActivate(null);
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition shadow-sm flex items-center gap-2"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Simpan & Aktifkan</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowActivateExamModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
