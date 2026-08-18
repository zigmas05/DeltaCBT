import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  KeyRound,
  User,
  Calendar,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Building2,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserRole, Settings, StudentUser, StaffUser } from '../types';
import { authenticateStudentSupabase, authenticateStaffSupabase, checkSupabaseConnection } from '../lib/supabaseService';
import { SUPABASE_URL } from '../lib/supabase';

interface LoginPageProps {
  settings: Settings;
  students: StudentUser[];
  staff: StaffUser[];
  onLogin: (role: UserRole, studentData?: StudentUser, staffData?: StaffUser) => void;
  notificationMessage?: string | null;
  initialPortal?: 'siswa' | 'staff';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  settings,
  students,
  staff,
  onLogin,
  notificationMessage,
  initialPortal = 'siswa',
}) => {
  // Login Portal: 'siswa' | 'staff'
  const [loginPortal, setLoginPortal] = useState<'siswa' | 'staff'>(initialPortal);

  // Siswa Form
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Staff Form
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Error & Loading state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ isConnected: boolean; message: string } | null>(null);

  useEffect(() => {
    checkSupabaseConnection().then((res) => {
      setDbStatus(res);
    });
  }, []);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentUsername.trim() || !studentPassword.trim()) {
      setError('Username / NIS dan Password siswa wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Coba Autentikasi langsung dari Supabase Database (tabel student_users)
      const sbStudent = await authenticateStudentSupabase(studentUsername, studentPassword);
      if (sbStudent) {
        if (sbStudent.isActive === false) {
          setError('Akun siswa Anda sedang TIDAK AKTIF. Silakan hubungi Administrator / Bimbel.');
          setIsSubmitting(false);
          return;
        }
        setIsSubmitting(false);
        onLogin('siswa', sbStudent);
        return;
      }

      // 2. Jika tidak terhubung atau belum sync, cek state siswa yang dimuat dari Supabase
      const termLower = studentUsername.trim().toLowerCase();
      const foundStudent = students.find(
        (s) =>
          s.username.toLowerCase() === termLower ||
          s.nis.toLowerCase() === termLower
      );

      if (foundStudent) {
        const expectedPassword = foundStudent.password;
        if (studentPassword === expectedPassword) {
          if (foundStudent.isActive === false) {
            setError('Akun siswa Anda sedang TIDAK AKTIF. Silakan hubungi Administrator / Bimbel.');
            setIsSubmitting(false);
            return;
          }
          setIsSubmitting(false);
          onLogin('siswa', foundStudent);
          return;
        } else {
          setError('Password siswa tidak cocok. Silakan tanyakan ke Admin.');
          setIsSubmitting(false);
          return;
        }
      }

      // Username / NIS tidak ditemukan
      setError('Username / NIS atau Password siswa tidak terdaftar. Silakan hubungi Admin / Tentor.');
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan sistem saat verifikasi login.');
      setIsSubmitting(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!staffUsername.trim() || !staffPassword.trim()) {
      setError('Username dan Password staff wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Coba autentikasi staff dari Supabase Database (tabel staff_users)
      const sbStaff = await authenticateStaffSupabase(staffUsername, staffPassword);
      if (sbStaff) {
        setIsSubmitting(false);
        onLogin(sbStaff.role, undefined, sbStaff);
        return;
      }

      // 2. Cek state staff
      const usernameLower = staffUsername.trim().toLowerCase();
      const foundStaff = staff.find((s) => s.username.toLowerCase() === usernameLower);

      if (foundStaff) {
        const expectedPassword = foundStaff.password;
        if (staffPassword === expectedPassword) {
          setIsSubmitting(false);
          onLogin(foundStaff.role, undefined, foundStaff);
          return;
        } else {
          setError('Password staff/guru tidak cocok. Silakan tanyakan ke Administrator.');
          setIsSubmitting(false);
          return;
        }
      }

      setError('Username atau Password staff/guru tidak terdaftar. Silakan hubungi Administrator.');
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat verifikasi login staff.');
      setIsSubmitting(false);
    }
  };

  const isSiswa = loginPortal === 'siswa';

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans antialiased relative overflow-hidden transition-colors duration-500 ${isSiswa ? 'bg-slate-50 text-slate-800 selection:bg-orange-500' : 'bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white'}`}>
      {/* Background Decorative Glows */}
      <div
        className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${isSiswa ? 'bg-orange-400/10' : 'bg-blue-600/10'
          }`}
      ></div>
      <div
        className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${isSiswa ? 'bg-amber-400/10' : 'bg-indigo-600/10'
          }`}
      ></div>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto z-10">
        <div className="max-w-md w-full space-y-6">
          {/* Notification Banner if logged out */}
          {notificationMessage && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-md animate-in fade-in slide-in-from-top-2 border ${isSiswa ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSiswa ? 'text-emerald-500' : 'text-emerald-400'}`} />
              <span>{notificationMessage}</span>
            </div>
          )}

          {/* Login Card */}
          <div className={`border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden transition-colors duration-500 ${isSiswa ? 'bg-white/90 border-white shadow-orange-900/5' : 'bg-slate-900/90 border-slate-800'}`}>
            {/* Brand Logo & Dedicated Portal Title */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg border transition-colors duration-500 ${isSiswa
                    ? 'bg-gradient-to-tr from-orange-500 to-amber-500 shadow-orange-500/20 border-orange-400/30'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-blue-500/20 border-blue-400/30'
                    }`}
                >
                  CBT
                </div>
                <div className="text-left transition-colors duration-500">
                  <h1 className={`font-black text-base tracking-tight ${isSiswa ? 'text-slate-800' : 'text-white'}`}>{settings.bimbelName}</h1>
                  <p className={`text-[11px] font-medium ${isSiswa ? 'text-slate-500' : 'text-slate-400'}`}>{settings.ownerName}</p>
                </div>
              </div>

              <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border transition-colors duration-500 ${isSiswa ? 'bg-orange-50 border-orange-100' : 'bg-slate-950 border-slate-800'}`}>
                {isSiswa ? (
                  <>
                    <GraduationCap className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-600">Portal Ujian Siswa</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400">Portal Staff Bimbel</span>
                  </>
                )}
              </div>
              <h2 className={`text-2xl font-black tracking-tight transition-colors duration-500 ${isSiswa ? 'text-slate-800' : 'text-white'}`}>
                {isSiswa ? 'Login Siswa CBT' : 'Login Admin & Guru'}
              </h2>
              <p className={`text-xs font-medium max-w-xs mx-auto transition-colors duration-500 ${isSiswa ? 'text-slate-500' : 'text-slate-400'}`}>
                {isSiswa
                  ? 'Masukkan Username (atau NIS) dan Password akun siswa yang dibuat oleh Admin.'
                  : 'Masukkan akun Username dan Kata Sandi Staff untuk mengakses Dashboard Admin & Guru.'}
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${isSiswa ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                <AlertCircle className={`w-4 h-4 shrink-0 ${isSiswa ? 'text-red-500' : 'text-red-400'}`} />
                <span>{error}</span>
              </div>
            )}

            {/* DEDICATED SISWA LOGIN FORM */}
            {isSiswa && (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Username atau NIS Siswa
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={studentUsername}
                      onChange={(e) => setStudentUsername(e.target.value)}
                      placeholder="Contoh: ananda atau 20241001"
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Kata Sandi / Password Siswa</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type={showStudentPassword ? "text" : "password"}
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 transition p-1"
                      title={showStudentPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                    >
                      {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-xl shadow-orange-500/20 border border-orange-400/30 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Masuk Portal Siswa'}
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}

            {/* DEDICATED STAFF LOGIN FORM */}
            {!isSiswa && (
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Username Staff (Admin / Guru)</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      placeholder="Contoh: admin atau siti"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Kata Sandi / Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 border border-blue-400/30 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Masuk Portal Staff'}
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}

            {/* Return to Student Portal Link (Only visible on Staff Login page) */}
            {!isSiswa && (
              <div className="pt-4 border-t border-slate-800/80 text-center space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.history.pushState({}, '', '/');
                    }
                    setLoginPortal('siswa');
                    setError(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-slate-950 hover:bg-slate-800 border border-slate-800 transition flex items-center justify-center gap-2 text-emerald-400 hover:text-emerald-300"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Kembali ke Halaman Siswa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-4 text-center text-xs border-t z-10 transition-colors duration-500 ${isSiswa ? 'text-slate-500 border-slate-200 bg-white/50' : 'text-slate-500 border-slate-900'}`}>
        <p>&copy; {new Date().getFullYear()} {settings.bimbelName}. Hak Cipta Dilindungi Undang-Undang.</p>
      </footer>
    </div>
  );
};
