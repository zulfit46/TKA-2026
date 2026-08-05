export interface Student {
  rowIndex: number; // 1-based index in sheet
  no: string;
  nipd: string;
  nisn: string;
  nama: string;
  prog_keahlian: string;
  jk: string;
  t_lahir?: string;
  tgl_lahir: string;
  nama_ortu: string;
  keikutsertaan: 'Ya' | 'Tidak' | string;
  mapel_1: string;
  mapel_2: string;
  link_foto: string;
  status_verval: 'Sesuai' | 'Tidak Sesuai' | string;
}

export interface StudentUpdateRequest {
  keikutsertaan?: 'Ya' | 'Tidak' | string;
  mapel_1?: string;
  mapel_2?: string;
  link_foto?: string;
  status_verval?: 'Sesuai' | 'Tidak Sesuai' | string;
}
