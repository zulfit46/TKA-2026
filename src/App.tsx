import React, { useState, useEffect } from 'react';
import { Student, StudentUpdateRequest } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { DataSiswaView } from './components/DataSiswaView';
import { DaftarTKAView } from './components/DaftarTKAView';
import {
  initAuthListener,
  signInWithGoogle,
  getStoredAccessToken,
  logoutGoogle,
} from './lib/firebase';
import { fetchStudents, updateStudentData, uploadPhotoToDrive, fetchSubjects } from './lib/api';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

// Fallback demo students in case Google Sheets is newly initialized or connecting
const DEMO_STUDENTS: Student[] = [
  {
    rowIndex: 2,
    no: '1',
    nipd: '222310001',
    nisn: '0051234567',
    nama: 'Ahmad Rizky Pratama',
    prog_keahlian: 'Rekayasa Perangkat Lunak',
    jk: 'L',
    tgl_lahir: '2008-04-12',
    nama_ortu: 'Bambang Pratama',
    keikutsertaan: 'Ya',
    mapel_1: 'Matematika',
    mapel_2: 'Teknik Informatika / Informatika',
    link_foto: '',
    status_verval: 'Sesuai',
  },
  {
    rowIndex: 3,
    no: '2',
    nipd: '222310002',
    nisn: '0057654321',
    nama: 'Siti Nur Aisyah',
    prog_keahlian: 'Teknik Komputer & Jaringan',
    jk: 'P',
    tgl_lahir: '2008-08-25',
    nama_ortu: 'Supriyadi',
    keikutsertaan: 'Ya',
    mapel_1: 'Bahasa Inggris',
    mapel_2: 'Teknik Komputer & Jaringan (TKJ)',
    link_foto: '',
    status_verval: '',
  },
  {
    rowIndex: 4,
    no: '3',
    nipd: '222310003',
    nisn: '0059988776',
    nama: 'Budi Santoso',
    prog_keahlian: 'Akuntansi & Keuangan',
    jk: 'L',
    tgl_lahir: '2008-01-15',
    nama_ortu: 'Hadi Santoso',
    keikutsertaan: 'Tidak',
    mapel_1: '',
    mapel_2: '',
    link_foto: '',
    status_verval: 'Tidak Sesuai',
  },
];

async function compressImage(file: File, maxW = 240, maxH = 320, initialQuality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        if (height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }

        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/jpeg', initialQuality);

        // Keep string size well below Google Sheets 50,000 limit
        if (dataUrl.length > 35000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.45);
        }
        if (dataUrl.length > 35000) {
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.round(width * 0.75);
          smallCanvas.height = Math.round(height * 0.75);
          const sCtx = smallCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
            dataUrl = smallCanvas.toDataURL('image/jpeg', 0.4);
          }
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memuat file gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file foto'));
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [googleToken, setGoogleToken] = useState<string | null>(getStoredAccessToken());
  const [hasGoogleAuth, setHasGoogleAuth] = useState<boolean>(!!getStoredAccessToken());

  const getInitialStudents = (): Student[] => {
    const saved = localStorage.getItem('cached_students_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((s: Student) => s.nisn && String(s.nisn).trim().length >= 5);
          if (valid.length > 0) return valid;
        }
      } catch {
        // fallback to DEMO_STUDENTS
      }
    }
    return DEMO_STUDENTS;
  };

  const [students, setStudents] = useState<Student[]>(getInitialStudents);

  useEffect(() => {
    localStorage.setItem('cached_students_data', JSON.stringify(students));
  }, [students]);

  const [currentNisn, setCurrentNisn] = useState<string | null>(() => {
    const saved = localStorage.getItem('logged_in_nisn');
    if (!saved) return null;
    if (saved.trim().length < 5) {
      localStorage.removeItem('logged_in_nisn');
      return null;
    }
    return saved.trim();
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('data-siswa');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [mapel1Options, setMapel1Options] = useState<string[]>([]);
  const [mapel2Options, setMapel2Options] = useState<string[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initAuthListener(
      (_user, token) => {
        setGoogleToken(token);
        setHasGoogleAuth(true);
      },
      () => {
        setGoogleToken(null);
        setHasGoogleAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch subjects from mapel1 and mapel2 sheets
  const loadSubjectsFromSheet = async (token: string) => {
    try {
      const { mapel1, mapel2 } = await fetchSubjects(token);
      if (mapel1 && mapel1.length > 0) setMapel1Options(mapel1);
      if (mapel2 && mapel2.length > 0) setMapel2Options(mapel2);
    } catch (err: any) {
      console.warn('Subject list fetch warning:', err.message);
    }
  };

  // Fetch students from Google Sheets when token is available
  const loadStudentsFromSheet = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStudents(token);
      if (data && data.length > 0) {
        setStudents(data);
      }
      // Also load subjects list from sheet tabs mapel1 & mapel2
      loadSubjectsFromSheet(token);
    } catch (err: any) {
      console.warn('Google Sheets fetch warning:', err.message);
      const isAuthError =
        err.message?.includes('kedaluwarsa') ||
        err.message?.includes('UNAUTHORIZED') ||
        err.message?.includes('authentication credentials') ||
        err.message?.includes('401');

      if (isAuthError) {
        await logoutGoogle();
        setGoogleToken(null);
        setHasGoogleAuth(false);
        setError('Gagal memuat data dari Spreadsheet server. Menampilkan data lokal.');
      } else {
        setError(err.message || 'Gagal memuat data dari Spreadsheet. Menampilkan data lokal.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentsFromSheet(googleToken || '');
  }, [googleToken]);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      setGoogleToken(result.accessToken);
      setHasGoogleAuth(true);
      await loadStudentsFromSheet(result.accessToken);
    } catch (err: any) {
      setError('Gagal login Google: ' + (err.message || 'Izin OAuth ditolak'));
    }
  };

  const handleLoginWithNisn = (nisn: string) => {
    const trimmed = nisn.trim();
    const found = students.find((s) => {
      const sNisn = String(s.nisn).trim();
      if (sNisn === trimmed) return true;
      const sNum = parseInt(sNisn, 10);
      const inputNum = parseInt(trimmed, 10);
      return !isNaN(sNum) && !isNaN(inputNum) && inputNum >= 10000 && sNum === inputNum;
    });

    if (found) {
      const realNisn = String(found.nisn).trim();
      setCurrentNisn(realNisn);
      localStorage.setItem('logged_in_nisn', realNisn);
      setActiveTab('data-siswa');
    }
  };

  const handleLogout = () => {
    setCurrentNisn(null);
    localStorage.removeItem('logged_in_nisn');
    setActiveTab('data-siswa');
  };

  const handleUpdateStudent = async (updatedFields: Partial<Student>) => {
    if (!currentNisn) return;

    // Update local state first for immediate snappy responsiveness
    setStudents((prev) =>
      prev.map((s) => (s.nisn === currentNisn ? { ...s, ...updatedFields } : s))
    );

    setSaving(true);
    try {
      await updateStudentData(googleToken, currentNisn, updatedFields);
    } catch (err: any) {
      console.error('Update Sheet Error:', err);
      const isAuthError =
        err.message?.includes('kedaluwarsa') ||
        err.message?.includes('UNAUTHORIZED') ||
        err.message?.includes('authentication credentials') ||
        err.message?.includes('401');

      if (isAuthError && googleToken) {
        await logoutGoogle();
        setGoogleToken(null);
        setHasGoogleAuth(false);
        setError('Sesi Google OAuth telah kedaluwarsa. Data dialihkan ke Google Apps Script.');
      }
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (file: File): Promise<string> => {
    if (!currentNisn) throw new Error('Siswa belum memilih NISN');

    setSaving(true);
    try {
      const result = await uploadPhotoToDrive(googleToken, currentNisn, file);
      setStudents((prev) =>
        prev.map((s) =>
          s.nisn === currentNisn ? { ...s, link_foto: result.link_foto } : s
        )
      );
      return result.link_foto;
    } catch (driveErr: any) {
      console.warn('Upload foto via backend gagal, mencoba fallback Base64:', driveErr);
      const compressedDataUrl = await compressImage(file);
      setStudents((prev) =>
        prev.map((s) =>
          s.nisn === currentNisn ? { ...s, link_foto: compressedDataUrl } : s
        )
      );
      try {
        await updateStudentData(googleToken, currentNisn, { link_foto: compressedDataUrl });
      } catch (e) {
        console.warn('Gagal mengupdate link_foto fallback ke sheet:', e);
      }
      return compressedDataUrl;
    } finally {
      setSaving(false);
    }
  };

  const currentStudent = students.find((s) => s.nisn === currentNisn) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentStudent={currentStudent}
        hasGoogleAuth={hasGoogleAuth}
        onLogout={handleLogout}
        onGoogleSignIn={handleGoogleSignIn}
      />

      {/* Content Container */}
      {!currentStudent ? (
        <LoginScreen
          students={students}
          loading={loading}
          error={error}
          hasGoogleAuth={hasGoogleAuth}
          onGoogleSignIn={handleGoogleSignIn}
          onLoginWithNisn={handleLoginWithNisn}
          onRefreshData={() => googleToken && loadStudentsFromSheet(googleToken)}
        />
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 lg:p-8 gap-6">
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentStudent={currentStudent}
          />

          {/* Main View Area */}
          <main className="flex-1 min-w-0">
            {activeTab === 'data-siswa' && (
              <DataSiswaView
                student={currentStudent}
                onUpdate={handleUpdateStudent}
                saving={saving}
              />
            )}

            {activeTab === 'daftar-tka' && (
              <DaftarTKAView
                student={currentStudent}
                onUpdate={handleUpdateStudent}
                onUploadPhoto={handleUploadPhoto}
                saving={saving}
                mapel1Options={mapel1Options}
                mapel2Options={mapel2Options}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
