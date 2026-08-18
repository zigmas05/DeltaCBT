import React, { useState } from 'react';
import {
  StaffUser,
  StudentUser,
  QuestionPackage,
  AnnouncementItem,
  ExamScoreRecord,
  QuestionItem,
  QuestionType,
} from '../types';
import { KaTeXRenderer } from './KaTeXRenderer';
import {
  BookOpen,
  Users,
  Award,
  Megaphone,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Layers,
  ShieldAlert,
  Info,
  Plus,
  Copy,
  FileText,
  Eye,
} from 'lucide-react';

interface TeacherPanelProps {
  currentUser: StaffUser | null; // ini untuk tambahan staff dari app.tsx
  students: StudentUser[];
  packages: QuestionPackage[];
  setPackages: React.Dispatch<React.SetStateAction<QuestionPackage[]>>;
  announcements: AnnouncementItem[];
  scores: ExamScoreRecord[];
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const samplePresetImages = [
  { label: 'Grafik Kartesius / Kurva', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80' },
  { label: 'Diagram Vektor & Gaya', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80' },
  { label: 'Geometri / Bangun Ruang', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80' },
  { label: 'Tabel Data Statistika', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80' },
];

export const TeacherPanel: React.FC<TeacherPanelProps> = ({
  currentUser, //ini tangkapan untuk guru yang aktif dari atas
  students,
  packages,
  setPackages,
  announcements,
  scores,
  activeTab: activeTabProp,
  setActiveTab: setActiveTabProp,
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<'dashboard' | 'siswa' | 'soal' | 'hasil'>('dashboard');

  const activeTab = (activeTabProp || localActiveTab) as 'dashboard' | 'siswa' | 'soal' | 'hasil';
  const setActiveTab = (tab: any) => {
    if (setActiveTabProp) setActiveTabProp(tab);
    setLocalActiveTab(tab);
  };

  // Currently logged in teacher (Drs. Budi Santoso)
  const teacherPackages = packages.filter((p) => p.teacherId === 2 || p.teacherName.includes('Budi'));

  // Question Editor State
  const [isQuestionEditorPage, setIsQuestionEditorPage] = useState<boolean>(false);
  const [selectedPkgId, setSelectedPkgId] = useState<number | null>(null);
  const [selectedSubjectPkgId, setSelectedSubjectPkgId] = useState<number | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

  const [questionType, setQuestionType] = useState<QuestionType>('single_choice');
  const [questionContent, setQuestionContent] = useState<string>('');
  const [, setOptionCount] = useState<number>(5);
  const [optionsState, setOptionsState] = useState<
    Array<{ label: string; text: string; isCorrect: boolean; points?: number }>
  >([
    { label: 'A', text: '', isCorrect: true, points: 10 },
    { label: 'B', text: '', isCorrect: false, points: 0 },
    { label: 'C', text: '', isCorrect: false, points: 0 },
    { label: 'D', text: '', isCorrect: false, points: 0 },
    { label: 'E', text: '', isCorrect: false, points: 0 },
  ]);

  // Image Modal State
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [imageTarget, setImageTarget] = useState<'question' | number | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string>('');

  // Switch Question Type in Question Editor
  const handleQuestionTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    if (newType === 'true_false') {
      setOptionCount(3);
      setOptionsState([
        { label: 'Pernyataan 1', text: 'Kecepatan gelombang bunyi tergantung pada suhu medium', isCorrect: true, points: 5 },
        { label: 'Pernyataan 2', text: 'Gelombang bunyi merupakan gelombang transversal', isCorrect: false, points: 0 },
        { label: 'Pernyataan 3', text: 'Frekuensi gelombang menentukan tinggi rendahnya nada', isCorrect: true, points: 5 },
      ]);
    } else if (newType === 'graded_choice') {
      setOptionCount(5);
      setOptionsState([
        { label: 'A', text: '', isCorrect: true, points: 5 },
        { label: 'B', text: '', isCorrect: false, points: 4 },
        { label: 'C', text: '', isCorrect: false, points: 3 },
        { label: 'D', text: '', isCorrect: false, points: 2 },
        { label: 'E', text: '', isCorrect: false, points: 1 },
      ]);
    } else if (newType === 'single_choice') {
      setOptionCount(5);
      setOptionsState([
        { label: 'A', text: '', isCorrect: true, points: 10 },
        { label: 'B', text: '', isCorrect: false, points: 0 },
        { label: 'C', text: '', isCorrect: false, points: 0 },
        { label: 'D', text: '', isCorrect: false, points: 0 },
        { label: 'E', text: '', isCorrect: false, points: 0 },
      ]);
    } else {
      // complex_choice
      setOptionCount(5);
      setOptionsState([
        { label: 'A', text: '', isCorrect: true, points: 10 },
        { label: 'B', text: '', isCorrect: false, points: 0 },
        { label: 'C', text: '', isCorrect: true, points: 10 },
        { label: 'D', text: '', isCorrect: false, points: 0 },
        { label: 'E', text: '', isCorrect: false, points: 0 },
      ]);
    }
  };

  // Handle set option count (4 vs 5 options, or 3 vs 4 statements for true/false)
  const handleSetOptionCount = (count: number) => {
    setOptionCount(count);
    if (questionType === 'true_false') {
      if (count === 3) {
        setOptionsState((prev) => prev.slice(0, 3));
      } else if (count === 4) {
        setOptionsState((prev) => {
          if (prev.length >= 4) return prev.slice(0, 4);
          return [
            ...prev,
            { label: `Pernyataan 4`, text: '', isCorrect: true, points: 5 },
          ];
        });
      }
    } else if (questionType === 'graded_choice') {
      if (count === 4) {
        setOptionsState((prev) => {
          const sliced = prev.slice(0, 4);
          return sliced.map((o, idx) => ({
            ...o,
            points: o.points !== undefined && o.points > 0 ? o.points : (4 - idx),
          }));
        });
      } else if (count === 5) {
        setOptionsState((prev) => {
          if (prev.length >= 5) return prev.slice(0, 5);
          return [
            ...prev,
            { label: 'E', text: '', isCorrect: false, points: 1 },
          ];
        });
      }
    } else {
      if (count === 4) {
        setOptionsState((prev) => prev.slice(0, 4));
      } else if (count === 5) {
        setOptionsState((prev) => {
          if (prev.length >= 5) return prev.slice(0, 5);
          return [
            ...prev,
            { label: 'E', text: '', isCorrect: false, points: 0 },
          ];
        });
      }
    }
  };

  // Open full-page editor for inputting new question
  const handleOpenInputQuestionModal = (pkgId: number) => {
    setSelectedPkgId(pkgId);
    setSelectedSubjectPkgId(pkgId);
    setEditingQuestionId(null);
    setQuestionType('single_choice');
    setOptionCount(5);
    setQuestionContent('Diberikan fungsi kuadrat $f(x) = x^2 - 4x + 3$. Tentukan titik puncak parabola tersebut!');
    setOptionsState([
      { label: 'A', text: '$(2, -1)$', isCorrect: true, points: 10 },
      { label: 'B', text: '$(2, 1)$', isCorrect: false, points: 0 },
      { label: 'C', text: '$(-2, -1)$', isCorrect: false, points: 0 },
      { label: 'D', text: '$(4, 3)$', isCorrect: false, points: 0 },
      { label: 'E', text: '$(0, 3)$', isCorrect: false, points: 0 },
    ]);
    setIsQuestionEditorPage(true);
  };

  // Open full-page editor for editing existing question
  const handleOpenEditQuestionModal = (pkgId: number, q: QuestionItem) => {
    setSelectedPkgId(pkgId);
    setSelectedSubjectPkgId(pkgId);
    setEditingQuestionId(q.id);
    setQuestionType(q.questionType || 'single_choice');
    setQuestionContent(q.content);
    setOptionCount(q.options.length);
    setOptionsState(
      q.options.map((o) => ({
        label: o.label,
        text: o.optionText,
        isCorrect: o.isCorrect,
        points: o.points,
      }))
    );
    setIsQuestionEditorPage(true);
  };

  // Delete individual question item
  const handleDeleteQuestionItem = (pkgId: number, qId: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus butir soal ini?')) {
      setPackages((prev) =>
        prev.map((pkg) => {
          if (pkg.id !== pkgId) return pkg;
          return {
            ...pkg,
            questions: pkg.questions.filter((q) => q.id !== qId),
          };
        })
      );
    }
  };

  // Duplicate individual question item
  const handleDuplicateQuestionItem = (pkgId: number, q: QuestionItem) => {
    const duplicated: QuestionItem = {
      ...q,
      id: Date.now(),
      options: q.options.map((o) => ({ ...o, id: Date.now() + Math.floor(Math.random() * 1000) })),
    };

    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id !== pkgId) return pkg;
        return {
          ...pkg,
          questions: [...pkg.questions, duplicated],
        };
      })
    );
  };

  // Save (Add or Edit) Question Item
  const handleSaveQuestion = () => {
    if (!questionContent.trim()) {
      alert('Isi pertanyaan soal tidak boleh kosong!');
      return;
    }

    const typeLabelStr =
      questionType === 'single_choice'
        ? 'Pilihan Ganda'
        : questionType === 'complex_choice'
        ? 'PG Kompleks'
        : questionType === 'graded_choice'
        ? 'PG Bertingkat'
        : 'Benar / Salah';

    const updatedOptions = optionsState.map((opt, idx) => ({
      id: Date.now() + idx,
      label: opt.label,
      optionText: opt.text || `Opsi ${opt.label}`,
      isCorrect: opt.isCorrect,
      points: questionType === 'true_false' || questionType === 'graded_choice'
        ? (opt.points !== undefined && opt.points !== null ? opt.points : (questionType === 'graded_choice' ? (optionsState.length - idx) : 5))
        : (opt.isCorrect ? (opt.points !== undefined && opt.points !== null ? opt.points : 10) : 0),
    }));

    if (editingQuestionId) {
      setPackages((prev) =>
        prev.map((pkg) => {
          if (pkg.id !== selectedPkgId) return pkg;
          return {
            ...pkg,
            questions: pkg.questions.map((q) =>
              q.id === editingQuestionId
                ? {
                    ...q,
                    questionType,
                    typeLabel: typeLabelStr,
                    content: questionContent,
                    discussion: '',
                    options: updatedOptions,
                  }
                : q
            ),
          };
        })
      );
    } else {
      const newQuestion: QuestionItem = {
        id: Date.now(),
        packageId: selectedPkgId!,
        questionType,
        typeLabel: typeLabelStr,
        content: questionContent,
        discussion: '',
        pointsDefault: 10,
        options: updatedOptions,
      };

      setPackages((prev) =>
        prev.map((pkg) => {
          if (pkg.id !== selectedPkgId) return pkg;
          return {
            ...pkg,
            questions: [...pkg.questions, newQuestion],
          };
        })
      );
    }

    setIsQuestionEditorPage(false);
    setSelectedPkgId(null);
    setEditingQuestionId(null);
  };

  // Formatting helpers for text editor
  const insertFormattingTag = (startTag: string, endTag: string, defaultText: string) => {
    const textToInsert = `${startTag}${defaultText}${endTag}`;
    setQuestionContent((prev) => prev + textToInsert);
  };

  const insertOptionLatex = (optIdx: number, latexCode: string) => {
    setOptionsState((prev) =>
      prev.map((o, i) => (i === optIdx ? { ...o, text: o.text + latexCode } : o))
    );
  };

  const handleSelectImage = (imageUrl: string) => {
    if (!imageUrl) return;
    const imgMarkdown = `\n![Gambar](${imageUrl})\n`;

    if (imageTarget === 'question') {
      setQuestionContent((prev) => prev + imgMarkdown);
    } else if (typeof imageTarget === 'number') {
      setOptionsState((prev) =>
        prev.map((o, i) => (i === imageTarget ? { ...o, text: o.text + imgMarkdown } : o))
      );
    }

    setShowImageModal(false);
    setImageTarget(null);
    setCustomImageUrl('');
  };

  // Render Full Page Question Editor Mode
  if (isQuestionEditorPage && selectedPkgId) {
    const targetPkg = packages.find((p) => p.id === selectedPkgId);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Editor Top Navigation Header */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsQuestionEditorPage(false)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Bank Soal</span>
            </button>
            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {targetPkg?.code || 'MAPEL'}
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                {editingQuestionId ? 'Edit Butir Soal' : 'Input Butir Soal Baru'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQuestionEditorPage(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveQuestion}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingQuestionId ? 'Simpan Perubahan' : 'Tambahkan ke Paket'}</span>
            </button>
          </div>
        </div>

        {/* Main Editor Grid Layout */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Input Pertanyaan, LaTeX Toolbar, & Live Visual Preview */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                    Isi Pertanyaan Soal (LaTeX & Gambar Supported):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setImageTarget('question');
                      setShowImageModal(true);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>+ Sisipkan Gambar Soal</span>
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  placeholder="Ketikkan isi pertanyaan soal di sini... Gunakan $...$ untuk simbol rumus LaTeX..."
                  className="w-full p-4 border border-slate-300 rounded-2xl text-xs sm:text-sm font-mono bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              {/* LATEX & FORMATTING QUICK TOOLBAR */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Toolbar Cepat Rumus Matematika (LaTeX):</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Pecahan (a/b)', code: '$\\frac{a}{b}$' },
                    { label: 'Akar (√x)', code: '$\\sqrt{x}$' },
                    { label: 'Akar Pangkat n (ⁿ√x)', code: '$\\sqrt[n]{x}$' },
                    { label: 'Pangkat (x²)', code: '$x^2$' },
                    { label: 'Integral (∫)', code: '$\\int_{0}^{3} f(x) dx$' },
                    { label: 'Sigma (∑)', code: '$\\sum_{i=1}^{n} x_i$' },
                    { label: 'Matriks (2x2)', code: '$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$' },
                    { label: 'Alpha (α)', code: '$\\alpha$' },
                    { label: 'Beta (β)', code: '$\\beta$' },
                    { label: 'Pi (π)', code: '$\\pi$' },
                    { label: 'Kurang/Sama (≤)', code: '$\\le$' },
                    { label: 'Lebih/Sama (≥)', code: '$\\ge$' },
                    { label: 'Tidak Sama (≠)', code: '$\\neq$' },
                  ].map((sym) => (
                    <button
                      key={sym.label}
                      type="button"
                      onClick={() => insertFormattingTag(sym.code, '', '')}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs"
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIVE VISUAL PREVIEW */}
              <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-blue-900 font-extrabold uppercase flex items-center gap-1.5 tracking-wide">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Pratinjau Visual Soal:
                  </p>
                  <span className="text-[10px] text-blue-700 font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200">
                    Otorender Visual
                  </span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 min-h-[100px] shadow-2xs">
                  <KaTeXRenderer content={questionContent} className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed" />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Tipe Soal, Jumlah Opsi Switch, & Input Opsi Jawaban */}
            <div className="lg:col-span-5 space-y-5 border-t lg:border-t-0 lg:border-l lg:border-slate-200 lg:pl-8 pt-6 lg:pt-0">
              {/* Tipe Soal Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800">Tipe Soal Ujian:</label>
                  {editingQuestionId && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded-md">
                      Tipe soal terkunci saat edit
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'single_choice', label: 'Pilihan Ganda' },
                    { id: 'complex_choice', label: 'PG Kompleks' },
                    { id: 'graded_choice', label: 'PG Bertingkat' },
                    { id: 'true_false', label: 'Benar / Salah' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={Boolean(editingQuestionId)}
                      onClick={() => !editingQuestionId && handleQuestionTypeChange(t.id as QuestionType)}
                      className={`py-2 px-2 rounded-xl text-xs font-extrabold text-center border transition ${
                        questionType === t.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : Boolean(editingQuestionId)
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jumlah Opsi / Pernyataan Switcher */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    {questionType === 'true_false' ? 'Jumlah Pernyataan:' : 'Jumlah Opsi Jawaban:'}
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {questionType === 'true_false' ? 'Format Benar/Salah' : 'Format Pilihan'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                  {questionType === 'true_false' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSetOptionCount(3)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                          optionsState.length === 3
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        3 Pernyataan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetOptionCount(4)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                          optionsState.length === 4
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        4 Pernyataan
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSetOptionCount(4)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                          optionsState.length === 4
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        4 Opsi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetOptionCount(5)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                          optionsState.length === 5
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        5 Opsi
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Options Form Input Fields */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-slate-800">
                  {questionType === 'true_false'
                    ? 'Input Pernyataan & Kunci Benar/Salah:'
                    : questionType === 'graded_choice'
                    ? 'Input Opsi Jawaban & Skor Poin Bertingkat:'
                    : 'Input Opsi Jawaban & Tentukan Kunci Jawaban:'}
                </label>

                {questionType === 'single_choice' && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Pilih 1 radio button kunci jawaban yang benar:
                    </p>
                    {optionsState.map((opt, idx) => (
                      <div key={opt.label} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                opt.isCorrect ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {opt.label}
                            </div>
                            <span className="text-xs font-bold text-slate-800">Opsi {opt.label}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Option LaTeX Quick Shortcuts */}
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px]">
                              <span className="text-slate-400 font-bold mr-0.5">LaTeX:</span>
                              <button
                                type="button"
                                onClick={() => insertOptionLatex(idx, '$\\frac{a}{b}$')}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                title="Sisipkan Pecahan"
                              >
                                a/b
                              </button>
                              <button
                                type="button"
                                onClick={() => insertOptionLatex(idx, '$\\sqrt{x}$')}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                title="Sisipkan Akar"
                              >
                                √x
                              </button>
                              <button
                                type="button"
                                onClick={() => insertOptionLatex(idx, '$\\sqrt[n]{x}$')}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                title="Sisipkan Akar Pangkat n"
                              >
                                ⁿ√x
                              </button>
                              <button
                                type="button"
                                onClick={() => insertOptionLatex(idx, '$x^2$')}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                title="Sisipkan Pangkat"
                              >
                                x²
                              </button>
                            </div>

                            {/* Option Insert Image Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setImageTarget(idx);
                                setShowImageModal(true);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-2xs transition"
                              title={`Sisipkan Gambar pada Opsi ${opt.label}`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>+ Gambar</span>
                            </button>

                            {/* Flag Kunci Radio */}
                            <label
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition shrink-0 ${
                                opt.isCorrect
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="radio"
                                name="single_choice_key_page_teacher"
                                checked={opt.isCorrect}
                                onChange={() => {
                                  setOptionsState((prev) =>
                                    prev.map((o, i) => ({
                                      ...o,
                                      isCorrect: i === idx,
                                      points: i === idx ? (o.points && o.points > 0 ? o.points : 10) : 0,
                                    }))
                                  );
                                }}
                                className="accent-emerald-600 w-3.5 h-3.5"
                              />
                              <span>{opt.isCorrect ? '✓ Kunci' : 'Pilih'}</span>
                            </label>

                            {/* Input Point Manual jika Opsi Kunci Benar */}
                            {opt.isCorrect && (
                              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-2 py-1 rounded-lg text-[11px] font-extrabold text-amber-900 shadow-xs">
                                <span>Poin:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={opt.points ?? 10}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setOptionsState((prev) =>
                                      prev.map((o, i) => (i === idx ? { ...o, points: val } : o))
                                    );
                                  }}
                                  className="w-14 px-1 py-0.5 border border-amber-400 rounded text-center text-xs font-black font-mono bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  title="Atur nilai/poin jika jawaban benar"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOptionsState((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, text: val } : o))
                            );
                          }}
                          placeholder={`Isi jawaban opsi ${opt.label} (dukungan LaTeX $...$ & Gambar)...`}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        {/* Live KaTeX Rendered Option Preview */}
                        {opt.text && (
                          <div className="p-2 bg-white rounded-xl border border-slate-200">
                            <div className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Pratinjau Opsi {opt.label}:</div>
                            <KaTeXRenderer content={opt.text} className="text-xs text-slate-900 font-medium leading-relaxed" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {questionType === 'complex_choice' && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Centang semua checkbox opsi yang menjadi kunci jawaban benar (bisa lebih dari 1):
                    </p>
                    {optionsState.map((opt, idx) => (
                      <div key={opt.label} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                opt.isCorrect ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {opt.label}
                            </div>
                            <span className="text-xs font-bold text-slate-800">Opsi {opt.label}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Option LaTeX Quick Shortcuts */}
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px]">
                              <span className="text-slate-400 font-bold mr-0.5">LaTeX:</span>
                              <button
                                type="button"
                                onClick={() => insertOptionLatex(idx, '$\\frac{a}{b}$')}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                title="Sisipkan Pecahan"
                              >
                                a/b
                              </button>
                              <button
                                type="button"
                                onClick={() => insertOptionLatex(idx, '$\\sqrt{x}$')}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                title="Sisipkan Akar"
                              >
                                √x
                              </button>
                              <button
                                type="button"
                                onClick={() => insertOptionLatex(idx, '$x^2$')}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                title="Sisipkan Pangkat"
                              >
                                x²
                              </button>
                            </div>

                            {/* Option Insert Image Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setImageTarget(idx);
                                setShowImageModal(true);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-2xs transition"
                              title={`Sisipkan Gambar pada Opsi ${opt.label}`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>+ Gambar</span>
                            </button>

                            {/* Checkbox Kunci */}
                            <label
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition shrink-0 ${
                                opt.isCorrect
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={opt.isCorrect}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setOptionsState((prev) =>
                                    prev.map((o, i) =>
                                      i === idx
                                        ? {
                                            ...o,
                                            isCorrect: checked,
                                            points: checked ? (o.points && o.points > 0 ? o.points : 10) : 0,
                                          }
                                        : o
                                    )
                                  );
                                }}
                                className="accent-purple-600 w-3.5 h-3.5"
                              />
                              <span>{opt.isCorrect ? '✓ Kunci' : 'Centang'}</span>
                            </label>

                            {/* Input Point Manual untuk PG Kompleks */}
                            {opt.isCorrect && (
                              <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-300 px-2 py-1 rounded-lg text-[11px] font-extrabold text-purple-900 shadow-xs">
                                <span>Poin:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={opt.points ?? 10}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setOptionsState((prev) =>
                                      prev.map((o, i) => (i === idx ? { ...o, points: val } : o))
                                    );
                                  }}
                                  className="w-14 px-1 py-0.5 border border-purple-400 rounded text-center text-xs font-black font-mono bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  title="Atur nilai/poin opsi ini jika dipilih"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOptionsState((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, text: val } : o))
                            );
                          }}
                          placeholder={`Isi jawaban opsi ${opt.label}...`}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        {opt.text && (
                          <div className="p-2 bg-white rounded-xl border border-slate-200">
                            <div className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Pratinjau Opsi {opt.label}:</div>
                            <KaTeXRenderer content={opt.text} className="text-xs text-slate-900 font-medium leading-relaxed" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {questionType === 'graded_choice' && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Masukan opsi jawaban dan tentukan poin/skor bertingkat untuk masing-masing opsi (misal kunci bernilai 5/4, sisanya 4, 3, 2, 1):
                    </p>
                    {optionsState.map((opt, idx) => (
                      <div key={opt.label} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                              {opt.label}
                            </div>
                            <span className="text-xs font-bold text-slate-800">Opsi {opt.label}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Option LaTeX Quick Shortcuts */}
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px]">
                              <span className="text-slate-400 font-bold mr-0.5">LaTeX:</span>
                              <button
                                type="button"
                                onClick={() => insertOptionLatex(idx, '$\\frac{a}{b}$')}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                title="Sisipkan Pecahan"
                              >
                                a/b
                              </button>
                              <button
                                type="button"
                                onClick={() => insertOptionLatex(idx, '$\\sqrt{x}$')}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                title="Sisipkan Akar"
                              >
                                √x
                              </button>
                              <button
                                type="button"
                                onClick={() => insertOptionLatex(idx, '$x^2$')}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded font-mono font-bold transition"
                                title="Sisipkan Pangkat"
                              >
                                x²
                              </button>
                            </div>

                            {/* Option Insert Image Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setImageTarget(idx);
                                setShowImageModal(true);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-2xs transition"
                              title={`Sisipkan Gambar pada Opsi ${opt.label}`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>+ Gambar</span>
                            </button>

                            {/* Flag Kunci Utama Radio */}
                            <label
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition shrink-0 ${
                                opt.isCorrect
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="radio"
                                name="graded_choice_key_page_teacher"
                                checked={opt.isCorrect}
                                onChange={() => {
                                  setOptionsState((prev) =>
                                    prev.map((o, i) => ({
                                      ...o,
                                      isCorrect: i === idx,
                                    }))
                                  );
                                }}
                                className="accent-indigo-600 w-3.5 h-3.5"
                              />
                              <span>{opt.isCorrect ? '✓ Kunci Utama' : 'Pilih'}</span>
                            </label>

                            {/* Input Point Manual untuk Opsi PG Bertingkat */}
                            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-300 px-2 py-1 rounded-lg text-[11px] font-extrabold text-indigo-900 shadow-xs">
                              <span>Poin:</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={opt.points ?? (optionsState.length - idx)}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setOptionsState((prev) =>
                                    prev.map((o, i) => (i === idx ? { ...o, points: val } : o))
                                  );
                                }}
                                className="w-14 px-1 py-0.5 border border-indigo-400 rounded text-center text-xs font-black font-mono bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                title={`Poin untuk Opsi ${opt.label}`}
                              />
                            </div>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOptionsState((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, text: val } : o))
                            );
                          }}
                          placeholder={`Isi jawaban opsi ${opt.label} (dukungan LaTeX $...$ & Gambar)...`}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        {opt.text && (
                          <div className="p-2 bg-white rounded-xl border border-slate-200">
                            <div className="text-[10px] text-slate-400 font-extrabold uppercase mb-0.5">Pratinjau Opsi {opt.label}:</div>
                            <KaTeXRenderer content={opt.text} className="text-xs text-slate-900 font-medium leading-relaxed" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {questionType === 'true_false' && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Tentukan status Benar atau Salah pada setiap pernyataan dan masukan poinnya:
                    </p>
                    {optionsState.map((opt, idx) => (
                      <div key={opt.label} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                              <label className="flex items-center gap-1 text-xs font-bold text-emerald-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`tf_key_teacher_${idx}`}
                                  checked={opt.isCorrect}
                                  onChange={() => {
                                    setOptionsState((prev) =>
                                      prev.map((o, i) =>
                                        i === idx
                                          ? { ...o, isCorrect: true, points: o.points && o.points > 0 ? o.points : 5 }
                                          : o
                                      )
                                    );
                                  }}
                                  className="accent-emerald-600 w-4 h-4"
                                />
                                <span>Benar</span>
                              </label>
                              <label className="flex items-center gap-1 text-xs font-bold text-red-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`tf_key_teacher_${idx}`}
                                  checked={!opt.isCorrect}
                                  onChange={() => {
                                    setOptionsState((prev) =>
                                      prev.map((o, i) =>
                                        i === idx
                                          ? { ...o, isCorrect: false, points: o.points && o.points > 0 ? o.points : 5 }
                                          : o
                                      )
                                    );
                                  }}
                                  className="accent-red-600 w-4 h-4"
                                />
                                <span>Salah</span>
                              </label>
                            </div>

                            {/* Input Point Manual untuk Pernyataan Benar/Salah */}
                            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-300 px-2 py-1 rounded-lg text-[11px] font-extrabold text-blue-900 shadow-xs">
                              <span>Poin:</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={opt.points ?? 5}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setOptionsState((prev) =>
                                    prev.map((o, i) => (i === idx ? { ...o, points: val } : o))
                                  );
                                }}
                                className="w-14 px-1 py-0.5 border border-blue-400 rounded text-center text-xs font-black font-mono bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                title="Atur poin untuk pernyataan ini jika dijawab tepat"
                              />
                            </div>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOptionsState((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, text: val } : o))
                            );
                          }}
                          placeholder={`Pernyataan ${idx + 1}...`}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* IMAGE SELECTION MODAL */}
        {showImageModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  <span>Pilih / Upload Gambar</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Masukan Direct URL Gambar:</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSelectImage(customImageUrl)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    Sisipkan
                  </button>
                </div>
              </div>

              {/* Preset Sample Images */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Atau Pilih Gambar Sampel:</label>
                <div className="grid grid-cols-2 gap-2">
                  {samplePresetImages.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => handleSelectImage(img.url)}
                      className="p-2 border border-slate-200 rounded-xl hover:border-blue-500 text-left transition space-y-1 bg-slate-50 hover:bg-blue-50/50"
                    >
                      <img src={img.url} alt={img.label} className="w-full h-20 object-cover rounded-lg" />
                      <span className="text-[10px] font-bold text-slate-800 block truncate">{img.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ========================================================================= */}
      {/* BAGIAN HEADER (BIRU & PUTIH) - DIATUR AGAR HANYA MUNCUL DI DASHBOARD saja */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          
          {/* Bento Tile 1: Profile & Subject Banner (Kartu Biru) */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 font-bold text-[10px] uppercase px-3 py-1 rounded-full tracking-wider">
                  Portal Tentor / Guru Bimbel
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Aktif Mengajar
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white"> {currentUser?.name || 'Guru Pengajar'} </h2>
              <p className="text-xs text-slate-300">
                Mata Pelajaran: <strong className="text-white">Matematika Penalaran UTBK</strong> • Pengelola Bank Soal Guru
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Paket Soal Terdaftar: <strong className="text-amber-400 font-bold">{teacherPackages.length} Paket</strong></span>
              <span>Total Siswa Dipantau: <strong className="text-white font-bold">{students.length} Siswa</strong></span>
            </div>
          </div>

          {/* Bento Tile 2: Quick Metrics KPI (Kartu Putih - Statistik Soal) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full uppercase">
                LATEX READY
              </span>
            </div>

            <div className="mt-3 space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Soal Dibuat Tentor</p>
              <p className="text-3xl font-black text-slate-900">
                {teacherPackages.reduce((a, b) => a + b.questions.length, 0)} <span className="text-sm font-semibold text-slate-500">Soal</span>
              </p>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              Dapat ditambah & diedit secara langsung.
            </p>
          </div>
        </div>
      )}

      {/* Tab Dashboard Bento Feed */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <span>Pengumuman Terbaru Admin</span>
            </h3>
            <div className="space-y-3">
              {announcements.map((anno) => (
                <div key={anno.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1 hover:bg-slate-100/60 transition">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">
                      {anno.date}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Resmi</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{anno.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{anno.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-5 h-5 text-emerald-600" />
              <span>Ringkasan Nilai Teratas Siswa</span>
            </h3>
            <div className="space-y-3">
              {scores.map((sc) => (
                <div key={sc.id} className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 flex justify-between items-center hover:bg-blue-50/70 transition">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{sc.studentName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{sc.className} • {sc.subjectName}</p>
                  </div>
                  <div className="text-right bg-white border border-blue-200 px-3 py-1.5 rounded-xl">
                    <span className="font-black text-blue-900 text-base">{sc.finalScore}</span>
                    <span className="text-[10px] text-slate-400 block font-bold">POIN</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Soal: Dedicated Teacher Question Management */}
      {activeTab === 'soal' && (
        <div className="space-y-6">
          {/* Informational Notice Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-2xs">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-extrabold text-sm">Informasi Manajemen Soal Guru:</p>
              <p className="leading-relaxed">
                Pilih Mata Pelajaran di bawah ini untuk <strong>menginput soal baru</strong> atau <strong>melihat preview soal yang telah dibuat</strong>.
              </p>
            </div>
          </div>

          {/* VIEW 1: Daftar Nama Mapel Saja (selectedSubjectPkgId === null) */}
          {selectedSubjectPkgId === null ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span>Daftar Mata Pelajaran Guru</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mata pelajaran & paket soal yang ditugaskan kepada <strong>{currentUser?.name || 'Guru Pengajar'}</strong>.
                  </p>
                </div>

                <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 shrink-0">
                  {teacherPackages.length} Mata Pelajaran Aktif
                </div>
              </div>

              {teacherPackages.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                  <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Belum ada Paket Soal / Mapel yang ditugaskan oleh Admin.</p>
                  <p className="text-xs text-slate-500">Silakan meminta Admin untuk membuatkan Paket Soal & Kode Mapel terlebih dahulu.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teacherPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-5 border border-slate-200 rounded-3xl hover:border-blue-400 hover:shadow-md transition bg-white space-y-4 flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="bg-blue-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wide">
                            {pkg.code}
                          </span>
                          <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                            {pkg.questions.length} Soal Terbuat
                          </span>
                        </div>

                        <div>
                          <h4 className="font-black text-slate-900 text-base group-hover:text-blue-600 transition">
                            {pkg.subjectName}
                          </h4>
                          <p className="text-xs font-bold text-slate-600 mt-0.5">{pkg.name}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-1">
                          <p>Target Kelas: <strong className="text-slate-800">{pkg.classes.join(', ')}</strong></p>
                          <p>Durasi Ujian: <strong className="text-slate-800">{pkg.durationMinutes} Menit</strong></p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenInputQuestionModal(pkg.id)}
                          className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Input Soal Baru</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSubjectPkgId(pkg.id)}
                          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                          <span>Preview Soal ({pkg.questions.length})</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* VIEW 2: Preview Soal Yang Telah Dibuat untuk Mapel Terpilih */
            (() => {
              const selectedPkg = teacherPackages.find((p) => p.id === selectedSubjectPkgId) || teacherPackages[0];
              if (!selectedPkg) return null;

              return (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                  {/* Subject Detail Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedSubjectPkgId(null)}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition flex items-center gap-1.5 text-xs font-bold"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Daftar Mapel</span>
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md uppercase">
                            {selectedPkg.code}
                          </span>
                          <span className="text-xs font-extrabold text-blue-900">
                            {selectedPkg.subjectName}
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900 text-lg mt-0.5">{selectedPkg.name}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenInputQuestionModal(selectedPkg.id)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Input Soal Baru</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Count Summary Banner */}
                  <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          Pratinjau Soal Yang Telah Dibuat
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Total {selectedPkg.questions.length} butir soal terdaftar pada mata pelajaran ini.
                        </p>
                      </div>
                    </div>
                    <span className="bg-white border border-blue-200 text-blue-900 font-black text-xs px-3 py-1 rounded-xl">
                      {selectedPkg.questions.length} Soal
                    </span>
                  </div>

                  {/* List of Created Questions */}
                  <div className="space-y-4">
                    {selectedPkg.questions.length === 0 ? (
                      <div className="p-10 text-center text-xs text-slate-500 font-medium border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-3">
                        <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="font-bold text-slate-700">Belum ada butir soal yang dibuat untuk mata pelajaran ini.</p>
                        <button
                          type="button"
                          onClick={() => handleOpenInputQuestionModal(selectedPkg.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Input Soal Pertama</span>
                        </button>
                      </div>
                    ) : (
                      selectedPkg.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-4 sm:p-5 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-3 hover:border-slate-300 transition"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="font-extrabold text-xs text-slate-900">Soal Nomor {idx + 1}</span>
                              <span className="bg-slate-200/80 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                {q.typeLabel || q.questionType}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDuplicateQuestionItem(selectedPkg.id, q)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                title="Duplikat Soal"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Duplikat</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditQuestionModal(selectedPkg.id, q)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                title="Edit Soal"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestionItem(selectedPkg.id, q.id)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                title="Hapus Soal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Hapus</span>
                              </button>
                            </div>
                          </div>

                          {/* Question Content View */}
                          <div className="p-3 bg-white border border-slate-200/80 rounded-xl">
                            <KaTeXRenderer content={q.content} className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed" />
                          </div>

                          {/* Options Grid View */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                    : q.questionType === 'graded_choice' && opt.points && opt.points > 0
                                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="font-extrabold w-5 shrink-0 text-slate-500">{opt.label}.</span>
                                <KaTeXRenderer content={opt.optionText} inline />
                                {opt.isCorrect && (
                                  <span className="ml-auto text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-md shrink-0">
                                    {q.questionType === 'graded_choice' ? `Kunci Utama (+${opt.points})` : `Kunci (+${opt.points})`}
                                  </span>
                                )}
                                {!opt.isCorrect && q.questionType === 'graded_choice' && opt.points !== undefined && (
                                  <span className="ml-auto text-[10px] bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-md shrink-0">
                                    +{opt.points} Poin
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {selectedPkg.questions.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenInputQuestionModal(selectedPkg.id)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Input Soal Baru Lagi</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Tab Siswa (View Only) */}
      {activeTab === 'siswa' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Data Siswa Bimbel (Mode Lihat)</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">{students.length} Siswa Terdaftar</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase">
                <tr>
                  <th className="p-3.5">NIS</th>
                  <th className="p-3.5">Nama Siswa</th>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">{st.nis}</td>
                    <td className="p-3.5 font-bold text-slate-900">{st.name}</td>
                    <td className="p-3.5 text-slate-600">{st.className}</td>
                    <td className="p-3.5">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Hasil */}
      {activeTab === 'hasil' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span>Hasil Try Out CBT Siswa</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">{scores.length} Data Rekap</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase">
                <tr>
                  <th className="p-3.5">Nama Siswa</th>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5">Try Out</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5 text-right">Nilai Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {scores.map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-slate-900">{sc.studentName}</td>
                    <td className="p-3.5 text-slate-600">{sc.className}</td>
                    <td className="p-3.5 text-slate-600">{sc.tryoutTitle}</td>
                    <td className="p-3.5 text-slate-400">{sc.date}</td>
                    <td className="p-3.5 text-right font-black text-blue-900 text-sm">
                      <span className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1 rounded-xl">
                        {sc.finalScore} Poin
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

