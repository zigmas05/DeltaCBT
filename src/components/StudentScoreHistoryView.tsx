import React, { useState } from 'react';
import { StudentUser, ExamScoreRecord, QuestionPackage, TryoutItem } from '../types';
import { KaTeXRenderer } from './KaTeXRenderer';
import {
  Award,
  FileText,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  BookOpen,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface StudentScoreHistoryViewProps {
  currentStudent: StudentUser;
  scores: ExamScoreRecord[];
  packages: QuestionPackage[];
  tryouts: TryoutItem[];
}

export const StudentScoreHistoryView: React.FC<StudentScoreHistoryViewProps> = ({
  currentStudent,
  scores,
  packages,
  tryouts,
}) => {
  const [selectedScore, setSelectedScore] = useState<ExamScoreRecord | null>(null);

  // Filter scores for current student ONLY (no dummy/fallback)
  const studentScores = scores.filter(
    (s) => s.studentNis === currentStudent.nis
  );
  // Hanya tampilkan data nyata, tidak ada fallback ke semua data
  const displayScores = studentScores;

  // Find corresponding question package for selected score review
  const selectedTryoutItem = selectedScore
    ? tryouts.find((t) => t.title.toLowerCase() === selectedScore.tryoutTitle.toLowerCase())
    : null;

  const reviewPackage = selectedScore
    ? packages.find((p) =>
      selectedTryoutItem
        ? p.id === selectedTryoutItem.packageId
        : p.subjectName.toLowerCase() === selectedScore.subjectName.toLowerCase()
    ) || packages[0]
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Award className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Hasil Ujian & Evaluasi
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Nilai Try Out
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar perolehan nilai try out yang telah Anda ikuti beserta peninjauan kunci jawaban & pembahasan lengkap.
          </p>
        </div>

        <div className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Total {displayScores.length} Sesi Terdata</span>
        </div>
      </div>

      {/* Score History Cards / List */}
      {displayScores.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Belum Ada Riwayat Nilai</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Anda belum menyelesaikan sesi try out apapun. Silakan kerjakan try out terlebih dahulu di menu <strong>Sesi Try Out</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayScores.map((sc, idx) => (
            <div
              key={sc.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:border-blue-300 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    Sesi #{idx + 1}
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {sc.date}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {sc.tryoutTitle}
                </h3>

                <p className="text-xs text-slate-600">
                  Mata Pelajaran: <strong className="text-slate-800">{sc.subjectName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-2xl text-center shadow-2xs">
                  {sc.show_review ? (
                    <>
                      <span className="font-black text-2xl text-blue-900 tracking-tight">{sc.finalScore}</span>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Nilai Poin</span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-slate-500 block">Nilai Masuk,<br />Menunggu Ditampilkan</span>
                  )}
                </div>

                {sc.show_review && (
                  <button
                    onClick={() => setSelectedScore(sc)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-3 rounded-2xl font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review Hasil</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REVIEW HASIL & KUNCI JAWABAN MODAL */}
      {selectedScore && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full my-8 border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 text-white flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-orange-500/20 text-orange-300 border border-orange-400/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Evaluasi & Pembahasan Ujian
                  </span>
                  <span className="text-xs text-slate-300 font-mono">{selectedScore.date}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black">{selectedScore.tryoutTitle}</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Mata Pelajaran: <strong className="text-white">{selectedScore.subjectName}</strong> • Peserta: <strong className="text-white">{selectedScore.studentName}</strong> ({selectedScore.className})
                </p>
              </div>

              <button
                onClick={() => setSelectedScore(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary Banner */}
            <div className="bg-slate-100 p-4 border-b border-slate-200 shrink-0 grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Nilai Perolehan</p>
                <p className="text-2xl font-black text-blue-900">{selectedScore.finalScore}</p>
              </div>

              <div className="bg-orange-50 p-3 rounded-2xl border border-orange-200 shadow-2xs">
                <p className="text-[10px] font-bold text-orange-700 uppercase">Total Benar</p>
                <p className="text-2xl font-black text-orange-600 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-5 h-5" />
                  {selectedScore.totalCorrect}
                </p>
              </div>

              <div className="bg-red-50 p-3 rounded-2xl border border-red-200 shadow-2xs">
                <p className="text-[10px] font-bold text-red-700 uppercase">Total Salah</p>
                <p className="text-2xl font-black text-red-600 flex items-center justify-center gap-1">
                  <XCircle className="w-5 h-5" />
                  {selectedScore.totalWrong}
                </p>
              </div>
            </div>

            {/* Modal Body Scrollable Review List */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Daftar Soal & Kunci Jawaban Resmi</span>
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  Total {reviewPackage ? reviewPackage.questions.length : 0} Soal
                </span>
              </div>

              {reviewPackage ? (
                reviewPackage.questions.map((q, idx) => {
                  const correctOptions = q.options.filter((o) => o.isCorrect);

                  return (
                    <div
                      key={q.id}
                      className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xs"
                    >
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                        <span className="text-xs font-bold text-blue-900">
                          Soal Nomor #{idx + 1}
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full">
                          {q.typeLabel}
                        </span>
                      </div>

                      {/* Question Content */}
                      <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-white p-3.5 rounded-2xl border border-slate-200">
                        <KaTeXRenderer content={q.content} />
                      </div>

                      {/* Options Review */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                          Pilihan Jawaban & Kunci:
                        </p>

                        {(() => {
                          const studentAnswer = selectedScore?.answers?.find((a: any) => a.questionId === q.id);
                          const selectedOptionIds = studentAnswer?.selectedOptionIds || [];
                          const tfAnswers = studentAnswer?.tfAnswers || {};

                          if (q.questionType === 'true_false') {
                            return (
                              <div className="space-y-3">
                                {q.options.map((opt) => {
                                  const isKeyBenar = Boolean(opt.isCorrect);
                                  const studentTf = tfAnswers[opt.id];
                                  const isMatch = (isKeyBenar && studentTf === 'benar') || (!isKeyBenar && studentTf === 'salah');

                                  return (
                                    <div key={opt.id} className="p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 bg-white border-slate-200">
                                      <span><KaTeXRenderer content={opt.optionText} inline /></span>

                                      {studentTf ? (
                                        <span className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase shrink-0 ${isMatch ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                                          Jawaban: {studentTf}
                                        </span>
                                      ) : (
                                        <span className="px-3 py-1 rounded-lg font-bold text-[10px] uppercase shrink-0 bg-slate-100 text-slate-500 border border-slate-300">
                                          Tidak Dijawab
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                                  <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-center gap-2 text-blue-900 font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>
                                      Kunci Jawaban Resmi: {q.options.map(o => Boolean(o.isCorrect) ? 'Benar' : 'Salah').join(', ')}
                                    </span>
                                  </div>
                                  <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2 text-slate-700 font-bold">
                                    <span>
                                      Jawaban Anda: {
                                        Object.keys(tfAnswers).length > 0 
                                          ? q.options.map(o => tfAnswers[o.id] ? (tfAnswers[o.id] === 'benar' ? 'Benar' : 'Salah') : '-').join(', ')
                                          : 'Tidak Dijawab'
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              {q.options.map((opt) => {
                                const isSelected = selectedOptionIds.includes(opt.id);
                                let bgClass = 'bg-white border-slate-200 text-slate-700';
                                let labelBg = 'bg-slate-200 text-slate-700';

                                if (isSelected) {
                                  if (opt.isCorrect) {
                                    bgClass = 'bg-orange-50 border-orange-400 text-orange-950 font-bold shadow-xs';
                                    labelBg = 'bg-orange-600 text-white';
                                  } else {
                                    bgClass = 'bg-red-50 border-red-400 text-red-950 font-bold shadow-xs';
                                    labelBg = 'bg-red-600 text-white';
                                  }
                                }

                                return (
                                  <div key={opt.id} className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${bgClass}`}>
                                    <div className="flex items-center gap-2.5">
                                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${labelBg}`}>
                                        {opt.label}
                                      </span>
                                      <span>
                                        <KaTeXRenderer content={opt.optionText} inline />
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}

                                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                                  <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-center gap-2 text-blue-900 font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>
                                      Kunci Jawaban Resmi:{' '}
                                      {q.questionType === 'graded_choice'
                                        ? (q.options.slice().sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))[0]?.label || '-')
                                        : q.options.filter(o => o.isCorrect).map(o => o.label).join(' dan ')}
                                    </span>
                                  </div>
                                  <div className={`flex-1 p-3 border rounded-xl text-xs flex items-center gap-2 font-bold ${selectedOptionIds.length > 0 ? (selectedOptionIds.some(id => q.options.find(o => o.id === id)?.isCorrect) ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900') : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                    <span>
                                      Jawaban Anda:{' '}
                                      {selectedOptionIds.length > 0
                                        ? selectedOptionIds.map(id => q.options.find(o => o.id === id)?.label).join(', ')
                                        : 'Tidak Dijawab'}
                                    </span>
                                  </div>
                                </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Discussion / Pembahasan Box */}
                      {q.discussion && (
                        <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs space-y-1.5">
                          <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Pembahasan & Solusi:</span>
                          </p>
                          <div className="text-amber-950 leading-relaxed">
                            <KaTeXRenderer content={q.discussion} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 italic">Data paket soal tidak ditemukan.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 shrink-0 flex justify-end">
              <button
                onClick={() => setSelectedScore(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                Tutup Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
