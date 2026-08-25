import React, { useState, useEffect } from 'react';
import { LogOut, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import {
  getStudentsFromSupabase,
  upsertStudentToSupabase,
  getClassesFromSupabase,
  upsertClassToSupabase,
  getStaffFromSupabase,
  upsertStaffToSupabase,
  getPackagesFromSupabase,
  getPackagesFromGolang,
  getSubjectsFromGolang,
  getSubjectsFromSupabase,
  getTryoutsFromSupabase,
  upsertTryoutToSupabase,
  getAnnouncementsFromSupabase,
  upsertAnnouncementToSupabase,
  getSettingsFromSupabase,
  upsertSettingsToSupabase,
  getScoresFromSupabase,
  upsertScoreToSupabase,
  getSessionsFromSupabase,
  upsertSessionToSupabase,
  updateSessionStatusInSupabase,
  resetSessionInSupabase,
  getBimbelSettingsFromGolang,
  getBimbelSettingsFromSupabase,
  updateBimbelSettingsInGolang,
  updateBimbelSettingsInSupabase,
  getAnnouncementsFromGolang,
  createAnnouncementInGolang,
  deleteAnnouncementInGolang,
} from './lib/supabaseService';

import {
  UserRole,
  Settings,
  ClassItem,
  StaffUser,
  StudentUser,
  SubjectItem,
  QuestionPackage,
  TryoutItem,
  ExamSession,
  AnnouncementItem,
  ExamScoreRecord,
  PrintState
} from './types';
const defaultSettings: Settings = {
  bimbelName: 'HIPO',
  ownerName: 'Load Data...',
  address: ' ',
  phone: ' ',
};

import { TopHeader } from './components/TopHeader';
import { LeftSidebar } from './components/LeftSidebar';
import { AdminPanel } from './components/AdminPanel';
import { TeacherPanel } from './components/TeacherPanel';
import { StudentDashboard } from './components/StudentDashboard';
import { SesiTryOutView } from './components/SesiTryOutView';
import { StudentScoreHistoryView } from './components/StudentScoreHistoryView';
import { StudentCBTExam } from './components/StudentCBTExam';
import { PrintableBeritaAcara } from './components/PrintableBeritaAcara';
import { PrintableQuestionPackage } from './components/PrintableQuestionPackage';
import { PrintableExamResult } from './components/PrintableExamResult';
import { LoginPage } from './components/LoginPage';
import 'katex/dist/katex.css';

const readPersistedState = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

const readSessionState = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;

  try {
    const saved = window.sessionStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  // Helper to check if current URL is intended for staff panel
  const isPanelPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.includes('/panel') || path.includes('/admin') || hash.includes('panel') || hash.includes('admin');
  };

  // Tambahkan di deretan useState App.tsx
  const [currentUser, setCurrentUser] = useState<StaffUser | StudentUser | null>(() =>
    readSessionState('tryout_current_user', null)
  );

  // Tambahkan useEffect untuk simpan session user
  useEffect(() => {
    window.sessionStorage.setItem('tryout_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // App Global State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => readSessionState('tryout_is_logged_in', false));
  const [loginPortal, setLoginPortal] = useState<'siswa' | 'staff'>(() => (isPanelPath() ? 'staff' : 'siswa'));
  const [currentRole, setCurrentRole] = useState<UserRole | null>(() => readSessionState('tryout_current_role', null));

  useEffect(() => {
    window.sessionStorage.setItem('tryout_is_logged_in', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    window.sessionStorage.setItem('tryout_current_role', JSON.stringify(currentRole));
  }, [currentRole]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [classes, setClasses] = useState<ClassItem[]>(() => readPersistedState<ClassItem[]>('tryout_classes', []));
  const [staff, setStaff] = useState<StaffUser[]>(() => readPersistedState<StaffUser[]>('tryout_staff', []));
  const [students, setStudents] = useState<StudentUser[]>(() => readPersistedState<StudentUser[]>('tryout_students', []));
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [packages, setPackages] = useState<QuestionPackage[]>([]);
  const [tryouts, setTryouts] = useState<TryoutItem[]>([]);

  const [scores, setScores] = useState<ExamScoreRecord[]>(() => readPersistedState<ExamScoreRecord[]>('tryout_scores', []));
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [finishedExamMessage, setFinishedExamMessage] = useState<string | null>(null);

  // Sync URL route (/panel vs /)
  useEffect(() => {
    const handleUrlChange = () => {
      if (isPanelPath()) {
        setLoginPortal('staff');
      } else {
        setLoginPortal('siswa');
      }
    };
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem('tryout_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    window.localStorage.setItem('tryout_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    window.localStorage.setItem('tryout_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    window.localStorage.setItem('tryout_scores', JSON.stringify(scores));
  }, [scores]);

  // Removed duplicate useEffect

  // Sync state across browser tabs for live monitoring
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tryout_scores' && e.newValue) {
        try { setScores(JSON.parse(e.newValue)); } catch { }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Sync Supabase Data on Mount
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        const sbStudents = await getStudentsFromSupabase();
        if (sbStudents) setStudents(sbStudents);

        const sbClasses = await getClassesFromSupabase();
        if (sbClasses) setClasses(sbClasses);

        const sbStaff = await getStaffFromSupabase();
        if (sbStaff) setStaff(sbStaff);

        let sbSubjects = await getSubjectsFromGolang();
        if (!sbSubjects || sbSubjects.length === 0) {
          sbSubjects = await getSubjectsFromSupabase();
        }
        if (sbSubjects) setSubjects(sbSubjects);

        let sbPackages = await getPackagesFromGolang();
        if (!sbPackages || sbPackages.length === 0) {
          sbPackages = await getPackagesFromSupabase();
        }
        if (sbPackages) {
          setPackages(sbPackages);
        }

        const sbTryouts = await getTryoutsFromSupabase();
        if (sbTryouts) {
          setTryouts(sbTryouts);
          const activeTryout = sbTryouts.find((t: any) => t.isActive);
          if (activeTryout && activeTryout.token) {
            setCurrentToken(activeTryout.token);
          }
        }

        const sbAnnouncements = await getAnnouncementsFromGolang();
        if (sbAnnouncements) {
          setAnnouncements(sbAnnouncements.map((anno: any) => ({
            id: anno.id,
            title: anno.title,
            content: anno.content,
            target: (!anno.target || anno.target === 'Semua Kelas' || anno.target === 'all') ? 'all' : anno.target,
            authorName: anno.author_name || 'Admin',
            date: anno.date,
          })));
        }

        let sbSettings = await getBimbelSettingsFromGolang();
        if (!sbSettings) {
          sbSettings = await getBimbelSettingsFromSupabase();
        }
        if (sbSettings) {
          setSettings({
            bimbelName: sbSettings.bimbel_name || 'Hipotenusa',
            ownerName: sbSettings.owner_name || '',
            address: sbSettings.address || '',
            phone: sbSettings.phone || '',
          });
        }

        const sbScores = await getScoresFromSupabase();
        if (sbScores) setScores(sbScores);

        const sbSessions = await getSessionsFromSupabase();
        if (sbSessions) setSessions(sbSessions);
      } catch (err) {
        console.error('loadSupabaseData error:', err);
      }
    }
    loadSupabaseData();
  }, []);

  // Poll sessions periodically for live updates (Live Monitoring)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoggedIn) {
      interval = setInterval(async () => {
        try {
          const sbSessions = await getSessionsFromSupabase();
          if (sbSessions) {
            setSessions(sbSessions);
          }
        } catch (err) {
          // Silent catch for background polling
        }
      }, 5000); // 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoggedIn]);

  const handleSetStudents = (action: React.SetStateAction<StudentUser[]>) => {
    setStudents((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      window.localStorage.setItem('tryout_students', JSON.stringify(next));
      return next;
    });
  };

  const handleSetClasses = (action: React.SetStateAction<ClassItem[]>) => {
    setClasses((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      window.localStorage.setItem('tryout_classes', JSON.stringify(next));
      return next;
    });
  };

  const handleSetStaff = (action: React.SetStateAction<StaffUser[]>) => {
    setStaff((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      window.localStorage.setItem('tryout_staff', JSON.stringify(next));
      return next;
    });
  };

  const handleSetTryouts = (action: React.SetStateAction<TryoutItem[]>) => {
    setTryouts((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      return next;
    });
  };

  const handleSetAnnouncements = (action: React.SetStateAction<AnnouncementItem[]>) => {
    setAnnouncements((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      return next;
    });
  };

  const handleSetSettings = (action: React.SetStateAction<Settings>) => {
    setSettings((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const newSettings = {
        bimbel_name: next.bimbelName,
        owner_name: next.ownerName,
        address: next.address,
        phone: next.phone,
      };

      updateBimbelSettingsInGolang(newSettings).then(ok => {
        if (!ok) {
          updateBimbelSettingsInSupabase(newSettings);
        }
      }).catch(() => {
        updateBimbelSettingsInSupabase(newSettings);
      });

      return next;
    });
  };

  const handleSetSessions = (action: React.SetStateAction<ExamSession[]>) => {
    setSessions((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      window.localStorage.setItem('tryout_sessions', JSON.stringify(next));
      return next;
    });
  };

  const handleSetScores = (action: React.SetStateAction<ExamScoreRecord[]>) => {
    setScores((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      window.localStorage.setItem('tryout_scores', JSON.stringify(next));
      return next;
    });
  };

  // Sub-navigation active tab state for each role
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [guruTab, setGuruTab] = useState<string>('dashboard');
  const [siswaTab, setSiswaTab] = useState<string>('dashboard');

  const currentActiveTab =
    currentRole === 'admin'
      ? adminTab
      : currentRole === 'guru'
        ? guruTab
        : siswaTab;

  const setCurrentActiveTab = (tab: string) => {
    if (currentRole === 'admin') setAdminTab(tab);
    else if (currentRole === 'guru') setGuruTab(tab);
    else setSiswaTab(tab);
  };

  // Active 5-digit Token state
  const [currentToken, setCurrentToken] = useState<string>('AX982');

  // Active CBT Exam session state
  const [activeExamTryout, setActiveExamTryout] = useState<TryoutItem | null>(null);

  // Printable View toggle
  const [printState, setPrintState] = useState<PrintState>(null);

  // Logout Modal and Toast state
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [logoutNotification, setLogoutNotification] = useState<string | null>(null);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setActiveExamTryout(null);
    setAdminTab('dashboard');
    setGuruTab('dashboard');
    setSiswaTab('dashboard');

    const targetPortal = currentRole === 'siswa' ? 'siswa' : 'staff';
    setLoginPortal(targetPortal);
    setIsLoggedIn(false);
    setCurrentUser(null);

    window.sessionStorage.removeItem('tryout_current_user');
    window.sessionStorage.removeItem('tryout_is_logged_in');
    window.sessionStorage.removeItem('tryout_current_role');

    setLogoutNotification(
      `Anda telah berhasil keluar dari ${targetPortal === 'siswa' ? 'Portal Siswa' : 'Portal Staff'}.`
    );

    // Automatically hide notification after 6 seconds
    setTimeout(() => {
      setLogoutNotification(null);
    }, 6000);
  };

  // Refresh Token Handler
  const handleRefreshToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newToken = '';
    for (let i = 0; i < 5; i++) {
      newToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCurrentToken(newToken);
    handleSetTryouts((prev) => {
      const updatedTryouts = prev.map((t) => ({ ...t, token: newToken }));
      // Sync the new token to database only for active tryouts
      updatedTryouts.forEach((t) => {
        if (t.isActive) {
          upsertTryoutToSupabase(t).catch((err) => console.warn('Failed to auto-update token for active tryout in DB', err));
        }
      });
      return updatedTryouts;
    });
  };

  const activeStudentUser: StudentUser = (currentUser && 'nis' in currentUser)
    ? (currentUser as StudentUser)
    : (students && students.length > 0 ? students[0] : {
      id: 1,
      classId: 1,
      className: '12 IPA 1',
      nis: '2026001',
      name: 'Siswa Bimbel',
      dateOfBirth: '2006-01-01',
      username: 'siswa',
      isActive: true,
    });

  // Start CBT Exam
  const handleStartExam = (tryout: TryoutItem) => {
    const activeStudent = activeStudentUser;
    const existingSession = sessions.find((s) => s.studentId === activeStudent.id && s.tryoutId === tryout.id);

    // Jangan izinkan masuk jika sudah selesai
    if (existingSession && existingSession.status === 'finished') {
      alert('Anda sudah menyelesaikan try out ini. Hubungi Admin jika ada kendala.');
      return;
    }

    setActiveExamTryout(tryout);
    if (!existingSession) {
      const newSession: ExamSession = {
        id: Date.now(),
        studentId: activeStudent.id,
        studentName: activeStudent.name,
        studentNis: activeStudent.nis,
        className: activeStudent.className,
        tryoutId: tryout.id,
        tryoutTitle: tryout.title,
        startTime: new Date().toISOString(),
        status: 'active',
        finalScore: 0,
        violationsCount: 0,
      };
      handleSetSessions((prev) => [newSession, ...prev]);
      upsertSessionToSupabase(newSession).catch((err) => console.warn('Failed to insert new session to DB', err));
    } else if (existingSession.status !== 'active') {
      const updatedSession = { ...existingSession, status: 'active' as const, violationsCount: 0 };
      handleSetSessions((prev) =>
        prev.map((s) => (s.id === existingSession.id ? updatedSession : s))
      );
      upsertSessionToSupabase(updatedSession).catch((err) => console.warn('Failed to update session status in DB', err));
    }
  };

  // Finish CBT Exam
  const handleFinishExam = (scoreObtained: number, totalCorrect: number, totalWrong: number, finalAnswers: any) => {
    const activeStudent = activeStudentUser;
    const now = new Date().toISOString();

    // Konversi jawaban menjadi array untuk penyimpanan DB dan sertakan tfAnswers
    const answersArray = finalAnswers && finalAnswers.answers
      ? Object.values(finalAnswers.answers).map((ans: any) => ({
        ...ans,
        tfAnswers: finalAnswers.tfAnswers ? finalAnswers.tfAnswers[ans.questionId] : undefined,
      }))
      : [];

    const newScore: ExamScoreRecord = {
      id: Date.now(),
      studentNis: activeStudent.nis,
      studentName: activeStudent.name,
      className: activeStudent.className,
      subjectName: activeExamTryout ? activeExamTryout.title : 'Mata Pelajaran UTBK',
      tryoutTitle: activeExamTryout ? activeExamTryout.title : 'Try Out Akbar SNBT 2026',
      finalScore: scoreObtained,
      totalCorrect,
      totalWrong,
      date: new Date().toLocaleDateString('id-ID'),
      answers: answersArray, // Menyertakan riwayat jawaban
    };

    // 1. Cari session yang akan di-finish SEBELUM masuk state updater
    const currentSession = sessions.find(
      (s) => s.studentId === activeStudent.id && (!activeExamTryout || s.tryoutId === activeExamTryout?.id)
    );

    const finishedSession: ExamSession | null = currentSession
      ? {
        ...currentSession,
        status: 'finished',
        finalScore: scoreObtained,
        answers: answersArray as any,
        endTime: now,
      }
      : null;

    // 2. Update state UI (pure — tidak ada DB call di sini)
    handleSetScores((prev) => [newScore, ...prev]);
    if (finishedSession) {
      handleSetSessions((prev) =>
        prev.map((s) =>
          s.studentId === activeStudent.id && (!activeExamTryout || s.tryoutId === activeExamTryout?.id)
            ? finishedSession
            : s
        )
      );
    }

    // 3. Kirim ke DB SEKALI, di luar state updater
    upsertScoreToSupabase(newScore).catch((err) => console.warn('Failed to save score to DB', err));

    if (finishedSession) {
      updateSessionStatusInSupabase(
        finishedSession.id, 'finished', now, scoreObtained, answersArray
      ).catch((err) => console.warn('Failed to save finished session to DB', err));

      // Notify Golang backend
      const token = window.localStorage.getItem('tryout_student_token') || '';
      fetch('/api/v1/student/exam/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ session_id: finishedSession.id, final_score: scoreObtained })
      }).catch(err => console.warn('Failed to call finish API:', err));
    }

    setActiveExamTryout(null);
    setCurrentRole('siswa');
    setFinishedExamMessage('Ujian sudah Selesai atau Ujian Sudah Diselesaikan Admin dan Nilaimu Sudah Masuk.');
  };

  if (printState) {
    if (printState.type === 'beritaAcara') {
      return (
        <PrintableBeritaAcara
          settings={settings}
          sessions={sessions}
          onClose={() => setPrintState(null)}
        />
      );
    }
    if (printState.type === 'package') {
      return (
        <PrintableQuestionPackage
          settings={settings}
          pkg={printState.pkg}
          onClose={() => setPrintState(null)}
        />
      );
    }
    if (printState.type === 'examResult') {
      return (
        <PrintableExamResult
          settings={settings}
          score={printState.score}
          reviewPackage={printState.reviewPackage}
          onClose={() => setPrintState(null)}
        />
      );
    }
  }

  if (finishedExamMessage) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-3xl max-w-lg w-full text-center shadow-xl border border-slate-200">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">Ujian Selesai!</h2>
          <p className="text-slate-600 text-lg mb-8 leading-relaxed">
            {finishedExamMessage}
          </p>
          <button
            onClick={() => {
              setFinishedExamMessage(null);
              setSiswaTab('hasil');
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 active:translate-y-0"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (activeExamTryout) {
    const pkg = packages.find((p) => p.id === activeExamTryout.packageId) || packages[0];
    // Gunakan token spesifik tryout dari database, bukan global token admin
    const examToken = activeExamTryout.token && activeExamTryout.token.trim() !== '' ? activeExamTryout.token : currentToken;
    const currentSession = sessions.find((s) => s.studentId === activeStudentUser.id && s.tryoutId === activeExamTryout.id);

    return (
      <StudentCBTExam
        tryout={activeExamTryout}
        pkg={pkg}
        currentStudent={activeStudentUser}
        currentToken={examToken}
        session={currentSession}
        onUpdateSession={(updatedSession) => {
          handleSetSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
          upsertSessionToSupabase(updatedSession).catch(console.warn);
        }}
        onCancel={() => setActiveExamTryout(null)}
        onFinish={handleFinishExam}
        onForceStoppedByAdmin={() => {
          setActiveExamTryout(null);
          setCurrentRole('siswa');
          setFinishedExamMessage('Ujian Sudah Diselesaikan Admin dan Nilaimu Sudah Masuk.');
        }}
      />
    );
  }

  // Login Page View when user is logged out
  if (!isLoggedIn || !currentRole) {
    return (
      <LoginPage
        settings={settings}
        students={students}
        staff={staff}
        initialPortal={loginPortal}
        onLogin={(role, studentData, staffData) => {
          setCurrentRole(role);
          // Simpan data user yang login berdasarkan rolenya
          if (role === 'siswa') {
            setCurrentUser(studentData || null);
          } else {
            setCurrentUser(staffData || null);
          }
          setIsLoggedIn(true);
          setAdminTab('dashboard');
          setGuruTab('dashboard');
          setSiswaTab('dashboard');
        }}
        notificationMessage={logoutNotification}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Header */}
      <TopHeader
        currentRole={currentRole as UserRole}
        settings={settings}
        currentToken={currentToken}
        onRefreshToken={handleRefreshToken}
        onPrintBeritaAcara={() => setPrintState({ type: 'beritaAcara' })}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* Logout Banner Toast Notification */}
      {logoutNotification && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 shadow-lg border-b border-emerald-500 flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{logoutNotification}</span>
          </div>
          <button
            onClick={() => setLogoutNotification(null)}
            className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PORTAL STAFF (ADMIN & GURU) */}
      {(currentRole === 'admin' || currentRole === 'guru') && (
        <div className="flex flex-1 flex-col md:flex-row min-h-[calc(100vh-4rem)]">
          {/* Left Sub-Menu Sidebar for Staff */}
          <LeftSidebar
            currentRole={currentRole}
            activeTab={currentActiveTab}
            setActiveTab={setCurrentActiveTab}
            currentToken={currentToken}
          />

          {/* Main Staff Content Area */}
          <main className="flex-1 pb-12 min-w-0 bg-slate-100 overflow-y-auto">
            {/* Staff Dashboard Header Bar */}
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${currentRole === 'admin'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                  }`}>
                  {currentRole === 'admin' ? 'HALAMAN PORTAL ADMIN' : 'HALAMAN PORTAL GURU'}
                </span>

                <span className="text-xs text-slate-300 font-bold hidden sm:inline">
                  Selamat Datang, <span className="text-white">{currentUser?.name || 'Administrator'}</span>
                </span>

              </div>
            </div>

            {/* Admin Panel View */}
            {currentRole === 'admin' && (
              <AdminPanel
                settings={settings}
                setSettings={handleSetSettings}
                classes={classes}
                setClasses={handleSetClasses}
                students={students}
                setStudents={handleSetStudents}
                staff={staff}
                setStaff={handleSetStaff}
                subjects={subjects}
                setSubjects={setSubjects}
                packages={packages}
                setPackages={setPackages}
                tryouts={tryouts}
                setTryouts={handleSetTryouts}
                sessions={sessions}
                setSessions={handleSetSessions}
                announcements={announcements}
                setAnnouncements={handleSetAnnouncements}
                scores={scores}
                setScores={handleSetScores}
                currentToken={currentToken}
                onRefreshToken={handleRefreshToken}
                onOpenPrint={setPrintState}
                activeTab={adminTab}
                setActiveTab={setAdminTab}
              />
            )}

            {/* Teacher Panel View */}
            {currentRole === 'guru' && (
              <TeacherPanel
                currentUser={currentUser as StaffUser}
                students={students}
                packages={packages}
                setPackages={setPackages}
                announcements={announcements}
                scores={scores}
                activeTab={guruTab}
                setActiveTab={setGuruTab}
              />
            )}
          </main>
        </div>
      )}

      {/* PAGE 2: PORTAL SISWA (WITH LEFT SIDEBAR MENU) */}
      {currentRole === 'siswa' && (
        <div className="flex flex-1 flex-col md:flex-row min-h-[calc(100vh-4rem)]">
          {/* Left Sub-Menu Sidebar for Student */}
          <LeftSidebar
            currentRole={currentRole}
            activeTab={siswaTab}
            setActiveTab={setSiswaTab}
            currentToken={currentToken}
          />

          {/* Main Student Content Area */}
          <main className="flex-1 pb-12 min-w-0 bg-slate-50 overflow-y-auto">
            {/* Student Info Top Banner */}
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center font-black text-orange-300 text-xs">
                  {activeStudentUser.name ? activeStudentUser.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{activeStudentUser.name}</span>
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-400/30 px-2 py-0.5 rounded-full font-bold">
                      {activeStudentUser.className}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">NIS: <span className="font-mono">{activeStudentUser.nis}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 px-2.5 py-1 rounded-lg border border-orange-400/30">
                  PORTAL SISWA CBT
                </span>
              </div>
            </div>

            {siswaTab === 'dashboard' && (
              <StudentDashboard
                currentStudent={activeStudentUser}
                tryouts={tryouts}
                announcements={announcements}
                scores={scores}
                currentToken={currentToken}
                onStartExam={handleStartExam}
                activeTab={siswaTab}
                setActiveTab={setSiswaTab}
              />
            )}

            {siswaTab === 'tryout' && (
              <SesiTryOutView
                currentStudent={activeStudentUser}
                tryouts={tryouts}
                packages={packages}
                currentToken={currentToken}
                sessions={sessions}
                onStartExam={handleStartExam}
              />
            )}

            {siswaTab === 'hasil' && (
              <StudentScoreHistoryView
                currentStudent={activeStudentUser}
                scores={scores}
                packages={packages}
                tryouts={tryouts}
              />
            )}
          </main>
        </div>
      )}

      {/* MODAL KONFIRMASI LOGOUT SISTEM */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>

            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">Konfirmasi Log Out</h3>
                  <p className="text-xs text-slate-400 font-medium">Sistem CBT {settings.bimbelName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Apakah Anda yakin ingin keluar dari <span className="font-bold text-white uppercase">{currentRole === 'siswa' ? 'Portal Siswa CBT' : `Portal Staff (${currentRole.toUpperCase()})`}</span>?
              </p>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Sesi kerja Anda akan diakhiri secara aman.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 border border-red-400/30 transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Ya, Keluar Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
