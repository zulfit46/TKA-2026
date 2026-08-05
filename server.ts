import express from 'express';
import path from 'path';
import { google } from 'googleapis';
import multer from 'multer';
import { Readable } from 'stream';
import { createServer as createViteServer } from 'vite';

const SPREADSHEET_ID = '1Cjc7SUH4bBUw6OImvkTk443024Ky_KVLpHJ5h7h5jOs';
const DRIVE_FOLDER_ID = '1qksEx8mLVL28BLAtwYfwjsEVjLgb35K8';
const SHEET_NAME = 'datasiswa';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw6psd_n0hQfKTAaM3sJEeRqckGOX9WMDCps07QETKMnSWYlOQsaw0AGNe_CISM1Kh9/exec';

// Helper to fetch GET requests from Google Apps Script Web App
async function fetchFromAppsScript(action: string, params?: Record<string, any>) {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Google Apps Script error HTTP ${response.status}`);
  }
  return await response.json();
}

// Helper to send POST requests to Google Apps Script Web App
async function postToAppsScript(data: Record<string, any>) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Google Apps Script error HTTP ${response.status}`);
  }
  return await response.json();
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
});

// Helper to get OAuth2 authenticated Google APIs client from request Authorization header
function getValidBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  if (!token || token === 'null' || token === 'undefined' || token.length < 15) return null;
  return token;
}

function getGoogleAuthClient(token: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });
  return oauth2Client;
}

// Helper to handle Google API errors gracefully
function handleGoogleApiError(res: express.Response, error: any, defaultMsg: string) {
  const isAuthError =
    error?.code === 401 ||
    error?.status === 401 ||
    error?.response?.status === 401 ||
    (error?.message && (
      error.message.includes('authentication credentials') ||
      error.message.includes('invalid_grant') ||
      error.message.includes('invalid_token') ||
      error.message.includes('OAuth 2 access token') ||
      error.message.includes('Akses ditolak')
    ));

  if (isAuthError) {
    console.warn(`[Auth Warning] ${defaultMsg}: Google OAuth token expired or invalid.`);
    return res.status(401).json({
      error: 'Sesi atau token Google OAuth telah kedaluwarsa/tidak valid. Silakan login ulang dengan Google.',
      code: 'UNAUTHORIZED'
    });
  }

  console.error(defaultMsg, error);
  return res.status(500).json({
    error: error?.message || defaultMsg
  });
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper to parse subject options from Google Sheets rows
function parseSubjectRows(rows?: any[][]): string[] {
  if (!rows || rows.length === 0) return [];
  const result: string[] = [];
  const headerWords = ['no', 'kode', 'mapel', 'nama mapel', 'mata pelajaran', 'nama', 'id', 'daftar mapel', 'daftar mapel 1', 'daftar mapel 2'];

  for (const row of rows) {
    if (!row || row.length === 0) continue;

    let candidate = '';
    // If row has 2+ columns, check if col 1 is subject name or col 0
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
}

// GET /api/subjects - Get subject lists from sheet tabs 'mapel1' and 'mapel2'
app.get('/api/subjects', async (req, res) => {
  const token = getValidBearerToken(req);
  if (token) {
    try {
      const auth = getGoogleAuthClient(token);
      const sheets = google.sheets({ version: 'v4', auth });

      const [mapel1Res, mapel2Res] = await Promise.allSettled([
        sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'mapel1!A1:E200',
        }),
        sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'mapel2!A1:E200',
        }),
      ]);

      const mapel1Rows = mapel1Res.status === 'fulfilled' ? mapel1Res.value.data.values : [];
      const mapel2Rows = mapel2Res.status === 'fulfilled' ? mapel2Res.value.data.values : [];

      const mapel1 = parseSubjectRows(mapel1Rows || []);
      const mapel2 = parseSubjectRows(mapel2Rows || []);

      return res.json({ mapel1, mapel2 });
    } catch (err: any) {
      // Direct call fallback
    }
  }

  try {
    const data = await fetchFromAppsScript('getSubjects');
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: 'Gagal mengambil data daftar mapel' });
  }
});

// GET /api/students - List all student records from Spreadsheet
app.get('/api/students', async (req, res) => {
  const token = getValidBearerToken(req);
  if (token) {
    try {
      const auth = getGoogleAuthClient(token);
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:Z1000`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.json([]);
      }

      // Dynamic Header index mapping
      const headerRow = (rows[0] || []).map((h: any) => String(h || '').trim().toLowerCase());
      const findHeaderIdx = (names: string[], defaultIdx: number) => {
        const found = headerRow.findIndex((h: string) => names.some(n => h === n || h.includes(n)));
        return found !== -1 ? found : defaultIdx;
      };

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
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const nisnVal = row[nisnIdx] ? String(row[nisnIdx]).trim() : (row[2] ? String(row[2]).trim() : '');
        if (!nisnVal) continue;

        students.push({
          rowIndex: i + 1, // 1-based index in Sheet
          no: row[noIdx] || String(i),
          nipd: row[nipdIdx] || '',
          nisn: nisnVal,
          nama: row[namaIdx] || '',
          prog_keahlian: row[progIdx] || '',
          jk: row[jkIdx] || '',
          t_lahir: tLahirIdx !== -1 ? (row[tLahirIdx] || '') : '',
          tgl_lahir: row[tglLahirIdx] || '',
          nama_ortu: row[ortuIdx] || '',
          keikutsertaan: row[keikutsertaanIdx] || 'Tidak',
          mapel_1: row[mapel1Idx] || '',
          mapel_2: row[mapel2Idx] || '',
          link_foto: row[linkFotoIdx] || '',
          status_verval: row[statusVervalIdx] || '',
        });
      }

      return res.json(students);
    } catch (err: any) {
      // Direct call fallback
    }
  }

  try {
    const data = await fetchFromAppsScript('getStudents');
    if (Array.isArray(data)) {
      const normalized = data.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return {
            ...item,
            t_lahir: item.t_lahir || item.tempat_lahir || item.tempatLahir || '',
          };
        }
        return item;
      });
      return res.json(normalized);
    }
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: 'Gagal mengambil data siswa' });
  }
});

// PUT /api/students/:nisn - Update student record in Spreadsheet
app.put('/api/students/:nisn', async (req, res) => {
  const { nisn } = req.params;
  const { keikutsertaan, mapel_1, mapel_2, link_foto, status_verval } = req.body;

  const token = getValidBearerToken(req);
  if (token) {
    try {
      const auth = getGoogleAuthClient(token);
      const sheets = google.sheets({ version: 'v4', auth });

      // Read sheet to find row index
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:M1000`,
      });

      const rows = response.data.values;
      if (rows && rows.length > 1) {
        let rowIndex = -1;
        let currentRow: any[] = [];
        for (let i = 1; i < rows.length; i++) {
          if (rows[i] && String(rows[i][2]).trim() === String(nisn).trim()) {
            rowIndex = i + 1; // 1-based index
            currentRow = rows[i];
            break;
          }
        }

        if (rowIndex !== -1) {
          // Preserve existing values if not explicitly provided
          const newKeikutsertaan = keikutsertaan !== undefined ? keikutsertaan : (currentRow[8] || 'Tidak');
          const newMapel1 = mapel_1 !== undefined ? mapel_1 : (currentRow[9] || '');
          const newMapel2 = mapel_2 !== undefined ? mapel_2 : (currentRow[10] || '');
          const newLinkFoto = link_foto !== undefined ? link_foto : (currentRow[11] || '');
          const newStatusVerval = status_verval !== undefined ? status_verval : (currentRow[12] || '');

          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!I${rowIndex}:M${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[newKeikutsertaan, newMapel1, newMapel2, newLinkFoto, newStatusVerval]],
            },
          });

          return res.json({
            success: true,
            message: 'Data siswa berhasil diperbarui',
            data: {
              nisn,
              rowIndex,
              keikutsertaan: newKeikutsertaan,
              mapel_1: newMapel1,
              mapel_2: newMapel2,
              link_foto: newLinkFoto,
              status_verval: newStatusVerval,
            },
          });
        }
      }
    } catch (err: any) {
      // Direct call fallback
    }
  }

  try {
    const result = await postToAppsScript({
      action: 'updateStudent',
      nisn,
      keikutsertaan,
      mapel_1,
      mapel_2,
      link_foto,
      status_verval,
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Gagal memperbarui data siswa' });
  }
});

// POST /api/upload-photo - Upload student photo to Google Drive
app.post('/api/upload-photo', upload.single('photo'), async (req, res) => {
  const nisn = req.body.nisn;
  if (!nisn) {
    return res.status(400).json({ error: 'NISN wajib diisi' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'File foto tidak ditemukan' });
  }

  if (req.file.size > 1 * 1024 * 1024) {
    return res.status(400).json({ error: 'Ukuran file foto melebihi 1 MB. Foto tidak dapat disimpan.' });
  }

  const token = getValidBearerToken(req);
  if (token) {
    try {
      const auth = getGoogleAuthClient(token);
      const drive = google.drive({ version: 'v3', auth });

      // Search for any existing files associated with this NISN in Drive folder
      // (e.g., nisn.jpg, nisn.png, FOTO_nisn.jpg, or any file starting/containing nisn)
      const listRes = await drive.files.list({
        q: `'${DRIVE_FOLDER_ID}' in parents and (name = '${nisn}.jpg' or name = '${nisn}.png' or name = '${nisn}.jpeg' or name = 'FOTO_${nisn}.jpg' or name = 'FOTO_${nisn}.png' or name starts with '${nisn}' or name contains '${nisn}') and trashed = false`,
        fields: 'files(id, name, webViewLink, webContentLink)',
      });

      let fileId = '';
      let webViewLink = '';

      const stream = Readable.from(req.file.buffer);
      const ext = req.file.mimetype.includes('png') ? '.png' : '.jpg';
      const fileName = `${nisn}${ext}`;

      if (listRes.data.files && listRes.data.files.length > 0) {
        fileId = listRes.data.files[0].id!;
        const updateRes = await drive.files.update({
          fileId: fileId,
          requestBody: {
            name: fileName,
          },
          media: {
            mimeType: req.file.mimetype,
            body: stream,
          },
          fields: 'id, name, webViewLink, webContentLink',
        });
        webViewLink = updateRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

        if (listRes.data.files.length > 1) {
          for (let i = 1; i < listRes.data.files.length; i++) {
            const extraFileId = listRes.data.files[i].id;
            if (extraFileId) {
              try {
                await drive.files.delete({ fileId: extraFileId });
              } catch (err) {
                console.warn('Gagal menghapus file foto duplikat lama:', err);
              }
            }
          }
        }
      } else {
        const createRes = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [DRIVE_FOLDER_ID],
          },
          media: {
            mimeType: req.file.mimetype,
            body: stream,
          },
          fields: 'id, name, webViewLink, webContentLink',
        });
        fileId = createRes.data.id!;
        webViewLink = createRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
      }

      try {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      } catch (permErr) {
        console.log('Note on permissions:', permErr);
      }

      const sheets = google.sheets({ version: 'v4', auth });
      const sheetData = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:M1000`,
      });

      const rows = sheetData.data.values;
      if (rows) {
        for (let i = 1; i < rows.length; i++) {
          if (rows[i] && String(rows[i][2]).trim() === String(nisn).trim()) {
            const rowIndex = i + 1;
            await sheets.spreadsheets.values.update({
              spreadsheetId: SPREADSHEET_ID,
              range: `${SHEET_NAME}!L${rowIndex}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [[webViewLink]],
              },
            });
            break;
          }
        }
      }

      return res.json({
        success: true,
        fileId,
        link_foto: webViewLink,
        message: 'Foto berhasil diunggah ke Google Drive',
      });
    } catch (err: any) {
      // Direct call fallback
    }
  }

  try {
    const base64Str = req.file.buffer.toString('base64');
    const ext = req.file.mimetype.includes('png') ? '.png' : '.jpg';
    const fileName = `${nisn}${ext}`;
    const result = await postToAppsScript({
      action: 'uploadPhoto',
      nisn,
      base64Data: `data:${req.file.mimetype};base64,${base64Str}`,
      fileName,
      mimeType: req.file.mimetype,
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Gagal mengunggah foto' });
  }
});

// Vite or Static file middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
