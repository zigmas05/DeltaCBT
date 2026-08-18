import { QuestionItem, QuestionOption, StudentAnswer } from '../types';

export interface TrueFalseResult {
  totalScore: number;
  maxPossibleScore: number;
  correctStatementsCount: number;
  totalStatementsCount: number;
  isFullyCorrect: boolean;
  details: Array<{
    optionId: number;
    label: string;
    keyIsCorrect: boolean; // true = Kunci Benar, false = Kunci Salah
    userChoice: 'benar' | 'salah' | boolean | undefined;
    isMatch: boolean;
    pointsEarned: number;
  }>;
}

/**
 * Logika penilaian untuk soal tipe Benar / Salah (true_false) Point per Pernyataan.
 * 
 * Aturan Penilaian:
 * 1. Setiap opsi dalam array options mewakili 1 baris pernyataan.
 * 2. `option.isCorrect`: true = kunci Benar, false = kunci Salah.
 * 3. Jika jawaban siswa ('benar'|'salah'|boolean) cocok dengan `isCorrect` (baik kunci Benar maupun Salah):
 *    Siswa mendapatkan nilai `option.points` untuk baris tersebut.
 * 4. Jika jawaban siswa tidak cocok / belum dijawab:
 *    Nilai untuk baris tersebut = 0.
 * 5. Total skor = penjumlahan poin dari setiap baris pernyataan yang dijawab benar.
 */
export function calculateTrueFalseScore(
  options: QuestionOption[],
  userAnswers: Record<number, 'benar' | 'salah' | boolean | undefined> | undefined,
  pointsDefaultFallback: number = 0
): TrueFalseResult {
  let totalScore = 0;
  let maxPossibleScore = 0;
  let correctStatementsCount = 0;
  const totalStatementsCount = options.length;
  const details: TrueFalseResult['details'] = [];

  const fallbackPointsPerRow = pointsDefaultFallback > 0 && totalStatementsCount > 0
    ? Math.floor(pointsDefaultFallback / totalStatementsCount)
    : 1;

  options.forEach((opt, idx) => {
    const rowPoints = (opt.points !== undefined && opt.points !== null && opt.points > 0)
      ? Number(opt.points)
      : fallbackPointsPerRow;

    maxPossibleScore += rowPoints;

    const rawUserVal = userAnswers ? userAnswers[opt.id] : undefined;

    let userBool: boolean | undefined = undefined;
    if (rawUserVal !== undefined && rawUserVal !== null) {
      if (typeof rawUserVal === 'boolean') {
        userBool = rawUserVal;
      } else if (typeof rawUserVal === 'string') {
        const lower = rawUserVal.toLowerCase().trim();
        if (lower === 'benar' || lower === 'true' || lower === 'b' || lower === '1') {
          userBool = true;
        } else if (lower === 'salah' || lower === 'false' || lower === 's' || lower === '0') {
          userBool = false;
        }
      }
    }

    const keyBool = Boolean(opt.isCorrect); // true = Kunci Benar, false = Kunci Salah
    const isMatch = userBool !== undefined && userBool === keyBool;
    const pointsEarned = isMatch ? rowPoints : 0;

    if (isMatch) {
      totalScore += pointsEarned;
      correctStatementsCount += 1;
    }

    details.push({
      optionId: opt.id,
      label: opt.label || `Pernyataan ${idx + 1}`,
      keyIsCorrect: keyBool,
      userChoice: rawUserVal,
      isMatch,
      pointsEarned,
    });
  });

  return {
    totalScore,
    maxPossibleScore,
    correctStatementsCount,
    totalStatementsCount,
    isFullyCorrect: correctStatementsCount === totalStatementsCount && totalStatementsCount > 0,
    details,
  };
}

export interface ExamScoreResult {
  totalObtained: number;
  correctCount: number;
  wrongCount: number;
}

/**
 * Calculates the total exam score based on the questions and student answers.
 * Handles single_choice, graded_choice, complex_choice, and true_false.
 */
export function calculateTotalExamScore(
  questions: QuestionItem[],
  answers: Record<number, StudentAnswer>,
  tfAnswers: Record<number, Record<number, 'benar' | 'salah' | boolean | undefined>>
): ExamScoreResult {
  let totalObtained = 0;
  let correctCount = 0;
  let wrongCount = 0;

  questions.forEach((q) => {
    const userAns = answers[q.id];
    const selected = userAns ? userAns.selectedOptionIds : [];

    if (q.questionType === 'single_choice') {
      if (selected.length === 1) {
        const correctOpt = q.options.find((o) => o.isCorrect);
        if (correctOpt && correctOpt.id === selected[0]) {
          totalObtained += (correctOpt.points && correctOpt.points > 0 ? correctOpt.points : q.pointsDefault);
          correctCount++;
        } else {
          wrongCount++;
        }
      } else {
        wrongCount++;
      }
    } else if (q.questionType === 'graded_choice') {
      if (selected.length === 1) {
        const selectedOpt = q.options.find((o) => o.id === selected[0]);
        if (selectedOpt) {
          const optPts = selectedOpt.points !== undefined && selectedOpt.points !== null ? selectedOpt.points : 0;
          totalObtained += optPts;
          if (optPts > 0) {
            correctCount++;
          } else {
            wrongCount++;
          }
        } else {
          wrongCount++;
        }
      } else {
        wrongCount++;
      }
    } else if (q.questionType === 'complex_choice') {
      if (selected.length >= q.options.length) {
        wrongCount++;
      } else {
        let qScore = 0;
        let cCount = 0;
        selected.forEach((selId) => {
          const opt = q.options.find((o) => o.id === selId);
          if (opt && opt.isCorrect) {
            qScore += (opt.points && opt.points > 0 ? opt.points : q.pointsDefault);
            cCount++;
          }
        });
        totalObtained += qScore;
        if (cCount > 0) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    } else if (q.questionType === 'true_false') {
      const userTfAnswers = tfAnswers[q.id];
      if (userTfAnswers && Object.keys(userTfAnswers).length > 0) {
        const res = calculateTrueFalseScore(q.options, userTfAnswers, q.pointsDefault);
        totalObtained += res.totalScore;
        if (res.totalScore > 0) correctCount++;
        else wrongCount++;
      } else {
        wrongCount++;
      }
    }
  });

  return { totalObtained, correctCount, wrongCount };
}
