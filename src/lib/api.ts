import { Student, StudentUpdateRequest } from '../types';

export async function fetchStudents(token?: string | null): Promise<Student[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/students', { headers });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Gagal mengambil data siswa (Status ${response.status})`);
  }

  return await response.json();
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

  const response = await fetch(`/api/students/${nisn}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Gagal memperbarui data siswa (Status ${response.status})`);
  }

  return await response.json();
}

export async function uploadPhotoToDrive(
  token: string | undefined | null,
  nisn: string,
  file: File
): Promise<{ success: boolean; link_foto: string; message: string }> {
  const formData = new FormData();
  formData.append('nisn', nisn);
  formData.append('photo', file);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch('/api/upload-photo', {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (netErr: any) {
    throw new Error(`Gagal terhubung ke server: ${netErr.message || 'Failed to fetch'}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Respon server tidak valid (${response.status}). Silakan coba lagi.`);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Gagal mengunggah foto (Status ${response.status})`);
  }

  return data;
}

export async function fetchSubjects(token?: string | null): Promise<{ mapel1: string[]; mapel2: string[] }> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/subjects', { headers });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Gagal mengambil data mapel (Status ${response.status})`);
  }

  return await response.json();
}
