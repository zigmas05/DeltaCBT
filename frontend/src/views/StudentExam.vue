<template>
  <div class="min-h-screen bg-slate-100 flex flex-col font-sans select-none" @mouseleave="handleBlur" @blur="handleBlur">
    <!-- Top Bar CBT Exam Navbar -->
    <header class="bg-blue-900 text-white px-6 py-3 flex justify-between items-center shadow-lg sticky top-0 z-30">
      <div class="flex items-center gap-3">
        <div class="bg-blue-600 px-3 py-1 rounded font-bold text-sm">CBT TEST</div>
        <div>
          <h1 class="text-sm font-bold">UTBK SBMPTN - Matematika Penalaran</h1>
          <p class="text-xs text-blue-200">Siswa: Ananda Rizky Pratama (12 IPA 1)</p>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <!-- Timer -->
        <div class="bg-blue-950 px-4 py-1.5 rounded-lg border border-blue-700 flex items-center gap-2">
          <span class="text-xs text-blue-300">Sisa Waktu:</span>
          <span class="text-lg font-mono font-bold text-amber-400">{{ formatTimer }}</span>
        </div>
        <button @click="finishExam" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-lg font-bold">
          Hentikan & Selesai
        </button>
      </div>
    </header>

    <!-- Main Exam Body -->
    <div class="p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
      <!-- Question Content Panel (Left 3 Columns) -->
      <div class="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-center border-b pb-3 mb-4">
            <span class="text-sm font-bold text-blue-900">Soal No. {{ currentIdx + 1 }} dari {{ questions.length }}</span>
            <span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-semibold">Tipe: {{ currentQ.typeLabel }}</span>
          </div>

          <!-- LaTeX Content Render -->
          <div class="text-base text-slate-800 leading-relaxed my-4 p-4 bg-slate-50 rounded-lg border border-slate-200" v-html="renderedQuestionContent"></div>

          <!-- Options -->
          <div class="space-y-3 mt-6">
            <div 
              v-for="opt in currentQ.options" 
              :key="opt.id"
              @click="toggleOption(opt.id)"
              :class="[
                'p-4 rounded-lg border cursor-pointer transition flex items-start gap-3',
                isSelected(opt.id) ? 'bg-blue-50 border-blue-600 text-blue-950 font-medium shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'
              ]"
            >
              <div :class="['w-6 h-6 rounded flex items-center justify-center font-bold text-xs mt-0.5', isSelected(opt.id) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700']">
                {{ opt.label }}
              </div>
              <div class="flex-1 text-sm" v-html="renderLatex(opt.text)"></div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons & Ragu-Ragu -->
        <div class="flex justify-between items-center border-t pt-4 mt-8">
          <button @click="prevQ" :disabled="currentIdx === 0" class="px-4 py-2 rounded text-sm font-bold bg-slate-200 text-slate-700 disabled:opacity-40">
            &laquo; Soal Sebelumnya
          </button>

          <label class="flex items-center gap-2 cursor-pointer bg-amber-50 border border-amber-300 px-4 py-2 rounded-lg text-amber-800 text-sm font-semibold">
            <input type="checkbox" v-model="currentAnswer.isDoubtful" class="w-4 h-4 text-amber-600 rounded">
            <span>Ragu-Ragu</span>
          </label>

          <button @click="nextQ" :disabled="currentIdx === questions.length - 1" class="px-4 py-2 rounded text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40">
            Soal Selanjutnya &raquo;
          </button>
        </div>
      </div>

      <!-- Question Palette Sidebar (Right 1 Column) -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-bold text-slate-800 border-b pb-2 mb-4">Navigasi Nomor Soal</h3>
          <div class="grid grid-cols-5 gap-2">
            <button
              v-for="(q, idx) in questions"
              :key="q.id"
              @click="currentIdx = idx"
              :class="[
                'h-10 rounded font-bold text-xs flex items-center justify-center border transition',
                getPaletteColor(idx)
              ]"
            >
              {{ idx + 1 }}
            </button>
          </div>
        </div>

        <div class="border-t pt-4 text-xs space-y-2 text-slate-600 mt-6">
          <div class="flex items-center gap-2"><span class="w-3 h-3 bg-blue-600 rounded"></span> Terjawab (Biru)</div>
          <div class="flex items-center gap-2"><span class="w-3 h-3 bg-amber-500 rounded"></span> Ragu-Ragu (Orange)</div>
          <div class="flex items-center gap-2"><span class="w-3 h-3 bg-slate-200 rounded"></span> Belum Dijawab (Abu)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import katex from 'katex';
import Swal from 'sweetalert2';

const currentIdx = ref(0);
const remainingSeconds = ref(5400); // 90 Menit

const questions = ref([
  {
    id: 101,
    typeLabel: 'Pilihan Ganda',
    content: 'Akar-akar persamaan kuadrat $x^2 - 5x + 6 = 0$ adalah $\\alpha$ dan $\\beta$. Nilai dari $\\alpha^2 + \\beta^2$ adalah ...',
    options: [
      { id: 1, label: 'A', text: '$13$' },
      { id: 2, label: 'B', text: '$19$' },
      { id: 3, label: 'C', text: '$25$' },
      { id: 4, label: 'D', text: '$30$' }
    ]
  },
  {
    id: 102,
    typeLabel: 'Pilihan Ganda Kompleks',
    content: 'Pilihlah semua fungsi matriks berikut yang mempunyai determinan nol (matriks singular):',
    options: [
      { id: 10, label: 'A', text: '$\\begin{pmatrix} 2 & 4 \\\\ 1 & 2 \\end{pmatrix}$' },
      { id: 11, label: 'B', text: '$\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$' },
      { id: 12, label: 'C', text: '$\\begin{pmatrix} 3 & 6 \\\\ 2 & 4 \\end{pmatrix}$' }
    ]
  }
]);

const answersMap = ref({
  0: { selectedIDs: [1], isDoubtful: false },
  1: { selectedIDs: [], isDoubtful: true }
});

const currentQ = computed(() => questions.value[currentIdx.value]);
const currentAnswer = computed(() => {
  if (!answersMap.value[currentIdx.value]) {
    answersMap.value[currentIdx.value] = { selectedIDs: [], isDoubtful: false };
  }
  return answersMap.value[currentIdx.value];
});

const renderLatex = (str) => {
  if (!str) return '';
  return str.replace(/\$(.*?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { throwOnError: false });
    } catch (e) {
      return formula;
    }
  });
};

const renderedQuestionContent = computed(() => renderLatex(currentQ.value.content));

const isSelected = (optId) => currentAnswer.value.selectedIDs.includes(optId);

const toggleOption = (optId) => {
  const arr = currentAnswer.value.selectedIDs;
  const idx = arr.indexOf(optId);
  if (idx > -1) {
    arr.splice(idx, 1);
  } else {
    arr.push(optId);
  }
};

const getPaletteColor = (idx) => {
  const ans = answersMap.value[idx];
  if (ans && ans.isDoubtful) return 'bg-amber-500 text-white border-amber-600';
  if (ans && ans.selectedIDs && ans.selectedIDs.length > 0) return 'bg-blue-600 text-white border-blue-700';
  return 'bg-slate-100 text-slate-700 border-slate-300';
};

const prevQ = () => { if (currentIdx.value > 0) currentIdx.value--; };
const nextQ = () => { if (currentIdx.value < questions.value.length - 1) currentIdx.value++; };

const formatTimer = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60);
  const s = remainingSeconds.value % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const handleBlur = () => {
  Swal.fire({
    title: 'PERINGATAN KIOSK SECURITY!',
    text: 'Anda terdeteksi keluar dari jendela ujian. Tindakan ini dicatat sebagai pelanggaran!',
    icon: 'warning',
    confirmButtonText: 'Kembali Ke Ujian'
  });
};

const finishExam = () => {
  Swal.fire({
    title: 'Selesaikan Try Out?',
    text: 'Apakah Anda yakin ingin mengumpulkan semua jawaban?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Kumpulkan!'
  }).then((res) => {
    if (res.isConfirmed) {
      Swal.fire('Terimakasih!', 'Jawaban Anda berhasil disimpan.', 'success');
    }
  });
};
</script>
