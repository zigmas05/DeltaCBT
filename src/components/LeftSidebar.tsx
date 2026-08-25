import React from 'react';
import { UserRole } from '../types';
import {
  Layers,
  Users,
  BookOpen,
  KeyRound,
  Award,
  Megaphone,
  Settings as SettingsIcon,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Database,
  Building2,
  LogOut,
} from 'lucide-react';

interface LeftSidebarProps {
  currentRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentToken: string;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentRole,
  activeTab,
  setActiveTab,
}) => {
  // Menu definition per role
  const getMenuItems = () => {
    if (currentRole === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard Admin', icon: Layers },
        { id: 'master', label: 'Manajemen Data', icon: Users },
        { id: 'soal', label: 'Manajemen Soal', icon: BookOpen },
        { id: 'tryout', label: 'Manajemen Try Out', icon: KeyRound },
        { id: 'hasil', label: 'Hasil & Rangking', icon: Award },
        { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
        { id: 'inspeksi_api', label: 'Inspeksi API & DDL', icon: Database },
        { id: 'pengaturan', label: 'Pengaturan Bimbel', icon: SettingsIcon },
      ];
    } else if (currentRole === 'guru') {
      return [
        { id: 'dashboard', label: 'Dashboard Guru', icon: Layers },
        { id: 'soal', label: 'Input Soal', icon: BookOpen },
        { id: 'siswa', label: 'Data Siswa Bimbel', icon: Users },
        { id: 'hasil', label: 'Hasil Ujian Siswa', icon: Award },
      ];
    } else {
      // siswa: Dashboard, Sesi Try Out, Riwayat Nilai
      return [
        { id: 'dashboard', label: 'Beranda / Dashboard', icon: Layers },
        { id: 'tryout', label: 'Sesi Try Out CBT', icon: KeyRound },
        { id: 'hasil', label: 'Riwayat Nilai', icon: Award },
      ];
    }
  };

  const menuItems = getMenuItems();

  const getRoleBadge = () => {
    if (currentRole === 'admin') {
      return {
        portalTitle: 'PORTAL ADMIN',
        title: 'MODUL ADMIN',
        subtitle: 'Hak Akses Utama Bimbel',
        icon: ShieldCheck,
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      };
    } else if (currentRole === 'guru') {
      return {
        portalTitle: 'PORTAL GURU',
        title: 'MODUL GURU / TENTOR',
        subtitle: 'Pengelola Soal & Nilai',
        icon: UserCheck,
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      };
    } else {
      return {
        portalTitle: 'PORTAL SISWA',
        title: 'PORTAL UTAMA SISWA',
        subtitle: 'Sesi Ujian CBT Kiosk',
        icon: GraduationCap,
        color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      };
    }
  };

  const roleInfo = getRoleBadge();
  const IconComp = roleInfo.icon;

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800/80 p-4 space-y-4 md:space-y-6 flex flex-col md:min-h-[calc(100vh-4rem)] z-10">
      <div className="space-y-4">
        {/* Role Sub-Header Badge */}
        <div className={`p-3 rounded-2xl border ${roleInfo.color} flex items-center gap-3 shadow-inner`}>
          <div className="p-2 rounded-xl bg-slate-800/90 shadow-sm shrink-0">
            <IconComp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase block truncate">
              {roleInfo.portalTitle}
            </span>
            <p className="text-xs font-black tracking-tight uppercase text-white truncate">{roleInfo.title}</p>
            <p className="text-[11px] text-slate-300 font-medium truncate">{roleInfo.subtitle}</p>
          </div>
        </div>

        {/* Sidebar Menu Items List */}
        <nav className="flex-1 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 snap-x scrollbar-hide">
          {menuItems.map((item) => {
            const ItemIcon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all shrink-0 md:shrink-1 w-auto md:w-full snap-start ${isActive
                    ? currentRole === 'siswa'
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 border border-orange-400/30'
                      : currentRole === 'guru'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <ItemIcon
                    className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                  />
                  <span>{item.label}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${isActive ? 'opacity-100 translate-x-0.5' : 'opacity-30'
                    }`}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

