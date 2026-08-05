import { Student, StudentUpdateRequest } from '../types';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw6psd_n0hQfKTAaM3sJEeRqckGOX9WMDCps07QETKMnSWYlOQsaw0AGNe_CISM1Kh9/exec';

export async function fetchStudents(token?: string | null): Promise<Student[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/students', { headers });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) return data;
    }
  } catch (netErr) {
    console.warn('Backend /api/students fetch failed, attempting direct Apps Script fetch:', netErr);
  }

  // Fallback directly to Google Apps Script Web App
  try {
    const gasRes = await fetch(`${APPS_SCRIPT_URL}?action=getStudents`);
    if (gasRes.ok) {
      const data = await gasRes.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          ...item,
          t_lahir: item.t_lahir || item.tempat_lahir || item.tempatLahir || '',
        }));
      }
    }
  } catch (gasErr) {
    console.error('Apps Script direct fetch failed:', gasErr);
  }

  throw new Error('Gagal mengambil data siswa. Silakan periksa koneksi internet Anda.');
}

export async function updateStudentData(
  token: string | undefined | null,
  nisn: string,
  data: StudentUpdateRequest
): Promise<{ success: boolean; message: string; data?: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`/api/students/${nisn}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend update failed, attempting direct Apps Script update:', err);
  }

  // Fallback directly to Google Apps Script Web App
  try {
    const gasRes = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'updateStudent',
        nisn,
        ...data,
      }),
    });
    if (gasRes.ok) {
      return await gasRes.json();
    }
  } catch (gasErr) {
    console.error('Apps Script update error:', gasErr);
  }

  throw new Error('Gagal memperbarui data siswa.');
}

export async function uploadPhotoToDrive(
  token: string | undefined | null,
  nisn: string,
  file: File
): Promise<{ success: boolean; link_foto: string; message: string }> {
  if (file.size > 1 * 1024 * 1024) {
    throw new Error('Ukuran file foto melebihi 1 MB. Foto tidak dapat disimpan.');
  }

  const formData = new FormData();
  formData.append('nisn', nisn);
  formData.append('photo', file);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/upload-photo', {
      method: 'POST',
      headers,
      body: formData,
    });
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend upload failed, fallback to Base64 via Apps Script:', err);
  }

  // Base64 upload fallback to Apps Script
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const ext = file.type.includes('png') ? '.png' : '.jpg';
        const fileName = `${nisn}${ext}`;

        const gasRes = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'uploadPhoto',
            nisn,
            base64Data,
            fileName,
            mimeType: file.type || 'image/jpeg',
          }),
        });
        if (gasRes.ok) {
          const resJson = await gasRes.json();
          resolve(resJson);
        } else {
          reject(new Error(`Gagal mengunggah foto ke Apps Script (Status ${gasRes.status})`));
        }
      } catch (err: any) {
        reject(new Error(err?.message || 'Gagal mengunggah foto'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file foto'));
    reader.readAsDataURL(file);
  });
}

export async function fetchSubjects(token?: string | null): Promise<{ mapel1: string[]; mapel2: string[] }> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/subjects', { headers });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend subjects fetch failed, trying Apps Script:', err);
  }

  try {
    const gasRes = await fetch(`${APPS_SCRIPT_URL}?action=getSubjects`);
    if (gasRes.ok) {
      return await gasRes.json();
    }
  } catch (gasErr) {
    console.error('Apps Script subjects error:', gasErr);
  }

  return { mapel1: [], mapel2: [] };
}

