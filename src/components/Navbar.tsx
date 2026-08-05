import React from 'react';
import { Student } from '../types';
import { LogOut, CheckCircle2, ShieldAlert, GraduationCap, User } from 'lucide-react';

interface NavbarProps {
  currentStudent: Student | null;
  hasGoogleAuth: boolean;
  onLogout: () => void;
  onGoogleSignIn: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStudent,
  hasGoogleAuth,
  onLogout,
  onGoogleSignIn,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight leading-none">
                Pendataan TKA 2026
              </h1>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Tes Kemampuan Akademik 2026 • Verifikasi Data Siswa
            </p>
          </div>
        </div>

        {/* Right Section: Auth & Profile */}
        <div className="flex items-center gap-3">
          {/* Connection Badge */}
          <div
            className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full"
            title="Terhubung ke Sistem Spreadsheet & Drive"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium">Online</span>
          </div>

          {/* Student Badge / Sign Out */}
          {currentStudent && (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl p-1.5 pr-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-100 truncate max-w-[140px]">
                  {currentStudent.nama}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  NISN: {currentStudent.nisn}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="ml-1 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Keluar / Ganti Siswa"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
