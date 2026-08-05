import React, { useState } from 'react';
import { Student } from '../types';
import {
  User,
  BadgeCheck,
  Calendar,
  Users,
  Briefcase,
  Hash,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

interface DataSiswaViewProps {
  student: Student;
  onUpdate: (updatedFields: Partial<Student>) => Promise<void>;
  saving: boolean;
}

export const DataSiswaView: React.FC<DataSiswaViewProps> = ({
  student,
  onUpdate,
  saving,
}) => {
  const [statusVerval, setStatusVerval] = useState<'Sesuai' | 'Tidak Sesuai' | string>(
    student.status_verval || ''
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await onUpdate({ status_verval: statusVerval });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Gagal menyimpan status verifikasi data');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <BadgeCheck className="w-4 h-4" />
              <span>Verifikasi Data Siswa TKA 2026</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{student.nama}</h2>
            <p className="text-xs text-slate-400 font-mono">
              NISN: <span className="text-slate-200">{student.nisn}</span> • NIPD: <span className="text-slate-200">{student.nipd}</span>
            </p>
          </div>

          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border ${
                statusVerval === 'Sesuai'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : statusVerval === 'Tidak Sesuai'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {statusVerval === 'Sesuai' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : statusVerval === 'Tidak Sesuai' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400" />
              )}
              <span>Status Verval: {statusVerval || 'Belum Diisi (Kosong)'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Operator Contact Notification Banner if Status Verval is Tidak Sesuai */}
      {statusVerval === 'Tidak Sesuai' && (
        <div className="p-4 bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl text-rose-200 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-pulse-subtle">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-500/20 rounded-xl shrink-0 text-rose-400 mt-0.5">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-rose-300 text-sm sm:text-base">
                Data Tidak Sesuai!
              </p>
              <p className="text-xs text-rose-200/90 mt-0.5">
                Segera hubungi operator sekolah - <span className="font-bold text-white">Whatsapp : 0895433704646</span>
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/62895433704646?text=Halo%20Operator%20Sekolah,%20status%20verval%20data%20siswa%20saya%20Tidak%20Sesuai.%20Mohon%20bantuan%20verifikasi."
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Hubungi Operator (0895433704646)</span>
          </a>
        </div>
      )}

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Identitas Sekolah */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>Identitas Akademik</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">NIPD (Nomor Induk Peserta Didik)</span>
              <div className="font-mono text-sm text-white bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                {student.nipd || '-'}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">NISN (Nomor Induk Siswa Nasional)</span>
              <div className="font-mono text-sm text-white bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                {student.nisn || '-'}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Program Keahlian</span>
              <div className="text-sm text-white bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                {student.prog_keahlian || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Personal Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Data Pribadi & Orang Tua</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Nama Lengkap Siswa</span>
              <div className="text-sm text-white font-semibold bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                {student.nama || '-'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Jenis Kelamin</span>
                <div className="text-sm text-white bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  {student.jk || '-'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Tempat Lahir</span>
                <div className="text-sm text-white bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  {student.t_lahir || '-'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-medium">Tanggal Lahir</span>
                <div className="text-sm text-white bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  {student.tgl_lahir || '-'}
                </div>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Nama Orang Tua / Wali</span>
              <div className="text-sm text-white bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                {student.nama_ortu || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Status Card (Interactive Dropdown) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-indigo-400" />
              <span>Verifikasi Validasi Data (Status Verval)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tentukan apakah seluruh data pribadi dan akademik siswa di atas telah sesuai
            </p>
          </div>
          <span className="text-xs font-mono bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/20 hidden sm:inline-block">
            
          </span>
        </div>

        <form onSubmit={handleSaveStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Pilih Status Verval
            </label>
            <select
              value={statusVerval}
              onChange={(e) => setStatusVerval(e.target.value)}
              className="w-full sm:w-72 px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white font-semibold text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer"
            >
              <option value="">-- Belum Diisi (Kosong) --</option>
              <option value="Sesuai">Sesuai</option>
              <option value="Tidak Sesuai">Tidak Sesuai</option>
            </select>

            {statusVerval === 'Tidak Sesuai' && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Segera hubungi operator sekolah - <strong>Whatsapp : 0895433704646</strong></span>
                </div>
                <a
                  href="https://wa.me/62895433704646?text=Halo%20Operator%20Sekolah,%20status%20verval%20data%20siswa%20saya%20Tidak%20Sesuai.%20Mohon%20bantuan%20verifikasi."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat WA</span>
                </a>
              </div>
            )}
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Status Verval berhasil diperbarui dan tersimpan di Google Sheets!</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan ke Spreadsheet...' : 'Simpan Status Verval'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
