import React from 'react';
import { Settings, QuestionPackage } from '../types';
import { Printer, ArrowLeft } from 'lucide-react';
import { KaTeXRenderer } from './KaTeXRenderer';

interface PrintableQuestionPackageProps {
  settings: Settings;
  pkg: QuestionPackage;
  onClose: () => void;
}

export const PrintableQuestionPackage: React.FC<PrintableQuestionPackageProps> = ({
  settings,
  pkg,
  onClose,
}) => {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans">
      {/* Print Control Header Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-md font-sans print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <span className="text-xs text-slate-300 font-semibold">Mode Pratinjau Cetak Soal</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-white shadow-lg shadow-blue-500/30"
        >
          <Printer className="w-4 h-4" /> Cetak Soal (PDF)
        </button>
      </div>

      {/* Printable Sheet A4 */}
      <div className="max-w-4xl mx-auto bg-white p-10 sm:p-12 shadow-xl border border-slate-200 text-slate-900 text-sm space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none">
        {/* Kop Surat Bimbel */}
        <div className="border-b-4 border-double border-slate-900 pb-4 text-center space-y-1">
          <h1 className="text-xl font-bold uppercase tracking-wide">{settings.bimbelName}</h1>
          <p className="text-xs">{settings.address} • Telp: {settings.phone}</p>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold uppercase tracking-wider">Naskah Soal Ujian</h2>
          <p className="text-sm font-sans font-semibold">Mata Pelajaran: {pkg.subjectName}</p>
          <p className="text-xs font-sans text-slate-600">Kode Soal: {pkg.code} | Guru: {pkg.teacherName}</p>
        </div>

        {/* Questions List */}
        <div className="space-y-8 pt-4">
          {pkg.questions.map((q, idx) => (
            <div key={q.id} className="space-y-3 break-inside-avoid">
              <div className="flex items-start gap-2 text-sm">
                <span className="font-bold">{idx + 1}.</span>
                <div className="flex-1 leading-relaxed">
                  <KaTeXRenderer content={q.content} />
                </div>
              </div>

              <div className="pl-6 space-y-2">
                {q.questionType === 'true_false' && (
                  <div className="space-y-1">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-2 text-sm items-start">
                        <div className="w-24 shrink-0 font-bold border-r border-slate-300 mr-2">
                          [B / S]
                        </div>
                        <KaTeXRenderer content={opt.optionText} />
                      </div>
                    ))}
                  </div>
                )}

                {q.questionType !== 'true_false' && q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex gap-2 text-sm items-start">
                    <span className="font-semibold">{String.fromCharCode(65 + oIdx)}.</span>
                    <KaTeXRenderer content={opt.optionText} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {pkg.questions.length === 0 && (
            <div className="text-center italic text-slate-500">
              Belum ada soal pada paket ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
