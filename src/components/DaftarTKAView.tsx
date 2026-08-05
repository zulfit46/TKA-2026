import React, { useState, useRef, useEffect } from 'react';
import { Student } from '../types';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Camera,
  Save,
  Image as ImageIcon,
} from 'lucide-react';

interface DaftarTKAViewProps {
  student: Student;
  onUpdate: (updatedFields: Partial<Student>) => Promise<void>;
  onUploadPhoto: (file: File) => Promise<string>;
  saving: boolean;
  mapel1Options?: string[];
  mapel2Options?: string[];
}

function getDriveImageDisplayUrl(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  let fileId = '';
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch) {
    fileId = fileDMatch[1];
  } else {
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch) {
      fileId = idParamMatch[1];
    }
  }

  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return url;
}

export const DaftarTKAView: React.FC<DaftarTKAViewProps> = ({
  student,
  onUpdate,
  onUploadPhoto,
  saving,
}) => {
  const [linkFoto, setLinkFoto] = useState<string>(student.link_foto || '');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when student prop changes
  useEffect(() => {
    setLinkFoto(student.link_foto || '');
  }, [student.nisn, student.link_foto]);

  // Image display URL state with fallback
  const [photoSrc, setPhotoSrc] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const rawUrl = previewUrl || linkFoto;
    setPhotoSrc(getDriveImageDisplayUrl(rawUrl));
    setImageError(false);
  }, [previewUrl, linkFoto]);

  const handleImageError = () => {
    let fileId = '';
    const match = (linkFoto || '').match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || (linkFoto || '').match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) fileId = match[1];

    if (fileId && !photoSrc.includes('thumbnail')) {
      setPhotoSrc(`https://drive.google.com/thumbnail?id=${fileId}&sz=w800`);
    } else if (fileId && !photoSrc.includes('uc?export=view')) {
      setPhotoSrc(`https://drive.google.com/uc?export=view&id=${fileId}`);
    } else {
      setImageError(true);
    }
  };

  // Check if status_verval is filled in Data Siswa
  const isVervalFilled = Boolean(
    student.status_verval &&
    student.status_verval.trim() !== '' &&
    student.status_verval !== 'Belum Verval'
  );

  const isFileTooLarge = Boolean(selectedFile && selectedFile.size > 1 * 1024 * 1024);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVervalFilled) {
      setErrorMsg('Status Verval belum terisi pada menu Data Siswa. Silakan isi dan simpan Status Verval terlebih dahulu.');
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      if (file.size > 1 * 1024 * 1024) {
        setErrorMsg('Ukuran file foto melebihi 1 MB. Foto tidak dapat disimpan. Silakan pilih file yang berukuran maksimal 1 MB.');
      } else {
        setErrorMsg(null);
      }
    }
  };

  const handleUploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaveSuccess(false);
    setUploadSuccess(false);

    if (!isVervalFilled) {
      setErrorMsg('Status Verval belum terisi pada menu Data Siswa. Silakan isi terlebih dahulu sebelum mengunggah foto.');
      return;
    }

    if (selectedFile && selectedFile.size > 1 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto melebihi 1 MB. Foto tidak dapat disimpan. Silakan pilih file yang berukuran maksimal 1 MB.');
      return;
    }

    let photoUrl = linkFoto;

    // If file is selected, upload it first
    if (selectedFile) {
      setUploading(true);
      try {
        photoUrl = await onUploadPhoto(selectedFile);
        setLinkFoto(photoUrl);
        setSelectedFile(null);
        setUploadSuccess(true);
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal mengunggah foto ke Google Drive');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    if (!photoUrl) {
      setErrorMsg('Silakan pilih file pas foto siswa terlebih dahulu.');
      return;
    }

    try {
      await onUpdate({
        keikutsertaan: 'Ya',
        link_foto: photoUrl,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan foto siswa');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Camera className="w-4 h-4" />
              <span>Kelengkapan Berkas TKA 2026</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Upload Pas Foto Siswa
            </h2>
            <p className="text-xs text-slate-400">
              Unggah pas foto formal siswa untuk kelengkapan data peserta Tes Kemampuan Akademik.
            </p>
          </div>

          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border ${
                linkFoto
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}
            >
              <span>{linkFoto ? 'Foto Terunggah' : 'Belum Ada Foto'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Status Verval Warning Banner if not filled */}
      {!isVervalFilled && (
        <div className="p-4 bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl text-amber-200 text-sm flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-300 text-sm sm:text-base">
              Status Verval Belum Terisi!
            </p>
            <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
              Status Verval pada menu <strong className="text-white font-semibold">Data Siswa</strong> belum terisi (kosong). Silakan buka menu Data Siswa terlebih dahulu untuk memilih dan menyimpan Status Verval (<strong className="text-white font-semibold">Sesuai / Tidak Sesuai</strong>) sebelum dapat mengunggah atau menyimpan foto.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleUploadAndSave} className="space-y-6">
        {/* Photo Upload Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <span>Pas Foto (3x4 - Latar Merah)</span>
              </h3>
              <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                NISN: {student.nisn}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              File akan disimpan otomatis ke Google Drive dan tautannya akan diperbarui pada Spreadsheet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Photo Preview Box */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl text-center space-y-3">
              <div className="w-36 h-48 bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden relative group shadow-inner">
                {photoSrc && !imageError ? (
                  <img
                    src={photoSrc}
                    alt={`Foto Siswa ${student.nisn}`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-500 p-2">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <span className="text-xs font-medium">Belum Ada Foto</span>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                Nama File: {student.nisn}.jpg
              </span>
            </div>

            {/* File Selection & Drop Area */}
            <div className="md:col-span-2 space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={!isVervalFilled}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
              />

              <div
                onClick={() => {
                  if (!isVervalFilled) {
                    setErrorMsg('Status Verval pada menu Data Siswa belum terisi. Silakan tentukan Status Verval terlebih dahulu.');
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all space-y-3 group ${
                  isVervalFilled
                    ? 'border-slate-700 hover:border-indigo-500/80 bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer'
                    : 'border-slate-800 bg-slate-800/20 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-md">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 block">
                    {selectedFile ? selectedFile.name : 'Pilih / Unggah Pas Foto Siswa'}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    {isVervalFilled
                      ? 'Klik untuk memilih file dari komputer (Format JPG, PNG • Maksimal 1 MB)'
                      : 'Unggah ditutup - Silakan isi Status Verval di menu Data Siswa terlebih dahulu'}
                  </p>
                </div>
              </div>

              {/* Display existing photo link if available */}
              {linkFoto && (
                <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between text-xs space-x-2">
                  <div className="truncate min-w-0 flex-1">
                    <span className="text-slate-400 block text-[10px] font-medium">Link Foto Tersimpan:</span>
                    <span className="font-mono text-indigo-300 truncate block select-all">{linkFoto}</span>
                  </div>
                  {linkFoto.startsWith('http') && (
                    <a
                      href={linkFoto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg flex items-center gap-1 font-semibold text-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Lihat Foto</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Messages */}
        {uploadSuccess && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Foto siswa berhasil tersimpan di Google Drive!</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Foto siswa dan data berhasil diperbarui di Spreadsheet!</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || uploading || !isVervalFilled || isFileTooLarge}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>
              {!isVervalFilled
                ? 'Isi Status Verval Terlebih Dahulu'
                : isFileTooLarge
                ? 'Ukuran Foto Melebihi 1 MB (Tidak Bisa Disimpan)'
                : uploading
                ? 'Mengunggah Foto ke Google Drive...'
                : saving
                ? 'Menyimpan...'
                : 'Simpan Foto Siswa'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
