import { supabase, isSupabaseConfigured } from './supabase';
import { ClassItem, StaffUser, StudentUser } from '../types';


export interface SupabaseStatus {
  isConnected: boolean;
  message: string;
}

// Map Database Row -> StudentUser TypeScript Object
const mapRowToStudent = (row: any): StudentUser => ({
  id: Number(row.id),
  classId: Number(row.class_id || 1),
  className: row.class_name || '12 IPA 1',
  nis: row.nis || '',
  name: row.name || '',
  dateOfBirth: row.date_of_birth ? String(row.date_of_birth).substring(0, 10) : '2006-01-01',
  username: row.username || row.nis,
  password: row.password || '123',
  isActive: row.is_active ?? true,
});

// Map StudentUser -> Database Row
const mapStudentToRow = (student: StudentUser) => ({
  id: student.id,
  class_id: student.classId,
  class_name: student.className,
  nis: student.nis,
  name: student.name,
  date_of_birth: student.dateOfBirth,
  username: student.username,
  password: student.password || '123',
  is_active: student.isActive,
});

const mapRowToClass = (row: any): ClassItem => ({
  id: Number(row.id),
  name: row.name || '',
  studentCount: Number(row.student_count || 0),
});

const isLocalGeneratedId = (id: number) => id > 1_000_000_000_000;

const mapClassToRow = (cls: ClassItem) => ({
  id: cls.id,
  name: cls.name,
  student_count: cls.studentCount || 0,
  created_at: new Date().toISOString(),
});

const mapClassInsertRow = (cls: ClassItem) => ({
  name: cls.name,
  student_count: cls.studentCount || 0,
  created_at: new Date().toISOString(),
});

const mapRowToStaff = (row: any): StaffUser => ({
  id: Number(row.id),
  name: row.name || '',
  username: row.username || '',
  password: row.password_hash || row.password || '123',
  role: row.role === 'admin' ? 'admin' : 'guru',
});

const mapStaffToRow = (staff: StaffUser) => ({
  id: staff.id,
  name: staff.name,
  username: staff.username,
  role: staff.role,
  avatar_url: null,
  subjects: [],
  password_hash: staff.password || '123',
  created_at: new Date().toISOString(),
});

const mapStaffInsertRow = (staff: StaffUser) => ({
  name: staff.name,
  username: staff.username,
  role: staff.role,
  avatar_url: null,
  subjects: [],
  password_hash: staff.password || '123',
  created_at: new Date().toISOString(),
});

/**
  * Tes koneksi dan sinkronisasi awal dengan Supabase
  */
export async function checkSupabaseConnection(): Promise<SupabaseStatus> {
  if (!isSupabaseConfigured()) {
    return {
      isConnected: false,
      message: 'Kredensial Supabase URL / Anon Key belum dikonfigurasi.',
    };
  }

  try {
    const { data, error } = await supabase.from('student_users').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        // Tabel student_users belum dibuat di Supabase
        return {
          isConnected: false,
          message: 'Tabel student_users belum dibuat di SQL Editor Supabase.',
        };
      }
      return {
        isConnected: false,
        message: `Gagal query Supabase: ${error.message}`,
      };
    }

    return {
      isConnected: true,
      message: 'Terhubung ke Database Supabase!',
    };
  } catch (err: any) {
    return {
      isConnected: false,
      message: `Gagal terhubung: ${err.message || String(err)}`,
    };
  }
}

/**
  * Mengambil seluruh data siswa dari tabel student_users di Supabase
  * Jika tabel kosong, otomatis menyuntikkan (seed) data awal
  */
export async function getStudentsFromSupabase(): Promise<StudentUser[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('student_users')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Supabase getStudents error:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data.map(mapRowToStudent);
    } else {
      return [];
    }
  } catch (err) {
    console.error('Error fetching students from Supabase:', err);
    return null;
  }
}

/**
  * Menyimpan / Update data siswa ke tabel student_users Supabase
  */
export async function upsertStudentToSupabase(student: StudentUser): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const row = mapStudentToRow(student);
    const { error } = await supabase.from('student_users').upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error upsert student to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in upsertStudentToSupabase:', err);
    return false;
  }
}

/**
 * Autentikasi akun siswa langsung dari tabel student_users di Supabase
 */
export async function authenticateStudentSupabase(
  usernameOrNis: string,
  pass: string
): Promise<StudentUser | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const term = usernameOrNis.trim();
    // Query student_users table by username or nis
    const { data, error } = await supabase
      .from('student_users')
      .select('*')
      .or(`username.eq.${term},nis.eq.${term}`)
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    const expectedPass = row.password;

    if (pass === expectedPass) {
      return mapRowToStudent(row);
    }
    return null;
  } catch (err) {
    console.error('authenticateStudentSupabase exception:', err);
    return null;
  }
}

/**
 * Autentikasi akun staff/guru langsung dari tabel staff_users di Supabase
 */
export async function authenticateStaffSupabase(
  username: string,
  pass: string
): Promise<StaffUser | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const term = username.trim();
    const { data, error } = await supabase
      .from('staff_users')
      .select('*')
      .eq('username', term)
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    const expectedPass = row.password_hash || row.password;

    if (pass === expectedPass) {
      return mapRowToStaff(row);
    }
    return null;
  } catch (err) {
    console.error('authenticateStaffSupabase exception:', err);
    return null;
  }
}

/**
 * Menghapus data siswa dari tabel student_users Supabase
 */
export async function deleteStudentFromSupabase(studentId: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('student_users').delete().eq('id', studentId);
    if (error) {
      console.error('Error delete student from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deleteStudentFromSupabase:', err);
    return false;
  }
}

export async function getClassesFromSupabase(): Promise<ClassItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase.from('classes').select('*').order('id', { ascending: true });
    if (error) {
      console.warn('Supabase getClasses error:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data.map(mapRowToClass);
    }

    return [];
  } catch (err) {
    console.error('Error fetching classes from Supabase:', err);
    return null;
  }
}

export async function upsertClassToSupabase(cls: ClassItem): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const isNewLocalRecord = isLocalGeneratedId(cls.id);
    const row = isNewLocalRecord ? mapClassInsertRow(cls) : mapClassToRow(cls);

    const { error } = isNewLocalRecord
      ? await supabase.from('classes').insert(row)
      : await supabase.from('classes').upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error upsert class to Supabase:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error upsert class to Supabase:', err);
    return false;
  }
}

export async function getStaffFromSupabase(): Promise<StaffUser[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase.from('staff_users').select('*').order('id', { ascending: true });
    if (error) {
      console.warn('Supabase getStaff error:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data.map(mapRowToStaff);
    }

    return [];
  } catch (err) {
    console.error('Error fetching staff from Supabase:', err);
    return null;
  }
}

//untuk input dan edit data yang ada di staff atau guru
export async function upsertStaffToSupabase(member: StaffUser): Promise<boolean> {
  try {
    const BASE_URL = 'http://localhost:8080/api/staff';

    // Cek apakah ini data baru atau edit data lama.
    // Asumsinya ID lokal buatan Date.now() bernilai triliunan (> 1.000.000.000.000)
    const isNewRecord = member.id > 1000000000000;

    const payload = {
      name: member.name,
      username: member.username,
      password: member.password || '123',
      role: member.role,
    };

    // Tentukan URL dan Metode HTTP
    // Jika Insert -> POST /api/staff
    // Jika Update -> PUT /api/staff/:id
    const url = isNewRecord ? BASE_URL : `${BASE_URL}/${member.id}`;
    const method = isNewRecord ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Gagal ${isNewRecord ? 'menyimpan' : 'mengupdate'} ke backend Golang:`, errorData);
      return false;
    }

    const responseData = await response.json();
    console.log(`Sukses ${isNewRecord ? 'simpan' : 'update'} dari Golang:`, responseData);

    return true;
  } catch (err) {
    console.error('Error saat menghubungi backend Golang:', err);
    return false;
  }
}

// kalau di bawah ini untuk delete data staff atau guru
export async function deleteStaffFromSupabase(staffId: number): Promise<boolean> {
  try {
    // Endpoint mengarah ke DELETE /api/staff/:id
    const url = `http://localhost:8080/api/staff/${staffId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gagal menghapus di backend Golang:', errorData);
      return false;
    }

    console.log(`Sukses menghapus staff ID ${staffId} via Golang`);
    return true;
  } catch (err) {
    console.error('Error saat menghubungi backend Golang untuk hapus:', err);
    return false;
  }
}






// -------------------------
// Additional helpers used by AdminPanel
// -------------------------

const BACKEND_BASE = 'http://localhost:8080';

export async function createSubjectInGolang(code: string, name: string): Promise<any | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ code, name }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (err) {
    console.error('createSubjectInGolang error:', err);
    return null;
  }
}

export async function createPackageInGolang(payload: any): Promise<any | null> {
  try {
    const toInsert = {
      ...payload,
      subject_id: payload.subjectId ?? payload.subject_id ?? 0,
      subject_name: payload.subjectName || payload.subject_name || '',
      teacher_id: payload.teacherId ?? payload.teacher_id ?? 0,
      teacher_name: payload.teacherName || payload.teacher_name || '',
      code: payload.code,
      name: payload.name,
      classes: payload.classes || [],
      is_random_order: payload.isRandomOrder ?? payload.is_random_order ?? true,
      duration_minutes: payload.durationMinutes ?? payload.duration_minutes ?? 90,
    };
    const res = await fetch(`${BACKEND_BASE}/api/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(toInsert),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pkg = data.data || data;
    return {
      ...pkg,
      subjectId: pkg.subject_id ?? pkg.subjectId ?? toInsert.subject_id,
      subjectName: pkg.subject_name ?? pkg.subjectName ?? toInsert.subject_name,
      teacherId: pkg.teacher_id ?? pkg.teacherId ?? toInsert.teacher_id,
      teacherName: pkg.teacher_name ?? pkg.teacherName ?? toInsert.teacher_name,
      isRandomOrder: pkg.is_random_order ?? pkg.isRandomOrder ?? toInsert.is_random_order,
      durationMinutes: pkg.duration_minutes ?? pkg.durationMinutes ?? toInsert.duration_minutes,
      questions: pkg.questions ?? [],
    };
  } catch (err) {
    console.error('createPackageInGolang error:', err);
    return null;
  }
}

export async function updatePackageInGolang(id: number, payload: any): Promise<boolean> {
  try {
    const toUpdate = {
      ...payload,
      subject_id: payload.subjectId ?? payload.subject_id ?? 0,
      subject_name: payload.subjectName || payload.subject_name || '',
      teacher_id: payload.teacherId ?? payload.teacher_id ?? 0,
      teacher_name: payload.teacherName || payload.teacher_name || '',
      code: payload.code,
      name: payload.name,
      classes: payload.classes || [],
      is_random_order: payload.isRandomOrder ?? payload.is_random_order ?? true,
      duration_minutes: payload.durationMinutes ?? payload.duration_minutes ?? 90,
    };
    const res = await fetch(`${BACKEND_BASE}/api/packages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(toUpdate),
    });
    return res.ok;
  } catch (err) {
    console.error('updatePackageInGolang error:', err);
    return false;
  }
}

export async function deletePackageInGolang(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/packages/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    return res.ok;
  } catch (err) {
    console.error('deletePackageInGolang error:', err);
    return false;
  }
}

export async function createPackageInSupabase(payload: any): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const toInsert = {
      subject_id: payload.subjectId ?? payload.subject_id ?? 0,
      subject_name: payload.subjectName || payload.subject_name || '',
      teacher_id: payload.teacherId ?? payload.teacher_id ?? 0,
      teacher_name: payload.teacherName || payload.teacher_name || '',
      code: payload.code,
      name: payload.name,
      classes: payload.classes || [],
      is_random_order: payload.isRandomOrder ?? payload.is_random_order ?? true,
      duration_minutes: payload.durationMinutes ?? payload.duration_minutes ?? 90,
    };
    const { data, error } = await supabase.from('question_packages').insert(toInsert).select().single();
    if (error) {
      console.warn('createPackageInSupabase error:', error);
      return null;
    }
    return data ? {
      ...data,
      subjectId: data.subject_id ?? data.subjectId ?? toInsert.subject_id,
      subjectName: data.subject_name ?? data.subjectName ?? toInsert.subject_name,
      teacherId: data.teacher_id ?? data.teacherId ?? toInsert.teacher_id,
      teacherName: data.teacher_name ?? data.teacherName ?? toInsert.teacher_name,
      isRandomOrder: data.is_random_order ?? data.isRandomOrder ?? toInsert.is_random_order,
      durationMinutes: data.duration_minutes ?? data.durationMinutes ?? toInsert.duration_minutes,
      questions: data.questions ?? [],
    } : null;
  } catch (err) {
    console.error('createPackageInSupabase exception:', err);
    return null;
  }
}

export async function updatePackageInSupabase(id: number, payload: any): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const toUpdate: any = {};
    if (payload.name !== undefined) toUpdate.name = payload.name;
    if (payload.code !== undefined) toUpdate.code = payload.code;
    if (payload.classes !== undefined) toUpdate.classes = payload.classes;
    if (payload.durationMinutes !== undefined) toUpdate.duration_minutes = payload.durationMinutes;
    if (payload.isRandomOrder !== undefined) toUpdate.is_random_order = payload.isRandomOrder;

    const { error } = await supabase.from('question_packages').update(toUpdate).eq('id', id);
    if (error) {
      console.warn('updatePackageInSupabase error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('updatePackageInSupabase exception:', err);
    return false;
  }
}

export async function logAdminActionToSupabase(action: string, description: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const { error } = await supabase.from('admin_logs').insert({ action, description });
    if (error) console.error('[Supabase] Error logging admin action:', error);
  } catch (err) {
    console.error('[Supabase] Exception logging admin action:', err);
  }
}

export async function updateExamScoreReviewStatus(scoreId: number, showReview: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('exam_scores')
      .update({ show_review: showReview })
      .eq('id', scoreId);

    if (error) {
      console.error('[Supabase] Error updating review status:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception updating review status:', err);
    return false;
  }
}

export async function deletePackageInSupabase(id: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('question_packages').delete().eq('id', id);
    if (error) {
      console.warn('deletePackageInSupabase error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('deletePackageInSupabase exception:', err);
    return false;
  }
}

export async function upsertAnnouncementToSupabase(announcement: any): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const row = {
      id: announcement.id && !isLocalGeneratedId(announcement.id) ? announcement.id : undefined,
      title: announcement.title,
      content: announcement.content,
      target: announcement.target || 'all',
      author_name: announcement.authorName || 'Admin',
      date: announcement.date || new Date().toISOString(),
    } as any;

    const { error } = row.id
      ? await supabase.from('announcements').upsert(row, { onConflict: 'id' })
      : await supabase.from('announcements').insert(row);

    if (error) {
      console.warn('upsertAnnouncementToSupabase error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('upsertAnnouncementToSupabase exception:', err);
    return false;
  }
}

export async function deleteAnnouncementFromSupabase(announcementId: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
    if (error) {
      console.warn('deleteAnnouncementFromSupabase error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('deleteAnnouncementFromSupabase exception:', err);
    return false;
  }
}

export async function createQuestionInGolang(payload: any): Promise<any | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || data;
  } catch (err) {
    console.error('createQuestionInGolang error:', err);
    return null;
  }
}

export async function updateQuestionInGolang(id: number, payload: any): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('updateQuestionInGolang error:', err);
    return false;
  }
}

export async function deleteQuestionInGolang(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/questions/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    return res.ok;
  } catch (err) {
    console.error('deleteQuestionInGolang error:', err);
    return false;
  }
}



// -------------------------
// Additional getters/upserts used by App.tsx
// -------------------------

export async function getPackagesFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('question_packages').select('*').order('id', { ascending: true });
    if (error) {
      console.warn('getPackagesFromSupabase error:', error);
      return null;
    }
    // Pastikan setiap paket selalu punya field `questions` (array kosong),
    // karena tabel question_packages tidak menyimpan soal secara inline.
    return (data || []).map((pkg: any) => ({
      ...pkg,
      subjectId: pkg.subject_id ?? pkg.subjectId ?? 0,
      subjectName: pkg.subject_name ?? pkg.subjectName ?? '',
      teacherId: pkg.teacher_id ?? pkg.teacherId ?? 0,
      teacherName: pkg.teacher_name ?? pkg.teacherName ?? '',
      isRandomOrder: pkg.is_random_order ?? pkg.isRandomOrder ?? true,
      durationMinutes: pkg.duration_minutes ?? pkg.durationMinutes ?? 90,
      questions: pkg.questions ?? [],
    }));
  } catch (err) {
    console.error('getPackagesFromSupabase exception:', err);
    return null;
  }
}

export async function getPackagesFromGolang(): Promise<any[] | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/packages`);
    if (!res.ok) return null;
    const data = await res.json();
    const packages = data.data || data || [];
    return packages.map((pkg: any) => ({
      ...pkg,
      subjectId: pkg.subject_id ?? pkg.subjectId ?? 0,
      subjectName: pkg.subject_name ?? pkg.subjectName ?? '',
      teacherId: pkg.teacher_id ?? pkg.teacherId ?? 0,
      teacherName: pkg.teacher_name ?? pkg.teacherName ?? '',
      isRandomOrder: pkg.is_random_order ?? pkg.isRandomOrder ?? true,
      durationMinutes: pkg.duration_minutes ?? pkg.durationMinutes ?? 90,
      questions: (pkg.questions ?? []).map((q: any) => ({
        ...q,
        packageId: q.package_id ?? q.packageId ?? pkg.id,
        questionType: q.question_type ?? q.questionType ?? 'single_choice',
        typeLabel: q.type_label ?? q.typeLabel ?? '',
        pointsDefault: q.points_default ?? q.pointsDefault ?? 10,
        options: (q.options ?? []).map((opt: any) => ({
          ...opt,
          isCorrect: opt.isCorrect ?? opt.is_correct ?? false,
          optionText: opt.optionText ?? opt.option_text ?? '',
          questionId: opt.questionId ?? opt.question_id ?? q.id,
        }))
      })),
    }));
  } catch (err) {
    console.error('getPackagesFromGolang error:', err);
    return null;
  }
}

export async function getSubjectsFromGolang(): Promise<any[] | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/subjects`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || data || null;
  } catch (err) {
    console.error('getSubjectsFromGolang error:', err);
    return null;
  }
}

export async function getSubjectsFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('subjects').select('*').order('id', { ascending: true });
    if (error) {
      console.warn('getSubjectsFromSupabase error:', error);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('getSubjectsFromSupabase exception:', err);
    return null;
  }
}

export async function getBimbelSettingsFromSupabase(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('bimbel_settings').select('*').limit(1).maybeSingle();
    if (error) {
      console.warn('getBimbelSettingsFromSupabase error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('getBimbelSettingsFromSupabase exception:', err);
    return null;
  }
}

export async function updateBimbelSettingsInSupabase(settings: any): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('bimbel_settings').upsert({
      id: 1,
      bimbel_name: settings.bimbel_name || settings.bimbelName,
      owner_name: settings.owner_name || settings.ownerName,
      address: settings.address,
      phone: settings.phone
    });
    if (error) {
      console.warn('updateBimbelSettingsInSupabase error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('updateBimbelSettingsInSupabase exception:', err);
    return false;
  }
}

export async function getBimbelSettingsFromGolang(): Promise<any | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/bimbel-settings`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || data || null;
  } catch (err) {
    console.error('getBimbelSettingsFromGolang error:', err);
    return null;
  }
}

export async function updateBimbelSettingsInGolang(settings: any): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/bimbel-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch (err) {
    console.error('updateBimbelSettingsInGolang error:', err);
    return false;
  }
}

export async function getAnnouncementsFromGolang(): Promise<any[] | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/announcements`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || data || null;
  } catch (err) {
    console.error('getAnnouncementsFromGolang error:', err);
    return null;
  }
}

export async function createAnnouncementInGolang(announcement: any): Promise<any | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        title: announcement.title,
        target_class: announcement.target === 'all' ? 'Semua Kelas' : announcement.target,
        content: announcement.content,
        date: announcement.date,
        author: announcement.authorName || 'Admin',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || data || null;
  } catch (err) {
    console.error('createAnnouncementInGolang error:', err);
    return null;
  }
}

export async function deleteAnnouncementInGolang(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/announcements/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    return res.ok;
  } catch (err) {
    console.error('deleteAnnouncementInGolang error:', err);
    return false;
  }
}

export async function getTryoutsFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    let { data, error } = await supabase.from('tryout_items').select('*').order('id', { ascending: true });
    if (error || !data) {
      const res = await supabase.from('tryouts').select('*').order('id', { ascending: true });
      data = res.data;
    }
    if (!data) return null;
    return data.map((t: any) => ({
      id: Number(t.id),
      packageId: Number(t.package_id ?? t.packageId ?? 0),
      title: t.title || '',
      token: t.token || '',
      durationMinutes: Number(t.duration_minutes ?? t.durationMinutes ?? 90),
      startTime: t.start_time || t.startTime || new Date().toISOString(),
      endTime: t.end_time || t.endTime || new Date().toISOString(),
      isRandomOrder: t.is_random_order ?? t.isRandomOrder ?? true,
      showResultToStudent: t.show_result_to_student ?? t.showResultToStudent ?? true,
      isActive: t.is_active ?? t.isActive ?? true,
      allowedClassNames: Array.isArray(t.allowed_class_names)
        ? t.allowed_class_names
        : Array.isArray(t.allowedClassNames)
          ? t.allowedClassNames
          : [],
    }));
  } catch (err) {
    console.error('getTryoutsFromSupabase exception:', err);
    return null;
  }
}

export async function upsertTryoutToSupabase(tryout: any): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const row: any = {
      package_id: tryout.packageId ?? tryout.package_id ?? 0,
      title: tryout.title || '',
      token: tryout.token || '',
      duration_minutes: tryout.durationMinutes ?? tryout.duration_minutes ?? 90,
      start_time: tryout.startTime || tryout.start_time || new Date().toISOString(),
      end_time: tryout.endTime || tryout.end_time || new Date().toISOString(),
      is_random_order: tryout.isRandomOrder ?? tryout.is_random_order ?? true,
      show_result_to_student: tryout.showResultToStudent ?? tryout.show_result_to_student ?? true,
      is_active: tryout.isActive ?? tryout.is_active ?? true,
      allowed_class_names: tryout.allowedClassNames || tryout.allowed_class_names || [],
    };

    if (tryout.id && !isLocalGeneratedId(tryout.id)) {
      row.id = tryout.id;
    }

    if (!row.id) {
      const { data: existing } = await supabase.from('tryout_items')
        .select('id')
        .eq('package_id', row.package_id)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        row.id = existing.id;
      }
    }

    let { error } = row.id
      ? await supabase.from('tryout_items').update(row).eq('id', row.id)
      : await supabase.from('tryout_items').insert(row);

    if (error) {
      console.warn('upsertTryoutToSupabase tryout_items error, trying fallback to tryouts:', error);
      const res = row.id
        ? await supabase.from('tryouts').upsert(row, { onConflict: 'id' })
        : await supabase.from('tryouts').insert(row);
      error = res.error;
    }
    return !error;
  } catch (err) {
    console.error('upsertTryoutToSupabase exception:', err);
    return false;
  }
}

export async function deleteTryoutFromSupabase(id: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    // Prevent foreign key constraint errors by deleting associated sessions first
    await supabase.from('exam_sessions').delete().eq('tryout_id', id);

    let { error } = await supabase.from('tryout_items').delete().eq('id', id);
    if (error) {
      const res = await supabase.from('tryouts').delete().eq('id', id);
      error = res.error;
    }
    return !error;
  } catch (err) {
    console.error('deleteTryoutFromSupabase exception:', err);
    return false;
  }
}

export async function getAnnouncementsFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('announcements').select('*').order('id', { ascending: true });
    if (error) {
      console.warn('getAnnouncementsFromSupabase error:', error);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('getAnnouncementsFromSupabase exception:', err);
    return null;
  }
}

export async function getSettingsFromSupabase(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('settings').select('*').limit(1).single();
    if (error) {
      console.warn('getSettingsFromSupabase error:', error);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('getSettingsFromSupabase exception:', err);
    return null;
  }
}

export async function upsertSettingsToSupabase(settings: any): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const row = { id: 1, ...settings } as any;
    const { error } = await supabase.from('settings').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('upsertSettingsToSupabase error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('upsertSettingsToSupabase exception:', err);
    return false;
  }
}

export async function getScoresFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('exam_scores').select('*').order('id', { ascending: true });
    if (error) {
      console.warn('getScoresFromSupabase error:', error);
      return null;
    }
    return (data || []).map((sc: any) => ({
      id: Number(sc.id),
      studentNis: sc.student_nis || sc.studentNis || '',
      studentName: sc.student_name || sc.studentName || '',
      className: sc.class_name || sc.className || '',
      subjectName: sc.subject_name || sc.subjectName || '',
      tryoutTitle: sc.tryout_title || sc.tryoutTitle || '',
      finalScore: Number(sc.final_score ?? sc.score ?? 0),
      totalCorrect: Number(sc.total_correct ?? sc.totalCorrect ?? 0),
      totalWrong: Number(sc.total_wrong ?? sc.totalWrong ?? 0),
      date: sc.date || new Date().toISOString().split('T')[0],
      show_review: sc.show_review ?? false,
      answers: sc.answers || [],
    }));
  } catch (err) {
    console.error('getScoresFromSupabase exception:', err);
    return null;
  }
}

export async function upsertScoreToSupabase(score: any): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured — score not saved:', score);
    return false;
  }
  try {
    const row: any = {
      student_nis: score.studentNis || score.student_nis || '',
      student_name: score.studentName || score.student_name || '',
      class_name: score.className || score.class_name || '',
      subject_name: score.subjectName || score.subject_name || '',
      tryout_title: score.tryoutTitle || score.tryout_title || '',
      final_score: Number(score.finalScore ?? score.score ?? 0),
      total_correct: score.totalCorrect ?? 0,
      total_wrong: score.totalWrong ?? 0,
      show_review: score.show_review ?? false,
      date: score.date || new Date().toISOString().split('T')[0],
      answers: score.answers || [],
    };

    // Jangan sertakan ID lokal (timestamp-based) ke DB
    if (score.id && !isLocalGeneratedId(score.id)) {
      row.id = score.id;
    }

    // Cek apakah sudah ada record untuk siswa + tryout ini (upsert logic)
    let targetId = row.id;
    if (!targetId) {
      const { data: existing } = await supabase.from('exam_scores')
        .select('id')
        .eq('student_name', row.student_name)
        .eq('tryout_title', row.tryout_title)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        targetId = existing.id;
      }
    }

    // PENTING: Hapus id dari payload karena id di tabel adalah GENERATED ALWAYS AS IDENTITY
    const payload = { ...row };
    delete payload.id;
    delete payload.date; // Biarkan Postgres yang meng-handle dengan format YYYY-MM-DD (DEFAULT CURRENT_DATE)

    const { error } = targetId
      ? await supabase.from('exam_scores').update(payload).eq('id', targetId)
      : await supabase.from('exam_scores').insert(payload);

    if (error) {
      // Jika gagal karena kolom student_nis tidak ada, coba tanpa kolom itu
      if (error.message?.includes('student_nis') || error.code === '42703') {
        console.warn('[Supabase] student_nis column missing, retrying without it...');
        const rowFallback = { ...row };
        delete rowFallback.student_nis;
        const { error: err2 } = row.id
          ? await supabase.from('exam_scores').update(rowFallback).eq('id', row.id)
          : await supabase.from('exam_scores').insert(rowFallback);
        if (err2) {
          console.error('[Supabase] upsertScoreToSupabase fallback error:', err2, 'Row:', rowFallback);
          return false;
        }
        return true;
      }
      console.error('[Supabase] upsertScoreToSupabase error:', error, 'Row:', row);
      return false;
    }
    console.log('[Supabase] Score saved OK:', row.student_name, '→ score', row.score);
    return true;
  } catch (err) {
    console.error('[Supabase] upsertScoreToSupabase exception:', err);
    return false;
  }
}

export async function getSessionsFromSupabase(): Promise<any[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    let { data, error } = await supabase.from('exam_sessions').select('*').order('id', { ascending: true });
    if (error || !data) {
      const res = await supabase.from('sessions').select('*').order('id', { ascending: true });
      data = res.data;
    }
    if (!data) return null;
    return data.map((s: any) => ({
      id: Number(s.id),
      studentId: Number(s.student_id ?? s.studentId ?? 0),
      studentName: s.student_name || s.studentName || '',
      studentNis: s.student_nis || s.studentNis || '',
      className: s.class_name || s.className || '',
      tryoutId: Number(s.tryout_id ?? s.tryoutId ?? 0),
      tryoutTitle: s.tryout_title || s.tryoutTitle || '',
      startTime: s.start_time || s.startTime || '',
      endTime: s.end_time || s.endTime || undefined,
      status: s.status || 'active',
      answers: s.answers || undefined,
      finalScore: Number(s.final_score ?? s.finalScore ?? 0),
      violationsCount: Number(s.violations_count ?? s.violationsCount ?? 0),
    }));
  } catch (err) {
    console.error('getSessionsFromSupabase exception:', err);
    return null;
  }
}

export async function upsertSessionToSupabase(session: any): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const row: any = {
      student_id: session.studentId ?? session.student_id ?? 0,
      student_name: session.studentName || session.student_name || '',
      student_nis: session.studentNis || session.student_nis || '',
      class_name: session.className || session.class_name || '',
      tryout_id: session.tryoutId ?? session.tryout_id ?? 0,
      tryout_title: session.tryoutTitle || session.tryout_title || '',
      start_time: session.startTime || session.start_time || new Date().toISOString(),
      end_time: session.endTime || session.end_time || null,
      status: session.status || 'active',
      answers: session.answers || [],
      final_score: session.finalScore ?? session.final_score ?? 0,
      violations_count: session.violationsCount ?? session.violations_count ?? 0,
    };

    if (session.id && !isLocalGeneratedId(session.id)) {
      row.id = session.id;
    }

    if (!row.id) {
      const { data: existing } = await supabase.from('exam_sessions')
        .select('id')
        .eq('student_id', row.student_id)
        .eq('tryout_id', row.tryout_id)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        row.id = existing.id;
      }
    }

    let { error } = row.id
      ? await supabase.from('exam_sessions').update(row).eq('id', row.id)
      : await supabase.from('exam_sessions').insert(row);
    if (error) {
      console.warn('upsertSessionToSupabase exam_sessions error, fallback to sessions:', error);
      const res = row.id
        ? await supabase.from('sessions').upsert(row, { onConflict: 'id' })
        : await supabase.from('sessions').insert(row);
      error = res.error;
    }
    return !error;
  } catch (err) {
    console.error('upsertSessionToSupabase exception:', err);
    return false;
  }
}

export async function resetSessionInSupabase(sessionId: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const toUpdate = { status: 'active', violations_count: 0 };
    let { error } = await supabase.from('exam_sessions').update(toUpdate).eq('id', sessionId);
    if (error) {
      const res = await supabase.from('sessions').update(toUpdate).eq('id', sessionId);
      error = res.error;
    }
    return !error;
  } catch (err) {
    console.error('resetSessionInSupabase exception:', err);
    return false;
  }
}

export async function updateSessionStatusInSupabase(
  sessionId: number,
  status: string,
  endTime?: string,
  finalScore?: number,
  answers?: any[]
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const toUpdate: any = { status };
    if (endTime) toUpdate.end_time = endTime;
    if (finalScore !== undefined) toUpdate.final_score = finalScore;
    if (answers !== undefined) toUpdate.answers = answers;

    let { error } = await supabase.from('exam_sessions').update(toUpdate).eq('id', sessionId);
    if (error) {
      console.warn('updateSessionStatusInSupabase exam_sessions error, fallback to sessions:', error);
      const res = await supabase.from('sessions').update(toUpdate).eq('id', sessionId);
      error = res.error;
    }
    return !error;
  } catch (err) {
    return false;
  }
}

export async function recordSessionViolation(sessionId: number, violations: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('exam_sessions').update({ violations_count: violations }).eq('id', sessionId);
    if (error) {
      console.warn('recordSessionViolation error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('recordSessionViolation exception:', err);
    return false;
  }
}

export async function blockExamSession(sessionId: number, violations: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('exam_sessions').update({ status: 'blocked', violations_count: violations }).eq('id', sessionId);
    if (error) {
      console.warn('blockExamSession error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('blockExamSession exception:', err);
    return false;
  }
}

export async function clearAllExamSessionsFromSupabase(): Promise<boolean> {
  try {
    // Delete all records in exam_sessions where id > 0
    const { error } = await supabase.from('exam_sessions').delete().gt('id', 0);
    if (error) {
      console.warn('clearAllExamSessionsFromSupabase error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('clearAllExamSessionsFromSupabase exception:', err);
    return false;
  }
}
