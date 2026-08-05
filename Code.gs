/**
 * GOOGLE APPS SCRIPT (Code.gs)
 * Untuk Aplikasi Pendataan Tes Kemampuan Akademik (TKA)
 * 
 * PETUNJUK DEPLOYMENT:
 * 1. Buka Google Spreadsheet data siswa Anda.
 * 2. Klik menu Extensi -> Apps Script.
 * 3. Hapus semua kode yang ada, lalu salin (paste) seluruh kode di bawah ini.
 * 4. Atur `DRIVE_FOLDER_ID` di bawah ini jika ingin menyimpan foto di folder Drive khusus (Opsional).
 * 5. Klik tombol "Terapkan" / "Deploy" -> "Penerapan Baru" (New deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. Setel Akses (Who has access): "Siapa Saja" / "Anyone" (Agar siswa bisa akses tanpa login Google).
 * 8. Klik "Terapkan" / "Deploy" dan izinkan otorisasi pertama kali dari akun Google Admin/Guru.
 * 9. Salin URL Web App yang didapat (berakhiran /exec).
 */

// Konfigurasi
const SHEET_NAME = 'datasiswa';
const MAPEL1_SHEET = 'mapel1';
const MAPEL2_SHEET = 'mapel2';
// Masukkan ID Folder Google Drive untuk menyimpan foto siswa (Opsional)
const DRIVE_FOLDER_ID = '1qksEx8mLVL28BLAtwYfwjsEVjLgb35K8'; 

/**
 * Memproses permintaan GET (Mengambil data)
 */
function doGet(e) {
  const action = e.parameter.action || 'getStudents';
  
  try {
    if (action === 'getStudents') {
      return responseJSON(getStudentsData());
    } else if (action === 'getSubjects') {
      return responseJSON(getSubjectsData());
    } else {
      return responseJSON({ error: 'Aksi tidak dikenali: ' + action }, 400);
    }
  } catch (err) {
    return responseJSON({ error: err.toString() }, 500);
  }
}

/**
 * Memproses permintaan POST (Update data / Upload foto)
 */
function doPost(e) {
  try {
    let postData = {};
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      postData = e.parameter;
    }

    const action = postData.action || e.parameter.action;

    if (action === 'updateStudent') {
      const result = updateStudentData(postData);
      return responseJSON(result);
    } else if (action === 'uploadPhoto') {
      const result = handlePhotoUpload(postData);
      return responseJSON(result);
    } else {
      return responseJSON({ error: 'Aksi POST tidak valid' }, 400);
    }
  } catch (err) {
    return responseJSON({ error: err.toString() }, 500);
  }
}

/**
 * Mengambil daftar seluruh siswa dari Sheet 'datasiswa'
 */
function getStudentsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0]; // Ambil sheet pertama jika 'datasiswa' tidak ditemukan
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  // Parse header row secara dinamis
  const headerRow = (data[0] || []).map(function(h) {
    return String(h || '').trim().toLowerCase();
  });

  function findHeaderIdx(names, defaultIdx) {
    for (var j = 0; j < headerRow.length; j++) {
      var h = headerRow[j];
      for (var k = 0; k < names.length; k++) {
        if (h === names[k] || h.indexOf(names[k]) !== -1) {
          return j;
        }
      }
    }
    return defaultIdx;
  }

  const noIdx = findHeaderIdx(['no'], 0);
  const nipdIdx = findHeaderIdx(['nipd'], 1);
  const nisnIdx = findHeaderIdx(['nisn'], 2);
  const namaIdx = findHeaderIdx(['nama'], 3);
  const progIdx = findHeaderIdx(['prog_keahlian', 'program', 'jurusan'], 4);
  const jkIdx = findHeaderIdx(['jk', 'jenis_kelamin'], 5);
  const tLahirIdx = findHeaderIdx(['t_lahir', 'tempat_lahir', 'tempat lahir'], -1);
  const tglLahirIdx = findHeaderIdx(['tgl_lahir', 'tanggal_lahir', 'tanggal lahir'], 6);
  const ortuIdx = findHeaderIdx(['nama_ortu', 'ortu', 'orang_tua'], 7);
  const keikutsertaanIdx = findHeaderIdx(['keikutsertaan'], 8);
  const mapel1Idx = findHeaderIdx(['mapel_1', 'mapel 1'], 9);
  const mapel2Idx = findHeaderIdx(['mapel_2', 'mapel 2'], 10);
  const linkFotoIdx = findHeaderIdx(['link_foto', 'foto'], 11);
  const statusVervalIdx = findHeaderIdx(['status_verval', 'verval'], 12);

  const students = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const nisn = row[nisnIdx] ? String(row[nisnIdx]).trim() : (row[2] ? String(row[2]).trim() : '');
    if (!nisn) continue;

    students.push({
      rowIndex: i + 1,
      no: row[noIdx] ? String(row[noIdx]) : String(i),
      nipd: row[nipdIdx] ? String(row[nipdIdx]) : '',
      nisn: nisn,
      nama: row[namaIdx] ? String(row[namaIdx]) : '',
      prog_keahlian: row[progIdx] ? String(row[progIdx]) : '',
      jk: row[jkIdx] ? String(row[jkIdx]) : '',
      t_lahir: tLahirIdx !== -1 && row[tLahirIdx] ? String(row[tLahirIdx]) : '',
      tgl_lahir: formatDate(row[tglLahirIdx !== -1 ? tglLahirIdx : 6]),
      nama_ortu: row[ortuIdx] ? String(row[ortuIdx]) : '',
      keikutsertaan: row[keikutsertaanIdx] ? String(row[keikutsertaanIdx]) : 'Tidak',
      mapel_1: row[mapel1Idx] ? String(row[mapel1Idx]) : '',
      mapel_2: row[mapel2Idx] ? String(row[mapel2Idx]) : '',
      link_foto: row[linkFotoIdx] ? String(row[linkFotoIdx]) : '',
      status_verval: row[statusVervalIdx] ? String(row[statusVervalIdx]) : ''
    });
  }

  return students;
}

/**
 * Mengambil daftar mata pelajaran pilihan dari sheet 'mapel1' dan 'mapel2'
 */
function getSubjectsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const parseRows = (sheetName) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues();
    if (values.length === 0) return [];

    const result = [];
    const headerWords = ['no', 'kode', 'mapel', 'nama mapel', 'mata pelajaran', 'nama', 'id'];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (!row || row.length === 0) continue;
      
      let candidate = '';
      if (row.length >= 2) {
        const col0 = String(row[0] || '').trim();
        const col1 = String(row[1] || '').trim();
        if (col1 && !headerWords.includes(col1.toLowerCase())) {
          candidate = col1;
        } else if (col0 && !headerWords.includes(col0.toLowerCase()) && isNaN(Number(col0))) {
          candidate = col0;
        }
      } else {
        const col0 = String(row[0] || '').trim();
        if (col0 && !headerWords.includes(col0.toLowerCase()) && isNaN(Number(col0))) {
          candidate = col0;
        }
      }

      if (candidate && !result.includes(candidate)) {
        result.push(candidate);
      }
    }
    return result;
  };

  return {
    mapel1: parseRows(MAPEL1_SHEET),
    mapel2: parseRows(MAPEL2_SHEET)
  };
}

/**
 * Mengubah data pendaftaran siswa berdasarkan NISN
 */
function updateStudentData(params) {
  const nisn = String(params.nisn || '').trim();
  if (!nisn) throw new Error('NISN wajib diisi');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.getSheets()[0];

  const data = sheet.getDataRange().getValues();
  let targetRowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim() === nisn) {
      targetRowIndex = i + 1; // 1-based index
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('Siswa dengan NISN ' + nisn + ' tidak ditemukan');
  }

  // Update cell tertentu jika dikirimkan
  // Kolom 9 (I): keikutsertaan
  if (params.keikutsertaan !== undefined) {
    sheet.getRange(targetRowIndex, 9).setValue(params.keikutsertaan);
  }
  // Kolom 10 (J): mapel_1
  if (params.mapel_1 !== undefined) {
    sheet.getRange(targetRowIndex, 10).setValue(params.mapel_1);
  }
  // Kolom 11 (K): mapel_2
  if (params.mapel_2 !== undefined) {
    sheet.getRange(targetRowIndex, 11).setValue(params.mapel_2);
  }
  // Kolom 12 (L): link_foto
  if (params.link_foto !== undefined) {
    sheet.getRange(targetRowIndex, 12).setValue(params.link_foto);
  }
  // Kolom 13 (M): status_verval
  if (params.status_verval !== undefined) {
    sheet.getRange(targetRowIndex, 13).setValue(params.status_verval);
  }

  return { success: true, message: 'Data siswa berhasil diperbarui', nisn: nisn };
}

/**
 * Menerima file foto Base64, menyimpan ke Google Drive (menimpa foto lama jika ada), dan mengembalikan URL
 */
function handlePhotoUpload(params) {
  const nisn = String(params.nisn || '').trim();
  const base64Data = params.base64Data;
  const fileName = params.fileName || ('FOTO_' + nisn + '.jpg');
  const mimeType = params.mimeType || 'image/jpeg';

  if (!nisn || !base64Data) {
    throw new Error('NISN dan data foto Base64 wajib disertakan');
  }

  // Dekode Base64 ke Blob & Cek Ukuran File (Maksimal 1 MB)
  const decodedBytes = Utilities.base64Decode(base64Data.split(',')[1] || base64Data);
  if (decodedBytes.length > 1 * 1024 * 1024) {
    throw new Error('Ukuran file foto melebihi 1 MB. Foto tidak dapat disimpan.');
  }

  let folder;
  if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID !== '') {
    try {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }
  } else {
    folder = DriveApp.getRootFolder();
  }

  // Hapus/replace foto lama jika sudah pernah upload foto dengan NISN sama
  const existingFiles = folder.getFilesByName(fileName);
  while (existingFiles.hasNext()) {
    const oldFile = existingFiles.next();
    try {
      oldFile.setTrashed(true); // Pindahkan foto lama ke sampah
    } catch (e) {
      console.warn('Gagal menghapus file lama:', e);
    }
  }

  // Dekode Base64 ke Blob
  const decodedBytes = Utilities.base64Decode(base64Data.split(',')[1] || base64Data);
  const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

  // Simpan file baru ke Drive
  const newFile = folder.createFile(blob);
  newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const photoUrl = 'https://drive.google.com/uc?export=view&id=' + newFile.getId();

  // Otomatis perbarui link_foto di Sheet datasiswa
  try {
    updateStudentData({ nisn: nisn, link_foto: photoUrl });
  } catch (e) {
    console.warn('Gagal mengupdate link_foto di sheet:', e);
  }

  return {
    success: true,
    fileId: newFile.getId(),
    link_foto: photoUrl,
    webViewLink: newFile.getUrl()
  };
}

/**
 * Format helper untuk tanggal
 */
function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(val);
}

/**
 * Helper JSON Response dengan header CORS
 */
function responseJSON(data, status) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
