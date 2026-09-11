import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TryoutItem, QuestionPackage, StudentAnswer, StudentUser, ExamSession } from '../types';
import { upsertSessionToSupabase, recordSessionViolation, blockExamSession } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import { KaTeXRenderer } from './KaTeXRenderer';
import { calculateTrueFalseScore, calculateTotalExamScore } from '../lib/scoreCalculator';
import {
  Clock,
  CheckCircle2,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Send,
  HelpCircle,
  Grid,
  ShieldCheck,
  User,
  Calendar,
  KeyRound,
  Play,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  FileText,
  BookOpen,
  X,
} from 'lucide-react';

interface StudentCBTExamProps {
  tryout: TryoutItem;
  pkg: QuestionPackage;
  currentStudent: StudentUser;
  currentToken: string;
  session?: ExamSession;
  onUpdateSession?: (session: ExamSession) => void;
  onCancel: () => void;
  onFinish: (scoreObtained: number, totalCorrect: number, totalWrong: number, finalAnswers: any) => void;
  onForceStoppedByAdmin?: () => void;
}

export const StudentCBTExam: React.FC<StudentCBTExamProps> = ({
  tryout,
  pkg,
  currentStudent,
  currentToken,
  session,
  onUpdateSession,
  onCancel,
  onFinish,
  onForceStoppedByAdmin,
}) => {
  // Step state: 'confirm' (Halaman Konfirmasi Identitas) vs 'exam' (Halaman Pengerjaan Soal)
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Form states on Confirmation Page
  const [confirmName, setConfirmName] = useState(currentStudent.name);
  // Tanggal lahir dikosongkan agar siswa mengisi sendiri (verifikasi identitas)
  const [confirmDob, setConfirmDob] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [tokenError, setTokenError] = useState('');

  const questions = useMemo(() => {
    if (tryout.isRandomOrder) {
      const shuffled = [...pkg.questions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return pkg.questions;
  }, [pkg.questions, tryout.isRandomOrder]);

  const [currentIdx, setCurrentIdx] = useState(0);

  // Remaining time in seconds
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (session?.startTime && tryout?.durationMinutes) {
      const start = new Date(session.startTime).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000);
      const total = tryout.durationMinutes * 60;
      const left = total - elapsed;
      return left > 0 ? left : 0;
    }
    return tryout.durationMinutes * 60;
  });

  // Answers Map
  const [answers, setAnswers] = useState<Record<number, StudentAnswer>>(() => {
    if (session?.id) {
      const saved = window.localStorage.getItem(`cbt_answers_${session.id}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved answers');
        }
      }
    }

    const initial: Record<number, StudentAnswer> = {};

    // Inisialisasi struktur awal
    questions.forEach((q) => {
      initial[q.id] = { questionId: q.id, selectedOptionIds: [], isDoubtful: false };
    });

    // Timpa dengan data jawaban yang sudah ada di database (misal jika melanjutkan ujian setelah reset)
    if (session?.answers && Array.isArray(session.answers)) {
      session.answers.forEach((ans: any) => {
        if (ans && ans.questionId) {
          initial[ans.questionId] = {
            questionId: ans.questionId,
            selectedOptionIds: ans.selectedOptionIds || [],
            isDoubtful: ans.isDoubtful || false,
          };
        }
      });
    }

    return initial;
  });

  // True/False answers map: questionId -> statementOptionId -> 'benar' | 'salah'
  const [tfAnswers, setTfAnswers] = useState<Record<number, Record<number, 'benar' | 'salah'>>>(() => {
    if (session?.id) {
      const saved = window.localStorage.getItem(`cbt_tfanswers_${session.id}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved tfAnswers');
        }
      }
    }

    const initialTf: Record<number, Record<number, 'benar' | 'salah'>> = {};

    // Load jawaban B/S yang sebelumnya tersimpan (di-embed di dalam answersArray pada session.answers)
    if (session?.answers && Array.isArray(session.answers)) {
      session.answers.forEach((ans: any) => {
        if (ans && ans.questionId && ans.tfAnswers) {
          initialTf[ans.questionId] = ans.tfAnswers;
        }
      });
    }

    return initialTf;
  });

  // Effect untuk auto-save ke LocalStorage dan Broadcast Realtime
  useEffect(() => {
    if (!session?.id) return;

    // 1. Simpan ke LocalStorage
    window.localStorage.setItem(`cbt_answers_${session.id}`, JSON.stringify(answers));
    window.localStorage.setItem(`cbt_tfanswers_${session.id}`, JSON.stringify(tfAnswers));

    // 2. Hitung total soal terjawab
    let count = 0;
    questions.forEach((q) => {
      if (q.questionType === 'single_choice' || q.questionType === 'complex_choice' || q.questionType === 'graded_choice') {
        if (answers[q.id]?.selectedOptionIds?.length > 0) count++;
      } else if (q.questionType === 'true_false') {
        if (tfAnswers[q.id] && Object.keys(tfAnswers[q.id]).length > 0) count++;
      }
    });

    // 3. Pancarkan (Broadcast) progress ke Admin
    supabase.channel('exam_monitoring').send({
      type: 'broadcast',
      event: 'student_progress',
      payload: {
        sessionId: session.id,
        studentName: currentStudent.name,
        answeredCount: count,
      },
    }).catch(err => console.warn('Failed to broadcast progress', err));

  }, [answers, tfAnswers, session?.id, currentStudent.name, questions]);

  // Auto save indicator feedback
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Kiosk mode violation detection state
  const [violationCount, setViolationCount] = useState(0);
  const [showKioskWarning, setShowKioskWarning] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Popup modal for Seluruh Soal (Question Palette)
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // Track if exam has already been finished (prevent double-fire)
  const hasFinishedRef = useRef(false);

  // Timer countdown hook (Only active after confirmation & not blocked)
  useEffect(() => {
    if (!isConfirmed || isBlocked || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleForceFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isConfirmed, secondsLeft, isBlocked]);

  // Kiosk Mode Window Blur / Tab switch listener (Only active after confirmation)
  useEffect(() => {
    if (!isConfirmed) return;

    const handleWindowBlur = () => {
      if (isBlocked) return;
      setViolationCount((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          setIsBlocked(true);
          if (sessionRef.current) {
            blockExamSession(sessionRef.current.id, next).catch(console.error);
            onUpdateSession?.({ ...sessionRef.current, status: 'blocked', violationsCount: next });
          }
        } else {
          setShowKioskWarning(true);
          if (sessionRef.current) {
            recordSessionViolation(sessionRef.current.id, next).catch(console.error);
            onUpdateSession?.({ ...sessionRef.current, violationsCount: next });
          }
        }
        return next;
      });
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [isConfirmed, isBlocked]);

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // AutoSave Debounce Ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync Answers to Supabase Live when answers state changes
  useEffect(() => {
    if (isConfirmed && !isBlocked && sessionRef.current) {
      // Embed tfAnswers ke dalam setiap entry jawaban agar bisa di-recover saat paksa henti
      const answersArray = Object.values(answers).map((ans) => ({
        ...ans,
        // Sertakan jawaban benar/salah per pernyataan jika ada
        tfAnswers: tfAnswers[ans.questionId] ? tfAnswers[ans.questionId] : undefined,
      }));
      const updatedSession = { ...sessionRef.current, answers: answersArray };
      // Debounced API AutoSave and DB sync (Every 10 seconds)
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        // Pass the update to App.tsx so it syncs to Database (Supabase)
        if (onUpdateSession) {
          onUpdateSession(updatedSession);
        }

        const token = window.localStorage.getItem('tryout_student_token') || '';
        fetch('/api/v1/student/exam/autosave', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            session_id: updatedSession.id,
            answers: answersArray
          })
        }).catch(() => { }); // Ignore network errors in background
      }, 10000); // 10000 = 10 detik
    }

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    }
  }, [answers, tfAnswers, isConfirmed, isBlocked]); // tfAnswers drives answers state too

  // Watch localStorage for Admin force-stop signal (cross-tab communication)
  useEffect(() => {
    if (!isConfirmed || !session) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== 'tryout_sessions' || !e.newValue) return;
      try {
        const sessions: any[] = JSON.parse(e.newValue);
        const mySession = sessions.find(
          (s: any) => s.id === session.id || (s.studentId === session.studentId && s.tryoutId === session.tryoutId)
        );
        if (mySession && mySession.status === 'finished' && !hasFinishedRef.current) {
          hasFinishedRef.current = true;
          if (onForceStoppedByAdmin) {
            onForceStoppedByAdmin();
          } else {
            handleForceFinish();
          }
        }
      } catch { }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isConfirmed, session]);

  // Handle Admin Force Stop / Block from Backend (via prop polling)
  useEffect(() => {
    if (isConfirmed && session) {
      if (session.status === 'finished' && secondsLeft > 0 && !hasFinishedRef.current) {
        hasFinishedRef.current = true;
        if (onForceStoppedByAdmin) {
          onForceStoppedByAdmin();
        } else {
          handleForceFinish();
        }
      } else if (session.status === 'blocked' && !isBlocked) {
        setIsBlocked(true);
      } else if (session.status === 'active' && isBlocked) {
        setIsBlocked(false); // Reset allowed by Admin
        setViolationCount(0);
      }
    }
  }, [session?.status, isConfirmed, secondsLeft]);

  // Instant Supabase Realtime Listener for Force Stop
  useEffect(() => {
    if (!isConfirmed || !session) return;

    const channel = supabase
      .channel(`student_session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exam_sessions',
          filter: `id=eq.${session.id}`
        },
        (payload) => {
          const updatedRow = payload.new;
          if (updatedRow.status === 'finished' && secondsLeft > 0 && !hasFinishedRef.current) {
            hasFinishedRef.current = true;
            if (onForceStoppedByAdmin) {
              onForceStoppedByAdmin();
            } else {
              handleForceFinish();
            }
          } else if (updatedRow.status === 'blocked' && !isBlocked) {
            setIsBlocked(true);
          } else if (updatedRow.status === 'active' && isBlocked) {
            setIsBlocked(false);
            setViolationCount(0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isConfirmed, session, isBlocked, secondsLeft]);

  const currentQ = questions[currentIdx];
  const currentAns = answers[currentQ?.id] || { questionId: currentQ?.id, selectedOptionIds: [], isDoubtful: false };

  // Handle Token & Identity Confirmation Form Submission
  const handleConfirmIdentity = (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmName.trim()) {
      setTokenError('Nama lengkap wajib diisi untuk konfirmasi identitas.');
      return;
    }

    if (!confirmDob) {
      setTokenError('Tanggal lahir wajib diisi untuk konfirmasi identitas.');
      return;
    }

    if (!inputToken.trim()) {
      setTokenError('Masukkan 5 digit token resmi dari Admin/Tentor.');
      return;
    }

    // Verify token (case-insensitive)
    if (inputToken.trim().toUpperCase() !== currentToken.trim().toUpperCase()) {
      setTokenError(
        'Token yang Anda masukkan TIDAK VALID! Silakan tanyakan token 5 digit resmi ke Admin atau Tentor Pengawas.'
      );
      return;
    }

    // Success -> proceed to exam
    setTokenError('');
    setIsConfirmed(true);

    // Masuk fullscreen / kiosk mode otomatis saat ujian dimulai
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      }
    } catch {
      // Browser mungkin tidak mendukung fullscreen, lanjutkan saja
    }
  };

  // Option selection toggle with auto-save simulation
  const handleSelectOption = (optionId: number) => {
    if (isBlocked || !currentQ) return;
    setIsAutoSaving(true);

    setAnswers((prev) => {
      const existing = prev[currentQ.id];
      let updatedOptionIds: number[] = [];

      if (currentQ.questionType === 'single_choice' || currentQ.questionType === 'graded_choice') {
        updatedOptionIds = [optionId];
      } else {
        if (existing.selectedOptionIds.includes(optionId)) {
          updatedOptionIds = existing.selectedOptionIds.filter((id) => id !== optionId);
        } else {
          updatedOptionIds = [...existing.selectedOptionIds, optionId];
        }
      }

      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          selectedOptionIds: updatedOptionIds,
        },
      };
    });

    setTimeout(() => setIsAutoSaving(false), 300);
  };

  // Handler for True / False statement options (Right-aligned radio buttons)
  const handleSelectTrueFalse = (statementOptId: number, value: 'benar' | 'salah') => {
    if (isBlocked || !currentQ) return;
    setIsAutoSaving(true);

    setTfAnswers((prev) => {
      const qAnswers = prev[currentQ.id] || {};
      const updated = { ...qAnswers, [statementOptId]: value };

      // Sync answers state for palette tracking
      setAnswers((prevAns) => {
        const existing = prevAns[currentQ.id];
        const selectedOptionIds = Object.keys(updated).map(Number);
        return {
          ...prevAns,
          [currentQ.id]: {
            ...existing,
            selectedOptionIds,
          },
        };
      });

      return { ...prev, [currentQ.id]: updated };
    });

    setTimeout(() => setIsAutoSaving(false), 300);
  };

  // Toggle Doubtful
  const handleToggleDoubtful = () => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        isDoubtful: !prev[currentQ.id].isDoubtful,
      },
    }));
  };

  // Palette color getter
  const getPaletteClass = (qId: number, idx: number) => {
    const isCurrent = idx === currentIdx;
    const ans = answers[qId];
    const hasAnswer = ans && ans.selectedOptionIds.length > 0;
    const isDoubt = ans && ans.isDoubtful;

    let baseClass = '';

    if (isDoubt) {
      baseClass = 'bg-amber-500 text-white border-amber-600 font-extrabold shadow-sm';
    } else if (hasAnswer) {
      baseClass = 'bg-emerald-600 text-white border-emerald-700 font-extrabold shadow-sm';
    } else {
      baseClass = 'bg-slate-200 text-slate-700 border-slate-300 font-bold hover:bg-slate-300';
    }

    if (isCurrent) {
      return `${baseClass} ring-4 ring-blue-500 scale-105 z-10`;
    }

    return baseClass;
  };

  // Calculate scores on finish
  const handleForceFinish = () => {
    if (hasFinishedRef.current) return; // Already finished, prevent double-fire
    hasFinishedRef.current = true;

    // Bersihkan timeout autosave yang tertinggal
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Bersihkan LocalStorage
    if (session?.id) {
      window.localStorage.removeItem(`cbt_answers_${session.id}`);
      window.localStorage.removeItem(`cbt_tfanswers_${session.id}`);
    }

    const { totalObtained, correctCount, wrongCount } = calculateTotalExamScore(questions, answers, tfAnswers);

    onFinish(totalObtained, correctCount, wrongCount, { answers, tfAnswers });
  };

  // Time formatter
  const formattedTimer = useMemo(() => {
    const hours = Math.floor(secondsLeft / 3600);
    const m = Math.floor((secondsLeft % 3600) / 60);
    const s = secondsLeft % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [secondsLeft]);

  // ---------------------------------------------------------------------------
  // KIOSK BLOCKED VIEW
  // ---------------------------------------------------------------------------
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none">
        <div className="bg-slate-800 p-8 rounded-3xl max-w-md w-full border border-red-500/50 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/40 mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-red-400 mb-2">SESI UJIAN TERBLOKIR!</h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Sistem Keamanan Kiosk mendeteksi Anda keluar dari jendela/tab ujian sebanyak {violationCount} kali.
          </p>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed text-xs">
            Minta bantuan Admin / Pengawas Bimbel untuk melakukan <strong>'Reset Peserta'</strong> dari Dashboard Admin.
          </p>
          <button
            onClick={onCancel}
            className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-2xl transition transform hover:scale-[1.02] shadow-lg shadow-sky-900/50"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // PHASE 1: HALAMAN KONFIRMASI IDENTITAS PESERTA (FULLSCREEN KIOSK PAGE)
  // ---------------------------------------------------------------------------
  if (!isConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex flex-col justify-between font-sans select-none">
        {/* Fullscreen Kiosk Header Bar */}
        <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white uppercase">
                HALAMAN KONFIRMASI PESERTA CBT
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Sistem Ujian Kiosk Terkunci • Mode Anti-Curang
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Sesi Try Out</span>
          </button>
        </header>

        {/* Center Container: Form Konfirmasi Identitas */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white flex justify-between items-start">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Konfirmasi Identitas Peserta
                </span>
                <h2 className="text-xl sm:text-2xl font-black">{tryout.title}</h2>
                <p className="text-xs text-slate-300">
                  Lengkapi konfirmasi data diri & masukkan token 5 digit resmi dari Admin.
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleConfirmIdentity} className="p-6 space-y-5">
              {tokenError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{tokenError}</span>
                </div>
              )}

              {/* Information Summary Grid Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <p className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Rincian Sesi Ujian:</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    Mata Pelajaran: <strong className="text-slate-900">{pkg.subjectName}</strong>
                  </div>
                  <div>
                    Jumlah Soal: <strong className="text-slate-900">{questions.length} Soal</strong>
                  </div>
                  <div>
                    Durasi: <strong className="text-slate-900">{tryout.durationMinutes} Menit</strong>
                  </div>
                  <div>
                    Kelas Target: <strong className="text-slate-900">{currentStudent.className}</strong>
                  </div>
                </div>
              </div>

              {/* Confirm Nama */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Nama Lengkap Peserta Ujian</span>
                </label>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              {/* Confirm Tanggal Lahir */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Tanggal Lahir Peserta (Konfirmasi)</span>
                </label>
                <input
                  type="date"
                  value={confirmDob}
                  onChange={(e) => setConfirmDob(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              {/* Token Input Box */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <span>Masukkan Token 5 Digit Dari Admin / Tentor</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Wajib
                  </span>
                </label>
                <input
                  type="text"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                  placeholder="Contoh: AX982"
                  maxLength={5}
                  required
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-300 text-center font-mono text-2xl font-black tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50/50 uppercase placeholder:text-slate-300 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal"
                />
              </div>

              {/* Instructions Box */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-[11px] text-blue-900 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Sistem Kiosk Anti-Curang Aktif:</span>
                </p>
                <p className="leading-snug text-slate-600">
                  Layar ujian akan dikunci penuh. Dilarang berpindah tab browser, membuka aplikasi lain, atau mengambil screenshot selama pengerjaan.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-3 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Mulai Mengerjakan Ujian</span>
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="p-4 text-center text-xs text-slate-500 border-t border-slate-800/60">
          Sistem Ujian Kiosk CBT Bimbel Online • Hak Cipta Dilindungi
        </footer>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // PHASE 2: HALAMAN PENGERJAAN SOAL CBT (STANDARD TKA LIGHT BLUE SCREEN)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-blue-50/40 flex flex-col font-sans select-none text-slate-800">
      {/* Top Navbar Header - Dominan Putih & Biru Muda (Standar TKA) */}
      <header className="bg-white border-b border-blue-200/80 px-4 sm:px-6 py-3 flex justify-between items-center shadow-xs sticky top-0 z-30">
        {/* LEFT TOP: TIMER COUNTDOWN */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-blue-900 shadow-2xs">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold hidden sm:inline text-slate-600">Sisa Waktu:</span>
            <span className="text-base font-mono font-black text-blue-900 tracking-wider">
              {formattedTimer}
            </span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-xs font-extrabold text-slate-900 leading-tight">{tryout.title}</h1>
            <p className="text-[11px] text-slate-500 font-medium">Mapel: {pkg.subjectName}</p>
          </div>
        </div>

        {/* RIGHT TOP: SELURUH SOAL BUTTON, AUTO-SAVE & SUBMIT ACTION */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Button 'Seluruh Soal' in Top Right Header */}
          <button
            onClick={() => setShowQuestionModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-2 rounded-xl font-extrabold shadow-md shadow-blue-600/20 flex items-center gap-2 transition transform active:scale-95"
          >
            <Grid className="w-4 h-4" />
            <span>Seluruh Soal</span>
          </button>

          {isAutoSaving && (
            <span className="hidden sm:flex text-emerald-600 font-bold items-center gap-1 text-[11px] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" /> Auto-saved
            </span>
          )}

          <button
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin mengumpulkan dan menyelesaikan ujian ini?')) {
                handleForceFinish();
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Selesai Ujian</span>
            <span className="sm:hidden">Selesai</span>
          </button>
        </div>
      </header>

      {/* Main CBT Screen Container (Clean & Full Width) */}
      <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="bg-white rounded-3xl shadow-sm border border-blue-200/80 p-6 flex-1 flex flex-col justify-between">
          {currentQ ? (
            <div>
              <div className="flex justify-between items-center border-b border-blue-100 pb-3 mb-4">
                <span className="text-sm font-extrabold text-blue-900">
                  Soal Nomor {currentIdx + 1} dari {questions.length}
                </span>
                <span className="text-xs bg-blue-50 text-blue-800 font-extrabold px-3 py-1 rounded-full border border-blue-200">
                  {currentQ.typeLabel}
                </span>
              </div>

              {/* LaTeX Question Content Box */}
              <div className="p-5 bg-blue-50/30 rounded-2xl border border-blue-100 text-sm sm:text-base text-slate-800 leading-relaxed mb-6 font-medium">
                <KaTeXRenderer content={currentQ.content} />
              </div>

              {/* Options List / Statements Table */}
              {currentQ.questionType === 'true_false' ? (
                <div className="space-y-4">
                  <div className="overflow-hidden border border-blue-200/80 rounded-2xl bg-white shadow-2xs">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 bg-blue-50/80 px-4 sm:px-5 py-3 border-b border-blue-200/80 font-extrabold text-xs text-blue-950">
                      <div className="col-span-7 sm:col-span-8 flex items-center gap-2">
                        <span>Pernyataan / Kalimat Soal</span>
                      </div>
                      <div className="col-span-5 sm:col-span-4 text-center grid grid-cols-2 gap-1.5">
                        <span className="text-emerald-700 font-extrabold bg-emerald-50/90 py-1 rounded-lg border border-emerald-200/70">
                          Benar
                        </span>
                        <span className="text-red-700 font-extrabold bg-red-50/90 py-1 rounded-lg border border-red-200/70">
                          Salah
                        </span>
                      </div>
                    </div>

                    {/* Statement Rows */}
                    <div className="divide-y divide-blue-100">
                      {currentQ.options.map((opt, idx) => {
                        const val = tfAnswers[currentQ.id]?.[opt.id];
                        return (
                          <div
                            key={opt.id}
                            className="grid grid-cols-12 px-4 sm:px-5 py-4 items-center hover:bg-blue-50/30 transition gap-2"
                          >
                            <div className="col-span-7 sm:col-span-8 pr-2 flex items-start gap-2.5">

                              <div className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                                <KaTeXRenderer content={opt.optionText} inline />
                              </div>
                            </div>

                            <div className="col-span-5 sm:col-span-4 grid grid-cols-2 gap-1.5 text-center">
                              {/* Option BENAR */}
                              <button
                                type="button"
                                onClick={() => handleSelectTrueFalse(opt.id, 'benar')}
                                className={`py-2 px-2 sm:px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition ${val === 'benar'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                                  }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${val === 'benar' ? 'border-white bg-white' : 'border-slate-400'
                                    }`}
                                >
                                  {val === 'benar' && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                                </span>
                                <span>Benar</span>
                              </button>

                              {/* Option SALAH */}
                              <button
                                type="button"
                                onClick={() => handleSelectTrueFalse(opt.id, 'salah')}
                                className={`py-2 px-2 sm:px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition ${val === 'salah'
                                  ? 'bg-red-600 text-white border-red-600 shadow-xs ring-2 ring-red-300'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-red-50 hover:border-red-300'
                                  }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${val === 'salah' ? 'border-white bg-white' : 'border-slate-400'
                                    }`}
                                >
                                  {val === 'salah' && <span className="w-2 h-2 rounded-full bg-red-600"></span>}
                                </span>
                                <span>Salah</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : currentQ.questionType === 'complex_choice' ? (
                // PILIHAN GANDA KOMPLEKS — Tampil dengan Checkbox (bisa pilih lebih dari 1)
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-medium italic">
                    Centang semua jawaban yang Anda anggap benar (bisa lebih dari satu)
                  </p>
                  {currentQ.options.map((opt) => {
                    const isChecked = currentAns.selectedOptionIds.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${isChecked
                          ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-blue-50/40 hover:border-blue-300 text-slate-800'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOption(opt.id)}
                          className="w-5 h-5 mt-0.5 shrink-0 accent-blue-600 rounded cursor-pointer"
                        />
                        <div className="text-xs sm:text-sm pt-0.5 leading-snug">
                          <KaTeXRenderer content={opt.optionText} inline />
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                // PILIHAN GANDA BIASA / BERTINGKAT — Tampil ABCDE, hanya bisa pilih satu
                <div className="space-y-3">
                  {currentQ.options.map((opt) => {
                    const isChecked = currentAns.selectedOptionIds.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${isChecked
                          ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-blue-50/40 hover:border-blue-300 text-slate-800'
                          }`}
                      >
                        {/* Radio indicator di samping label huruf */}
                        <div className="flex items-center justify-center shrink-0 mt-0.5">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${isChecked ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}
                          >
                            {opt.label}
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm pt-0.5 leading-snug">
                          <KaTeXRenderer content={opt.optionText} inline />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Soal tidak tersedia.</p>
          )}

          {/* Bottom Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-200 pt-5 mt-8 gap-3">
            {/* Previous Question Button */}
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Soal Sebelumnya
            </button>

            {/* Ragu-Ragu Checkbox Button (Orange) */}
            <label className="flex items-center gap-2 cursor-pointer bg-amber-50 border border-amber-300 px-4 py-2.5 rounded-xl text-amber-900 text-xs font-bold shadow-2xs hover:bg-amber-100/80 transition">
              <input
                type="checkbox"
                checked={currentAns.isDoubtful}
                onChange={handleToggleDoubtful}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Ragu-Ragu (Warna Orange)</span>
            </label>

            {/* Next Question or Finish Button */}
            {currentIdx === questions.length - 1 ? (
              <button
                onClick={() => {
                  if (window.confirm('Apakah Anda yakin ingin mengumpulkan dan menyelesaikan ujian ini?')) {
                    handleForceFinish();
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" /> Selesai Ujian
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 shadow-md shadow-blue-600/20"
              >
                Soal Selanjutnya <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SELURUH SOAL POPUP MODAL */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-blue-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500/20 rounded-xl border border-blue-400/30 flex items-center justify-center">
                  <Grid className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Daftar Seluruh Soal</h3>
                  <p className="text-[11px] text-blue-200">
                    Pilih nomor soal untuk langsung menuju soal tersebut
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Question Number Grid */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setShowQuestionModal(false);
                    }}
                    className={`h-12 rounded-2xl text-xs font-extrabold transition border flex items-center justify-center ${getPaletteClass(
                      q.id,
                      idx
                    )}`}
                  >
                    <span>{idx + 1}</span>
                  </button>
                ))}
              </div>

              {/* Status Legend */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 text-slate-600 font-medium">
                <p className="font-extrabold text-slate-900 mb-1">Status Nomor Soal:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-emerald-600 rounded-md shrink-0"></span>
                    <span>Sudah Dikerjakan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-amber-500 rounded-md shrink-0"></span>
                    <span>Ragu-Ragu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 bg-slate-200 border border-slate-300 rounded-md shrink-0"></span>
                    <span>Belum Dikerjakan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setShowQuestionModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold transition"
              >
                Tutup Navigation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kiosk Warning Popup */}
      {showKioskWarning && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 border border-amber-300 shadow-2xl">
            <AlertOctagon className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-lg font-extrabold text-slate-900">PERINGATAN KIOSK SECURITY!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda terdeteksi meninggalkan layar ujian ({violationCount}/3). Jika terdeteksi lagi, sesi Anda akan otomatis diblokir!
            </p>
            <button
              onClick={() => setShowKioskWarning(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md"
            >
              Kembali Mengerjakan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
