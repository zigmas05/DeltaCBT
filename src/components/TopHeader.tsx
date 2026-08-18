
import React from 'react';
import { UserRole, Settings } from '../types';
import {
  ShieldCheck,
  GraduationCap,
  UserCheck,
  Printer,
  KeyRound,
  RefreshCw,
  LogOut,
} from 'lucide-react';

interface TopHeaderProps {
  currentRole: UserRole;
  settings: Settings;
  currentToken: string;
  onRefreshToken?: () => void;
  onPrintBeritaAcara: () => void;
  onLogout: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentRole,
  settings,
  currentToken,
  onRefreshToken,
  onPrintBeritaAcara,
  onLogout,
}) => {
  const isStaffPortal = currentRole === 'admin' || currentRole === 'guru';

  const getRoleHeaderBadge = () => {
    if (currentRole === 'admin') {
      return {
        label: 'Dashboard Admin',
        badge: 'PORTAL ADMIN',
        icon: ShieldCheck,
        color: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      };
    } else if (currentRole === 'guru') {
      return {
        label: 'Dashboard Guru / Tentor',
        badge: 'PORTAL GURU',
        icon: UserCheck,
        color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      };
    } else {
      return {
        label: 'Portal Ujian Siswa',
        badge: 'PORTAL SISWA',
        icon: GraduationCap,
        color: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
      };
    }
  };

  const roleBadgeInfo = getRoleHeaderBadge();
  const BadgeIcon = roleBadgeInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Portal Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md shadow-blue-500/20 border border-blue-400/30">
            CBT
          </div>
          <div className="hidden sm:block">
            <h1 className="font-black text-sm tracking-tight text-white leading-tight flex items-center gap-1.5">
              <span>{settings.bimbelName}</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">{settings.ownerName}</p>
          </div>
        </div>

        {/* TOP CENTER: Active Portal Header Indicator (Read Only) */}
        <div className="flex items-center justify-center max-w-xs sm:max-w-md w-full mx-auto">
          <div className={`px-4 py-1.5 rounded-2xl border ${roleBadgeInfo.color} flex items-center gap-2 shadow-inner`}>
            <BadgeIcon className="w-4 h-4 shrink-0" />
            <span className="font-black text-xs sm:text-sm tracking-tight">{roleBadgeInfo.label}</span>
          </div>
        </div>

        {/* Right Actions: Token (Only for Staff) & Print */}
        <div className="flex items-center gap-2 shrink-0">
          {isStaffPortal && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 font-semibold text-[11px]">Token:</span>
              <span className="font-mono font-black text-amber-400">{currentToken}</span>
              {onRefreshToken && (
                <button
                  onClick={onRefreshToken}
                  className="ml-1 text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-700 transition"
                  title="Refresh Token 5 Digit Ujian"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <button
            onClick={onPrintBeritaAcara}
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-700 font-bold transition flex items-center gap-1.5"
            title="Cetak Berita Acara Ujian"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 text-xs px-3 py-2 rounded-xl border border-red-500/30 font-extrabold transition flex items-center gap-1.5 active:scale-95"
            title="Keluar / Log Out dari Sistem"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};

