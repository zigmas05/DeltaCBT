const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Chunk 1: Add handleExportStatusExcel and handleExportClassExcel
const chunk1_target = `  const handleExportParallelExcel = () => {
    if (!selectedParallelTryoutId) {
      alert('Silakan pilih Try Out terlebih dahulu!');
      return;
    }
    const data = getParallelResults();
    const selTryout = tryouts.find((t) => t.id === Number(selectedParallelTryoutId));
    const title = selTryout?.title || 'Try_Out';

    let csvContent = 'data:text/csv;charset=utf-8,Rank,Nama Siswa,NIS,Kelas,Try Out,Benar,Salah,Nilai Akhir\\n';
    data.forEach((row, idx) => {
      csvContent += \`\${idx + 1},"\${row.studentName}","\${row.studentNis}","\${row.className}","\${row.tryoutTitle}",\${row.totalCorrect},\${row.totalWrong},\${row.finalScore}\\n\`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', \`Hasil_Pararel_\${title.replace(/\\s+/g, '_')}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };`;

const chunk1_replacement = chunk1_target + `

  const handleExportStatusExcel = () => {
    const exportData = statusPageSize === 'all' ? sessions : sessions.slice(0, statusPageSize);
    if (exportData.length === 0) {
      alert('Tidak ada data status untuk diekspor!');
      return;
    }
    let csvContent = 'data:text/csv;charset=utf-8,Nama Siswa,Kelas,Mata Ujian,Mulai Waktu,Durasi Siswa,Soal Terjawab,Soal Belum,Soal Ragu\\n';
    exportData.forEach((s) => {
      const tryout = tryouts.find(t => t.id === s.tryoutId);
      const pkg = tryout ? packages.find(p => p.id === tryout.packageId) : null;
      const subjectName = pkg ? subjects.find(sub => sub.id === pkg.subjectId)?.name || 'Mata Pelajaran Umum' : '-';
      const totalQuestions = pkg?.questions?.length || 30;
      
      let parsedAnswers: any[] = [];
      if (typeof s.answers === 'string') {
        try { parsedAnswers = JSON.parse(s.answers); } catch (e) { }
      } else if (Array.isArray(s.answers)) {
        parsedAnswers = s.answers;
      }
      const answered = parsedAnswers.filter(a => a && a.selectedOptionIds && a.selectedOptionIds.length > 0).length;
      const doubt = parsedAnswers.filter(a => a && a.isDoubtful).length;
      const unanswered = totalQuestions - answered;
      
      let durationStr = '-';
      if (s.status === "finished" && s.endTime && s.startTime) {
        const diffSecs = Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000);
        const mm = Math.floor(diffSecs / 60);
        const ss = diffSecs % 60;
        durationStr = \`\${mm}m \${ss}s\`;
      } else if (s.status === "active" && s.startTime) {
        durationStr = 'Sedang Berjalan';
      }
      
      const startTimeStr = s.startTime ? new Date(s.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
      csvContent += \`"\${s.studentName}","\${s.className}","\${subjectName}","\${startTimeStr}","\${durationStr}",\${answered},\${unanswered},\${doubt}\\n\`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', \`Status_Try_Out_Siswa.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportClassExcel = () => {
    const data = getClassResults();
    if (data.length === 0) {
      alert('Tidak ada data hasil kelas untuk diekspor!');
      return;
    }
    const tryoutTitle = tryouts.find(t => t.id === Number(selectedClassTryoutId))?.title || 'Try_Out';
    let csvContent = 'data:text/csv;charset=utf-8,NIS,Nama Siswa,Benar,Salah,Nilai Akhir\\n';
    data.forEach((row) => {
      csvContent += \`"\${row.studentNis}","\${row.studentName}",\${row.totalCorrect},\${row.totalWrong},\${row.finalScore}\\n\`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', \`Hasil_Kelas_\${selectedResultClassName}_\${tryoutTitle.replace(/\\s+/g, '_')}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };`;

content = content.replace(chunk1_target, chunk1_replacement);

// Chunk 2: Add Status Excel button
const chunk2_target = `                      {/* Button Paksa Henti Masal */}
                      <button
                        onClick={handleForceStopAllSessions}
                        className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/20 transition"
                        title="Paksa henti seluruh peserta yang sedang mengerjakan ujian"
                      >
                        <StopCircle className="w-4 h-4" />
                        <span>Paksa Henti Masal</span>
                      </button>

                      {/* Button Fullscreen Toggle */}`;

const chunk2_replacement = `                      {/* Button Paksa Henti Masal */}
                      <button
                        onClick={handleForceStopAllSessions}
                        className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/20 transition"
                        title="Paksa henti seluruh peserta yang sedang mengerjakan ujian"
                      >
                        <StopCircle className="w-4 h-4" />
                        <span>Paksa Henti Masal</span>
                      </button>

                      {/* Button Export Status Excel */}
                      <button
                        onClick={handleExportStatusExcel}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
                        title="Export Data Status ke Excel (CSV)"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Export to Excel</span>
                      </button>

                      {/* Button Fullscreen Toggle */}`;

content = content.replace(chunk2_target, chunk2_replacement);

// Chunk 3: Add Class Excel button
const chunk3_target = `                      {tryouts.map((tr) => (
                        <option key={tr.id} value={tr.id}>
                          {tr.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Data Table / Empty State */}`;

const chunk3_replacement = `                      {tryouts.map((tr) => (
                        <option key={tr.id} value={tr.id}>
                          {tr.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleExportClassExcel}
                    disabled={!selectedResultClassName || !selectedClassTryoutId}
                    className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm transition \${
                      selectedResultClassName && selectedClassTryoutId
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }\`}
                    title="Export Data Hasil Kelas ke File Excel (CSV)"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export to Excel</span>
                  </button>
                </div>

                {/* Data Table / Empty State */}`;

content = content.replace(chunk3_target, chunk3_replacement);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Replacements executed.');
