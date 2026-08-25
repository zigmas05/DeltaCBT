import React from 'react';
import { Settings, ExamScoreRecord, QuestionPackage } from '../types';
import { Printer, ArrowLeft, CheckCircle2, XCircle, BookOpen, Lightbulb } from 'lucide-react';
import { KaTeXRenderer } from './KaTeXRenderer';

interface PrintableExamResultProps {
  settings: Settings;
  score: ExamScoreRecord;
  reviewPackage: QuestionPackage;
  onClose: () => void;
}

export const PrintableExamResult: React.FC<PrintableExamResultProps> = ({
  settings,
  score,
  reviewPackage,
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
        <span className="text-xs text-slate-300 font-semibold">Mode Pratinjau Cetak Hasil Ujian</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-white shadow-lg shadow-blue-500/30"
        >
          <Printer className="w-4 h-4" /> Cetak / Download Nilai (PDF)
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
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider">Hasil Ujian CBT</h2>
          <div className="flex flex-col items-start text-sm font-sans gap-1">
            <span className="font-semibold">Nama &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : {score.studentName} ({score.className})</span>
            <span>Nama Try Out : {score.subjectName} </span>
            <span className="text-xs text-slate-600">Tanggal &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {score.date}</span>
          </div>
        </div>

        {/* Score Summary Box */}
        <div className="border border-slate-300 rounded-xl p-4 grid grid-cols-3 gap-4 text-center font-sans mb-8 break-inside-avoid">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Nilai Akhir</p>
            <p className="text-xl font-black text-blue-900">{score.finalScore}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-green-700 uppercase">Benar</p>
            <p className="text-xl font-black text-green-600">{score.totalCorrect}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-red-700 uppercase">Salah</p>
            <p className="text-xl font-black text-red-600">{score.totalWrong}</p>
          </div>
        </div>

        {/* Review List */}
        <div className="space-y-6">
          <h3 className="font-bold border-b-2 border-slate-900 pb-2 mb-4 text-base">Detail Jawaban & Pembahasan</h3>

          {reviewPackage.questions.map((q, idx) => (
            <div key={q.id} className="border border-slate-300 rounded-xl p-4 space-y-4 break-inside-avoid text-sm">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold">Soal Nomor #{idx + 1}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 bg-slate-100 uppercase">
                  {q.typeLabel}
                </span>
              </div>

              {/* Question Content */}
              <div className="leading-relaxed bg-slate-50 p-3 rounded">
                <KaTeXRenderer content={q.content} />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-slate-600 mb-2">Jawaban Siswa:</p>
                {(() => {
                  const studentAnswer = score.answers?.find((a: any) => a.questionId === q.id);
                  const selectedOptionIds = studentAnswer?.selectedOptionIds || [];
                  const tfAnswers = studentAnswer?.tfAnswers || {};

                  if (q.questionType === 'true_false') {
                    return (
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isKeyBenar = Boolean(opt.isCorrect);
                          const studentTf = tfAnswers[opt.id];
                          const isMatch = (isKeyBenar && studentTf === 'benar') || (!isKeyBenar && studentTf === 'salah');

                          return (
                            <div key={opt.id} className="p-2 border border-slate-200 rounded text-xs flex justify-between gap-3">
                              <span className="flex-1"><KaTeXRenderer content={opt.optionText} inline /></span>

                              {studentTf ? (
                                <span className={`font-bold uppercase px-2 py-1 rounded shrink-0 ${isMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  Jawab: {studentTf}
                                </span>
                              ) : (
                                <span className="font-bold uppercase px-2 py-1 rounded shrink-0 bg-slate-200 text-slate-600">
                                  Kosong
                                </span>
                              )}
                            </div>
                          );
                        })}
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs flex gap-2 font-bold text-blue-900">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Kunci: {q.options.map(o => Boolean(o.isCorrect) ? 'Benar' : 'Salah').join(', ')}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const isSelected = selectedOptionIds.includes(opt.id);
                        let borderStyle = 'border-slate-200 bg-white text-slate-700';
                        if (isSelected) {
                          if (opt.isCorrect) {
                            borderStyle = 'border-green-500 bg-green-50 text-green-900 font-bold';
                          } else {
                            borderStyle = 'border-red-500 bg-red-50 text-red-900 font-bold';
                          }
                        }

                        return (
                          <div key={opt.id} className={`p-2 border rounded text-xs flex gap-3 items-center ${borderStyle}`}>
                            <span className={`w-6 h-6 shrink-0 flex items-center justify-center font-bold rounded ${isSelected ? (opt.isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white') : 'bg-slate-200 text-slate-700'}`}>
                              {opt.label}
                            </span>
                            <span className="flex-1">
                              <KaTeXRenderer content={opt.optionText} inline />
                            </span>
                          </div>
                        );
                      })}

                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs flex gap-2 font-bold text-blue-900">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Kunci: {q.questionType === 'graded_choice'
                          ? (q.options.slice().sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))[0]?.label || '-')
                          : q.options.filter(o => o.isCorrect).map(o => o.label).join(' & ')}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Discussion / Pembahasan Box */}
              {q.discussion && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <p className="font-bold flex items-center gap-1 mb-1 text-yellow-900">
                    <Lightbulb className="w-4 h-4 shrink-0" /> Pembahasan:
                  </p>
                  <div className="text-yellow-900">
                    <KaTeXRenderer content={q.discussion} />
                  </div>
                </div>
              )}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};
