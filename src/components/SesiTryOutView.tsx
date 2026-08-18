import React, { useState } from 'react';
import { StudentUser, TryoutItem, QuestionPackage, ExamSession } from '../types';
import {
  KeyRound,
  Play,
  Calendar,
  Clock,
  BookOpen,
  FileText,
  AlertCircle,
  User,
  X,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface SesiTryOutViewProps {
  currentStudent: StudentUser;
  tryouts: TryoutItem[];
  packages: QuestionPackage[];
  currentToken: string;
  sessions?: ExamSession[];
  onStartExam: (tryout: TryoutItem) => void;
}

export const SesiTryOutView: React.FC<SesiTryOutViewProps> = ({
  currentStudent,
  tryouts,
  packages,
  currentToken,
  sessions = [],
  onStartExam,
}) => {
  // Modal confirmation state
  const [selectedTryout, setSelectedTryout] = useState<TryoutItem | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [confirmDob, setConfirmDob] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [tokenError, setTokenError] = useState('');

  // Filter tryouts for student's class
  const activeTryouts = tryouts.filter(
    (t) =>
      t.allowedClassNames.length === 0 ||
      t.allowedClassNames.includes(currentStudent.className)
  );

  const handleOpenConfirmModal = (tryout: TryoutItem) => {
    setSelectedTryout(tryout);
    setConfirmName(currentStudent.name);
    setConfirmDob(currentStudent.dateOfBirth);
    setInputToken('');
    setTokenError('');
  };

  const handleConfirmAndStart = (e: React.FormEvent) => {
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

    // Verify token (case-insensitive): Check against currentToken OR selectedTryout.token
    const enteredToken = inputToken.trim().toUpperCase();
    const activeGlobalToken = currentToken.trim().toUpperCase();
    const tryoutSpecificToken = selectedTryout ? selectedTryout.token.trim().toUpperCase() : '';

    if (enteredToken !== activeGlobalToken && (tryoutSpecificToken === '' || enteredToken !== tryoutSpecificToken)) {
      setTokenError(
        'Token yang Anda masukkan TIDAK VALID! Silakan tanyakan token 5 digit resmi ke Admin atau Tentor Pengawas.'
      );
      return;
    }

    // Token verified successfully
    if (selectedTryout) {
      const tryoutToStart = selectedTryout;
      setSelectedTryout(null);
      onStartExam(tryoutToStart);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <KeyRound className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Modul Ujian Siswa
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Sesi Try Out Ujian CBT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih sesi try out yang tersedia untuk kelas <strong className="text-slate-800">{currentStudent.className}</strong>.
          </p>
        </div>

        <div className="bg-orange-50 text-orange-800 border border-orange-200 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-600" />
          <span>{activeTryouts.length} Sesi Try Out Aktif</span>
        </div>
      </div>

      {/* Try Out Cards List */}
      {activeTryouts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Belum Ada Sesi Try Out Aktif</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Saat ini tidak ada simulasi try out yang dijadwalkan untuk kelas Anda. Silakan cek secara berkala atau tanyakan ke Tentor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeTryouts.map((tryout) => {
            const pkg = packages.find((p) => p.id === tryout.packageId);
            const questionCount = pkg ? pkg.questions.length : 0;
            const subjectName = pkg ? pkg.subjectName : 'Mata Pelajaran Ujian';
            const studentSession = sessions.find((s) => s.studentId === currentStudent.id && s.tryoutId === tryout.id);
            const hasFinished = studentSession?.status === 'finished';
            const isBlocked = studentSession?.status === 'blocked';
            const hasStarted = studentSession?.status === 'active';

            const now = new Date();
            let isWithinTime = true;
            if (tryout.startTime && tryout.endTime) {
              const start = new Date(tryout.startTime);
              const end = new Date(tryout.endTime);
              isWithinTime = now >= start && now <= end;
            }

            return (
              <div
                key={tryout.id}
                className={`bg-white rounded-3xl border ${hasFinished ? 'border-orange-200' : 'border-slate-200/80 hover:border-blue-300'} p-6 shadow-sm transition-all flex flex-col justify-between space-y-5 group`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${hasFinished ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                      Ujian CBT Online
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${hasFinished ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-orange-600 bg-orange-50 border border-orange-200'}`}>
                      {!hasFinished && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>}
                      {hasFinished ? 'Dikumpulkan' : 'Tersedia'}
                    </span>
                  </div>

                  <h3 className={`font-extrabold text-base leading-snug transition ${hasFinished ? 'text-slate-700' : 'text-slate-900 group-hover:text-blue-600'}`}>
                    {tryout.title}
                  </h3>

                  <div className="space-y-2 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className={`w-4 h-4 shrink-0 ${hasFinished ? 'text-slate-400' : 'text-blue-600'}`} />
                      <span>Mapel: <strong className="text-slate-800">{subjectName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 shrink-0 ${hasFinished ? 'text-slate-400' : 'text-amber-500'}`} />
                      <span>Durasi: <strong className="text-slate-800">{tryout.durationMinutes} Menit</strong> ({questionCount} Soal)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 shrink-0 ${hasFinished ? 'text-slate-400' : 'text-indigo-500'}`} />
                      <span>Jadwal: <strong className="text-slate-800">{tryout.startTime} - {tryout.endTime}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  {hasFinished ? (
                    <button
                      disabled
                      className="w-full bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Selesai Ujian</span>
                    </button>
                  ) : isBlocked ? (
                    <button
                      onClick={() => alert('Sesi Anda sedang diblokir karena melanggar tata tertib (keluar layar). Silakan minta Admin atau Pengawas untuk mereset sesi Anda.')}
                      className="w-full bg-red-100 border border-red-200 text-red-700 font-bold text-xs py-3 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition hover:bg-red-200"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Minta Reset Admin</span>
                    </button>
                  ) : !tryout.isActive ? (
                    <button
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Try Out Belum Diaktifkan oleh admin</span>
                    </button>
                  ) : !isWithinTime ? (
                    <button
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Bukan Waktu Try Out</span>
                    </button>
                  ) : hasStarted ? (
                    <button
                      onClick={() => onStartExam(tryout)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-3 rounded-2xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Lanjutkan Ujian</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartExam(tryout)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-2xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Kerjakan Try Out</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
