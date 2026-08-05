import React from 'react';
import { UserCheck, Camera, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Student } from '../types';

export type ActiveTab = 'data-siswa' | 'daftar-tka';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentStudent: Student | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentStudent,
}) => {
  return (
    <aside className="w-full lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 shrink-0">
      <div className="flex flex-row lg:flex-col gap-2">
        {/* Menu 1: Data Siswa */}
        <button
          onClick={() => setActiveTab('data-siswa')}
          className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'data-siswa'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/30'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <UserCheck className={`w-5 h-5 ${activeTab === 'data-siswa' ? 'text-white' : 'text-slate-400'}`} />
          <span className="flex-1 text-left font-semibold">Data Siswa</span>
          {currentStudent && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                currentStudent.status_verval === 'Sesuai'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : currentStudent.status_verval === 'Tidak Sesuai'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-700/80 text-slate-400 border border-slate-600/60'
              }`}
            >
              {currentStudent.status_verval || 'Belum Verval'}
            </span>
          )}
        </button>

        {/* Menu 2: Upload Foto */}
        <button
          onClick={() => setActiveTab('daftar-tka')}
          className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'daftar-tka'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400/30'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          }`}
        >
          <Camera className={`w-5 h-5 ${activeTab === 'daftar-tka' ? 'text-white' : 'text-slate-400'}`} />
          <span className="flex-1 text-left font-semibold">Upload Foto</span>
          {currentStudent && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                currentStudent.link_foto
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {currentStudent.link_foto ? 'Foto Ada' : 'Belum Ada'}
            </span>
          )}
        </button>
      </div>

      {/* Info Box Card at bottom of sidebar on desktop */}
      {currentStudent && (
        <div className="hidden lg:block mt-8 p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Petunjuk Siswa</span>
          </div>
          <p className="leading-relaxed">
            Periksa kembali kelengkapan data diri Anda
          </p>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
            
          </div>
        </div>
      )}
    </aside>
  );
};
