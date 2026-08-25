import React, { useState } from 'react';
import { StudentUser, TryoutItem, AnnouncementItem, ExamScoreRecord } from '../types';
import {
  Sparkles,
  Megaphone,
  TrendingUp,
  Shield,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Key,
} from 'lucide-react';

interface StudentDashboardProps {
  currentStudent: StudentUser;
  tryouts?: TryoutItem[];
  announcements: AnnouncementItem[];
  scores: ExamScoreRecord[];
  currentToken?: string;
  onStartExam?: (tryout: TryoutItem) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentStudent,
  announcements,
  scores,
}) => {
  // Filter scores for current student ONLY and where show_review is true
  const studentScores = scores.filter(
    (s) => s.studentNis === currentStudent.nis && s.show_review
  );
  // Hanya tampilkan data nyata
  const displayScores = studentScores;

  const totalTO = displayScores.length;

  // Hover state for SVG line chart point
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Constants for SVG drawing
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 30;
  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  // Calculate coordinates for points
  const chartPoints = displayScores.map((sc, idx) => {
    const x =
      displayScores.length === 1
        ? paddingLeft + chartInnerWidth / 2
        : paddingLeft + (idx / (displayScores.length - 1)) * chartInnerWidth;
    const y = svgHeight - paddingBottom - (sc.finalScore / 100) * chartInnerHeight;
    return { x, y, score: sc };
  });

  // Construct SVG Path strings
  const linePathD =
    chartPoints.length > 0
      ? 'M ' + chartPoints.map((p) => `${p.x},${p.y}`).join(' L ')
      : '';

  const areaPathD =
    chartPoints.length > 0
      ? `${linePathD} L ${chartPoints[chartPoints.length - 1].x},${svgHeight - paddingBottom
      } L ${chartPoints[0].x},${svgHeight - paddingBottom} Z`
      : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ========================================================================= */}
      {/* BARIS 1: SELAMAT DATANG (LEFT SPAN 2) & TATA TERTIB UJIAN DUA WARNA BIRU (RIGHT SPAN 1) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* LEFT: Dashboard Utama Selamat Datang (Span 2) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Portal Ujian Siswa CBT
              </span>
              <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Siswa Aktif
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Selamat Datang, {currentStudent.name}!
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Pantau grafik perkembangan nilai try out Anda, tinjau pengumuman resmi bimbel, dan persiapkan diri menghadapi simulasi ujian berikutnya.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-300 font-medium relative z-10">
            <span className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              NIS: <strong className="text-white font-mono">{currentStudent.nis}</strong>
            </span>
            <span className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              Kelas: <strong className="text-white">{currentStudent.className}</strong>
            </span>
            <span className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              Tgl Lahir: <strong className="text-white">{currentStudent.dateOfBirth}</strong>
            </span>
          </div>
        </div>

        {/* RIGHT: Tata Tertib Ujian CBT - Dual Blue Shades Style (Span 1) */}
        <div className="lg:col-span-1 bg-gradient-to-br from-blue-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 border border-blue-800/80 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-blue-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-400/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Tata Tertib Ujian</h3>
                  <p className="text-[10px] text-sky-200 font-medium">Aturan Sistem Kiosk Security</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold bg-sky-400/20 text-sky-200 border border-sky-300/30 px-2.5 py-0.5 rounded-full uppercase">
                CBT Kiosk
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-blue-100">
              <div className="flex items-start gap-2.5 p-2.5 bg-blue-900/60 rounded-2xl border border-blue-800/60">
                <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span className="leading-snug">Dilarang membuka tab baru, browser lain, atau aplikasi screenshot saat ujian.</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 bg-blue-900/60 rounded-2xl border border-blue-800/60">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">Peringatan otomatis muncul jika layar ujian kehilangan fokus (pindah tab).</span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 bg-blue-900/60 rounded-2xl border border-blue-800/60">
                <Key className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span className="leading-snug">Gunakan token 5 digit resmi dari admin/tentor untuk konfirmasi pengerjaan.</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-blue-800/80 text-[11px] text-sky-300 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
              Anti-Curang Terintegrasi
            </span>
            <span className="text-white bg-sky-500/30 px-2 py-0.5 rounded-md border border-sky-400/30">3x Violation Block</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARIS 2: GRAFIK PERKEMBANGAN NILAI (LEFT SPAN 2) & PENGUMUMAN BIMBEL (RIGHT SPAN 1) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* LEFT: Grafik Perkembangan Nilai (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Grafik Perkembangan Nilai (Diagram Garis)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi tren perolehan nilai try out dari sesi ke sesi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Garis Perolehan Poin
                </span>
              </div>
            </div>

            {/* SVG Line Chart or Empty State */}
            {displayScores.length === 0 ? (
              <div className="relative bg-slate-50/70 border border-slate-200/80 rounded-2xl p-10 text-center space-y-3">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-400">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-700 text-sm">Belum Ada Data Nilai</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Grafik perkembangan nilai akan muncul setelah Anda menyelesaikan sesi try out pertama.
                </p>
              </div>
            ) : (
              <div className="relative bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 overflow-hidden">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Y-Axis Gridlines */}
                  {[100, 75, 50, 25, 0].map((val) => {
                    const y = svgHeight - paddingBottom - (val / 100) * chartInnerHeight;
                    return (
                      <g key={val}>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={svgWidth - paddingRight}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray={val === 0 ? '0' : '4 4'}
                          strokeWidth="1"
                        />
                        <text
                          x={paddingLeft - 8}
                          y={y + 4}
                          fill="#94a3b8"
                          fontSize="10"
                          fontWeight="700"
                          textAnchor="end"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area Gradient Fill */}
                  {areaPathD && <path d={areaPathD} fill="url(#scoreGradient)" />}

                  {/* Main Line */}
                  {linePathD && (
                    <path
                      d={linePathD}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points / Circles */}
                  {chartPoints.map((pt, idx) => (
                    <g key={idx} className="cursor-pointer">
                      {/* Pulsing ring on hover */}
                      {hoveredPointIndex === idx && (
                        <circle cx={pt.x} cy={pt.y} r="10" fill="#2563eb" opacity="0.25" />
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="6"
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth="3"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      />
                      {/* Score Label above point */}
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        fill="#1e293b"
                        fontSize="11"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        {pt.score.finalScore}
                      </text>
                      {/* X-Axis Date Label below */}
                      <text
                        x={pt.x}
                        y={svgHeight - 12}
                        fill="#64748b"
                        fontSize="9"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        TO {idx + 1} ({pt.score.date})
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Hover Tooltip Box */}
                {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
                  <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1 shadow-lg border border-slate-700 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-blue-300">
                        Try Out #{hoveredPointIndex + 1}: {chartPoints[hoveredPointIndex].score.tryoutTitle}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                        {chartPoints[hoveredPointIndex].score.date}
                      </span>
                    </div>
                    <p className="text-slate-300">
                      Mata Pelajaran: <strong className="text-white">{chartPoints[hoveredPointIndex].score.subjectName}</strong>
                    </p>
                    <p className="text-slate-300">
                      Nilai: <strong className="text-orange-400 font-mono text-sm">{chartPoints[hoveredPointIndex].score.finalScore}</strong> | Benar: <strong className="text-orange-400">{chartPoints[hoveredPointIndex].score.totalCorrect}</strong> / Salah: <strong className="text-red-400">{chartPoints[hoveredPointIndex].score.totalWrong}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Total akumulasi: <strong className="text-slate-900">{totalTO} Sesi Try Out</strong></span>
            <span className="text-blue-600 font-extrabold">Data Terverifikasi CBT</span>
          </div>
        </div>

        {/* RIGHT: Pengumuman Bimbel - Extended height to match row 2 (Span 1) */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4 flex flex-col justify-between min-h-[380px]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Megaphone className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Pengumuman Bimbel</h3>
                <p className="text-[11px] text-slate-500">Informasi resmi dari tentor & admin</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {announcements.filter(a => a.target === 'siswa' || a.target === 'all').map((anno) => (
                <div
                  key={anno.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 hover:bg-slate-100/60 transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full">
                      {anno.date}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Resmi</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{anno.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{anno.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
            <span>Update Pengumuman Bimbel</span>
            <span className="text-blue-600 uppercase font-extrabold">Aktif</span>
          </div>
        </div>
      </div>
    </div>
  );
};
