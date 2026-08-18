<template>
  <div class="min-h-screen bg-slate-100 flex flex-col font-sans">
    <!-- Header Admin -->
    <header class="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
          CB
        </div>
        <div>
          <h1 class="text-lg font-bold leading-tight">Bimbel Champion - Admin Panel</h1>
          <p class="text-xs text-blue-200">Manajemen Ujian & Try Out Terpadu</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm bg-blue-800 px-3 py-1 rounded-full border border-blue-700">Role: Admin Utama</span>
        <button @click="logout" class="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-sm font-medium transition">
          Logout
        </button>
      </div>
    </header>

    <!-- Content -->
    <div class="p-6 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Stats Cards -->
      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <p class="text-xs text-slate-500 uppercase font-semibold">Total Siswa Aktif</p>
        <p class="text-3xl font-extrabold text-blue-900 mt-1">142</p>
      </div>
      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <p class="text-xs text-slate-500 uppercase font-semibold">Bank Paket Soal</p>
        <p class="text-3xl font-extrabold text-blue-900 mt-1">28</p>
      </div>
      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <p class="text-xs text-slate-500 uppercase font-semibold">Try Out Aktif</p>
        <p class="text-3xl font-extrabold text-emerald-600 mt-1">2</p>
      </div>
      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <p class="text-xs text-slate-500 uppercase font-semibold">Token Tryout (20 mnt)</p>
        <div class="flex items-center justify-between mt-1">
          <span class="text-2xl font-mono font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{{ currentToken }}</span>
          <button @click="refreshToken" class="text-xs bg-blue-600 text-white px-2 py-1.5 rounded hover:bg-blue-700">
            Refresh
          </button>
        </div>
      </div>

      <!-- Main Management Panel -->
      <div class="md:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>Pantau Status Sesi Peserta Ujian (Kiosk Security Monitor)</span>
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th class="p-3">Nama Siswa</th>
                <th class="p-3">Kelas</th>
                <th class="p-3">NIS</th>
                <th class="p-3">Status Sesi</th>
                <th class="p-3">Waktu Mulai</th>
                <th class="p-3 text-center">Aksi (Reset Sesi)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in studentSessions" :key="student.id" class="border-b border-slate-100 hover:bg-slate-50">
                <td class="p-3 font-medium text-slate-800">{{ student.name }}</td>
                <td class="p-3">{{ student.class_name }}</td>
                <td class="p-3 font-mono text-xs">{{ student.nis }}</td>
                <td class="p-3">
                  <span v-if="student.status === 'active'" class="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold">Aktif Mengerjakan</span>
                  <span v-else-if="student.status === 'blocked'" class="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-semibold">Terblokir (Keluar Layar)</span>
                  <span v-else class="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-semibold">Selesai</span>
                </td>
                <td class="p-3 text-xs text-slate-500">{{ student.start_time }}</td>
                <td class="p-3 text-center">
                  <button v-if="student.status === 'blocked'" @click="resetSession(student)" class="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs font-semibold">
                    Reset Terblokir
                  </button>
                  <span v-else class="text-xs text-slate-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Swal from 'sweetalert2';

const currentToken = ref('AX982');
const studentSessions = ref([
  { id: 1, name: 'Ananda Rizky Pratama', class_name: '12 IPA 1', nis: '20241001', status: 'active', start_time: '08:00 WIB' },
  { id: 2, name: 'Siti Nurhaliza', class_name: '12 IPA 1', nis: '20241002', status: 'blocked', start_time: '08:05 WIB' },
  { id: 3, name: 'Bagas Aditya', class_name: '12 IPA 2', nis: '20241003', status: 'finished', start_time: '07:55 WIB' }
]);

const refreshToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let res = '';
  for (let i = 0; i < 5; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  currentToken.value = res;
  Swal.fire('Token Berhasil Diperbarui', `Token baru: ${res} (Berlaku 20 menit)`, 'success');
};

const resetSession = (student) => {
  student.status = 'active';
  Swal.fire('Berhasil Reset', `Sesi ujian ${student.name} direset menjadi aktif.`, 'success');
};

const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};
</script>
