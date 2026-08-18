import React, { useState } from 'react';
import { UserRole, Settings } from '../types';
import {
  ShieldCheck,
  GraduationCap,
  UserCheck,
  Printer,
  KeyRound,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  School,
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  settings: Settings;
  currentToken: string;
  onPrintBeritaAcara: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  setRole,
  settings,
  currentToken,
  onPrintBeritaAcara,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setRole(role);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header (Visible only on small screens < md) */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-blue-500/20">
            CBT
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-white leading-tight">
              {settings.bimbelName}
            </h1>
            <p className="text-[11px] text-slate-400 capitalize">
              Mode: <span className="font-bold text-blue-400">{currentRole}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition border border-slate-700"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Left Sidebar Menu Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 md:z-30 w-72 bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800/80 p-5 h-screen overflow-y-auto transition-transform duration-300 shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl shadow-blue-600/30 border border-blue-400/30">
                CBT
              </div>
              <div>
                <h1 className="font-black text-base tracking-tight text-white leading-tight">
                  {settings.bimbelName}
                </h1>
                <p className="text-[11px] text-slate-400 mt-0.5">{settings.ownerName}</p>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-800/60 border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <School className="w-3.5 h-3.5 text-blue-400" /> System Version
            </span>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/20 px-2 py-0.5 rounded-full font-bold">
              v2.4 Kiosk
            </span>
          </div>

          {/* Active 5-Digit Token Display */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-850 p-4 rounded-2xl border border-slate-700/80 shadow-inner space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Token Tryout 5 Digit
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded">
                20m
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono font-black text-2xl text-amber-400 tracking-widest">
                {currentToken}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Aktif
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Diperlukan siswa saat mengonfirmasi sesi pengerjaan ujian.
            </p>
          </div>

          {/* Role Navigation Menu */}
          <div className="space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Menu Utama & Peran Akses
            </p>

            <div className="space-y-1.5">
              {/* Admin Menu Option */}
              <button
                onClick={() => handleRoleChange('admin')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                  currentRole === 'admin'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      currentRole === 'admin' ? 'bg-white/20 text-white' : 'bg-slate-800 text-blue-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm leading-tight">Dashboard Admin</p>
                    <p
                      className={`text-[10px] font-normal ${
                        currentRole === 'admin' ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      Kelola Siswa, CBT & Token
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    currentRole === 'admin' ? 'translate-x-0.5 opacity-100' : 'opacity-40'
                  }`}
                />
              </button>

              {/* Guru Menu Option */}
              <button
                onClick={() => handleRoleChange('guru')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                  currentRole === 'guru'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      currentRole === 'guru' ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-400'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm leading-tight">Portal Guru / Pengajar</p>
                    <p
                      className={`text-[10px] font-normal ${
                        currentRole === 'guru' ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      Soal LaTeX & Pengumuman
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    currentRole === 'guru' ? 'translate-x-0.5 opacity-100' : 'opacity-40'
                  }`}
                />
              </button>

              {/* Siswa Menu Option */}
              <button
                onClick={() => handleRoleChange('siswa')}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                  currentRole === 'siswa'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      currentRole === 'siswa' ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm leading-tight">Portal Ujian Siswa</p>
                    <p
                      className={`text-[10px] font-normal ${
                        currentRole === 'siswa' ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      Pengerjaan Tryout CBT
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    currentRole === 'siswa' ? 'translate-x-0.5 opacity-100' : 'opacity-40'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Actions & Footer */}
        <div className="pt-6 space-y-4 border-t border-slate-800">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onPrintBeritaAcara();
            }}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs px-4 py-3 rounded-xl border border-slate-700 font-bold transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Cetak Berita Acara</span>
          </button>

          <div className="text-center space-y-1">
            <p className="text-[11px] text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} {settings.bimbelName}
            </p>
            <p className="text-[10px] text-slate-500">CBT Kiosk Security Verified</p>
          </div>
        </div>
      </aside>
    </>
  );
};
