import React from 'react';
import { Settings, ExamSession } from '../types';
import { Printer, ArrowLeft } from 'lucide-react';

interface PrintableBeritaAcaraProps {
  settings: Settings;
  sessions: ExamSession[];
  onClose: () => void;
}

export const PrintableBeritaAcara: React.FC<PrintableBeritaAcaraProps> = ({
  settings,
  sessions,
  onClose,
}) => {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-serif">
      {/* Print Control Header Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-md font-sans">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <span className="text-xs text-slate-300 font-semibold">Mode Pratinjau Dokumen Cetak</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-white shadow-lg shadow-blue-500/30"
        >
          <Printer className="w-4 h-4" /> Cetak Berita Acara & Daftar Hadir
        </button>
      </div>

      {/* Printable Sheet A4 */}
      <div className="max-w-4xl mx-auto bg-white p-10 sm:p-12 shadow-xl border border-slate-200 text-slate-900 text-sm space-y-6">
        {/* Kop Surat Bimbel */}
        <div className="border-b-4 border-double border-slate-900 pb-4 text-center space-y-1">
          <h1 className="text-xl font-bold uppercase tracking-wide">{settings.bimbelName}</h1>
          <p className="text-xs">{settings.address} • Telp: {settings.phone}</p>
          <p className="text-[11px] italic text-slate-600">Pusat Bimbingan Belajar UTBK, SNBT & Ujian Mandiri Perguruan Tinggi Negeri</p>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold uppercase underline tracking-wider">BERITA ACARA PELAKSANAAN TRY OUT</h2>
          <p className="text-xs font-sans">Nomor: 042/BA-TO/{new Date().getFullYear()}</p>
        </div>

        {/* Narrative Paragraph */}
        <p className="text-xs leading-relaxed text-justify font-sans">
          Pada hari ini, <strong>Selasa, 28 Juli 2026</strong>, telah dilaksanakan Sesi Ujian Try Out Akbar Gelombang 1 bertempat di {settings.bimbelName}. Berikut adalah rincian kehadiran dan berita acara pelaksanaan:
        </p>

        {/* Details List */}
        <div className="text-xs font-sans space-y-1 pl-4">
          <p>• <strong>Mata Pelajaran:</strong> Matematika Penalaran & Saintek Terpadu</p>
          <p>• <strong>Durasi Ujian:</strong> 90 Menit</p>
          <p>• <strong>Jumlah Peserta Terdaftar:</strong> {sessions.length} Peserta</p>
          <p>• <strong>Jumlah Peserta Hadir:</strong> {sessions.filter((s) => s.status !== 'blocked').length} Peserta</p>
        </div>

        {/* Table Student Attendance */}
        <div>
          <h3 className="font-bold text-xs uppercase mb-2 font-sans">Daftar Kehadiran & Status Peserta Ujian:</h3>
          <table className="w-full text-left text-xs border-collapse border border-slate-900 font-sans">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 font-bold uppercase">
                <th className="border border-slate-900 p-2 text-center w-10">No</th>
                <th className="border border-slate-900 p-2">Nama Peserta</th>
                <th className="border border-slate-900 p-2">NIS</th>
                <th className="border border-slate-900 p-2">Kelas</th>
                <th className="border border-slate-900 p-2 text-center">Status Ujian</th>
                <th className="border border-slate-900 p-2 text-center w-28">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((sess, idx) => (
                <tr key={sess.id}>
                  <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                  <td className="border border-slate-900 p-2 font-bold">{sess.studentName}</td>
                  <td className="border border-slate-900 p-2 font-mono">{sess.studentNis}</td>
                  <td className="border border-slate-900 p-2">{sess.className}</td>
                  <td className="border border-slate-900 p-2 text-center font-bold">
                    {sess.status === 'blocked' ? 'TERBLOKIR' : 'HADIR'}
                  </td>
                  <td className="border border-slate-900 p-2 text-center font-sans italic text-[10px] text-slate-400">
                    [Tanda Tangan]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature Box */}
        <div className="pt-8 grid grid-cols-2 text-xs font-sans text-center gap-12">
          <div>
            <p>Pengawas Ujian,</p>
            <div className="h-16"></div>
            <p className="font-bold underline">Drs. Budi Santoso</p>
            <p className="text-[10px] text-slate-500">NIP. 19780512 200501 1 002</p>
          </div>

          <div>
            <p>Mengetahui, Pemilik Bimbel</p>
            <div className="h-16"></div>
            <p className="font-bold underline">{settings.ownerName}</p>
            <p className="text-[10px] text-slate-500">Direktur Utama Lembaga</p>
          </div>
        </div>
      </div>
    </div>
  );
};
