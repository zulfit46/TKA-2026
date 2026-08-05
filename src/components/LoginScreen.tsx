import React, { useState } from 'react';
import { Student } from '../types';
import { KeyRound, GraduationCap, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  students: Student[];
  loading: boolean;
  error: string | null;
  hasGoogleAuth: boolean;
  onGoogleSignIn: () => void;
  onLoginWithNisn: (nisn: string) => void;
  onRefreshData: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  students,
  loading,
  error,
  hasGoogleAuth,
  onGoogleSignIn,
  onLoginWithNisn,
  onRefreshData,
}) => {
  const [inputNisn, setInputNisn] = useState('');
  const [nisnError, setNisnError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNisnError('');

    const trimmed = inputNisn.trim();
    if (!trimmed) {
      setNisnError('Masukkan NISN Anda terlebih dahulu');
      return;
    }

    onLoginWithNisn(trimmed);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-xl shadow-indigo-600/30 mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Portal Siswa TKA 2026</h2>
          <p className="text-sm text-slate-400">
            Masuk dengan <span className="text-indigo-400 font-semibold">NISN</span> Anda untuk memverifikasi data Anda
          </p>
        </div>

        {/* Step 1: Check Google Authorization */}
        {!hasGoogleAuth ? (
          <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-semibold text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Otorisasi Akses Diperlukan</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Silakan terhubung dengan akun Google untuk membaca dan menyimpan data ke Google Sheets dan Drive.
            </p>
            <button
              onClick={onGoogleSignIn}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Hubungkan Akun Google</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Step 2: NISN Input Form */
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Nomor Induk Siswa Nasional (NISN)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={inputNisn}
                  onChange={(e) => {
                    setInputNisn(e.target.value);
                    setNisnError('');
                  }}
                  placeholder="Contoh: 0051234567"
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl text-white placeholder-slate-500 font-mono text-sm transition-all"
                  autoFocus
                />
              </div>
              {nisnError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{nisnError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memeriksa Data...</span>
                </>
              ) : (
                <>
                  <span>Masuk Ke Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
