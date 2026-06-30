import ExcelJS from 'exceljs';
import { db, JadwalHasil, PengaturanSekolah } from '../db/database';
import { downloadBuffer } from './excelHelpers';

const TNR = 'Times New Roman';

async function getSettings(): Promise<PengaturanSekolah | null> {
  const rows = await db.pengaturanSekolah.toArray();
  return rows[0] ?? null;
}

async function getHasil(): Promise<JadwalHasil[]> {
  const rows = await db.hasilJadwal.toArray();
  if (!rows.length) throw new Error('Jadwal belum digenerate.');
  return rows[rows.length - 1].data;
}

function applyBorderAll(ws: ExcelJS.Worksheet, sr: number, er: number, sc: number, ec: number, s: ExcelJS.BorderStyle = 'thin') {
  for (let r = sr; r <= er; r++) {
    for (let c = sc; c <= ec; c++) {
      const cell = ws.getCell(r, c);
      cell.border = { top: { style: s }, left: { style: s }, bottom: { style: s }, right: { style: s } };
    }
  }
}

function center(ws: ExcelJS.Worksheet, r: number, c: number) {
  ws.getCell(r, c).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
}

function finalizeWorkbook(wb: ExcelJS.Workbook) {
  wb.eachSheet((ws) => {
    ws.eachRow((row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        const existing = cell.font || {};
        cell.font = { ...existing, name: TNR };
        const align = cell.alignment || {};
        cell.alignment = { ...align, wrapText: true };
      });
    });
  });
}

async function addKopSurat(ws: ExcelJS.Worksheet, settings: PengaturanSekolah | null, totalCols: number) {
  const headerRows = 5;
  ws.mergeCells(1, 2, 1, totalCols);
  ws.mergeCells(2, 2, 2, totalCols);
  ws.mergeCells(3, 2, 3, totalCols);
  ws.mergeCells(4, 2, 4, totalCols);

  const c1 = ws.getCell(1, 2); c1.value = settings?.baris1 || ''; c1.font = { name: TNR, bold: false, size: 12 }; c1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const c2 = ws.getCell(2, 2); c2.value = settings?.baris2 || ''; c2.font = { name: TNR, bold: false, size: 12 }; c2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const c3 = ws.getCell(3, 2); c3.value = settings?.namaSekolah || ''; c3.font = { name: TNR, bold: true, size: 14 }; c3.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const c4 = ws.getCell(4, 2); c4.value = settings?.alamat || ''; c4.font = { name: TNR, size: 10 }; c4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  ws.mergeCells(1, 1, 4, 1);
  ws.getColumn(1).width = 12;
  ws.getRow(1).height = 20; ws.getRow(2).height = 20; ws.getRow(3).height = 24; ws.getRow(4).height = 36;

  if (settings?.logoBase64) {
    try {
      const base64 = settings.logoBase64.split(',')[1];
      const logoId = ws.workbook.addImage({ base64, extension: 'png' });
      ws.addImage(logoId, { tl: { col: 0, row: 0 } as any, ext: { width: 90, height: 90 } });
    } catch { /* skip */ }
  }

  ws.mergeCells(5, 1, 5, totalCols);
  ws.getCell(5, 1).border = { bottom: { style: 'medium' } };
  ws.getRow(5).height = 4;
  return headerRows;
}

export async function exportDaftarHadirPengawas() {
  const settings = await getSettings();
  const hasil = await getHasil();
  const wb = new ExcelJS.Workbook();
  for (const item of hasil) {
    const mapelShort = item.namaMapel.split(' ').slice(0, 2).join(' ');
    const sheetName = `H${item.hari}S${item.sesi} ${mapelShort}`.slice(0, 31);
    const ws = wb.addWorksheet(sheetName);
    const TC = 4;
    ws.getColumn(1).width = 6; ws.getColumn(2).width = 35; ws.getColumn(3).width = 25; ws.getColumn(4).width = 15;
    await addKopSurat(ws, settings, TC);
    let row = 7;
    ws.mergeCells(row, 1, row, TC);
    const t1 = ws.getCell(row, 1); t1.value = settings?.judulHadirPengawas || 'DAFTAR HADIR PENGAWAS'; t1.font = { name: TNR, bold: true, size: 13 }; t1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; ws.getRow(row).height = 22; row++;
    ws.mergeCells(row, 1, row, TC);
    const t2 = ws.getCell(row, 1); t2.value = `HARI/ TANGGAL : ${item.labelHari || item.tanggal}`; t2.font = { name: TNR, bold: true, size: 12 }; t2.alignment = { horizontal: 'center', wrapText: true }; ws.getRow(row).height = 18; row++;
    ws.getRow(row).height = 6; row++;
    ws.mergeCells(row, 1, row + 1, 1); ws.mergeCells(row, 2, row + 1, 2); ws.mergeCells(row, 4, row + 1, 4);
    const th = (r: number, c: number, v: string) => { const cell = ws.getCell(r, c); cell.value = v; cell.font = { name: TNR, bold: true, size: 11 }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } }; cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; };
    th(row, 1, 'No.'); th(row, 2, 'NAMA'); th(row, 3, 'MATA PELAJARAN'); th(row, 4, 'KET');
    const mapelSubCell = ws.getCell(row + 1, 3); mapelSubCell.value = item.namaMapel; mapelSubCell.font = { name: TNR, bold: true, size: 11 }; mapelSubCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } }; mapelSubCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    applyBorderAll(ws, row, row + 1, 1, TC); ws.getRow(row).height = 20; ws.getRow(row + 1).height = 20; row += 2;
    const seenIds = new Set<number>();
    const allPengawas: { nama: string; nip: string }[] = [];
    for (const ruang of item.ruangan) { for (const p of ruang.pengawas) { if (!seenIds.has(p.id)) { seenIds.add(p.id); allPengawas.push({ nama: p.nama, nip: p.nip }); } } }
    for (let i = 0; i < allPengawas.length; i++) {
      const p = allPengawas[i]; ws.getRow(row).height = 32; ws.getCell(row, 1).value = i + 1; center(ws, row, 1);
      const nameCell = ws.getCell(row, 2); nameCell.value = `${p.nama}\nNIP. ${p.nip}`; nameCell.font = { name: TNR }; nameCell.alignment = { wrapText: true, vertical: 'top' };
      ws.getCell(row, 3).value = ''; ws.getCell(row, 4).value = ''; applyBorderAll(ws, row, row, 1, TC); row++;
    }
    row += 2;
    const kota = settings?.kotaPenandatanganan || 'Pontianak';
    const tgl = settings?.tanggalPenandatanganan || '';
    ws.mergeCells(row, 3, row, TC); ws.getCell(row, 3).value = `${kota}, ${tgl}`; ws.getCell(row, 3).alignment = { horizontal: 'center', wrapText: true }; row++;
    ws.mergeCells(row, 1, row, 2); ws.getCell(row, 1).value = 'Mengetahui,';
    ws.mergeCells(row, 3, row, TC); ws.getCell(row, 3).value = settings?.judulHadirPengawas?.includes('PSAT') ? 'Ketua Panitia PSAT' : 'Ketua Panitia'; ws.getCell(row, 3).alignment = { horizontal: 'center', wrapText: true }; row++;
    ws.mergeCells(row, 1, row, 2); ws.getCell(row, 1).value = `Kepala ${settings?.namaSekolah || 'Sekolah'},`; row += 4;
    ws.getCell(row, 1).value = settings?.kepalaSekolahNama || ''; ws.getCell(row, 1).font = { name: TNR, bold: true, underline: true };
    ws.mergeCells(row, 3, row, TC); ws.getCell(row, 3).value = settings?.ketuaPanitiaNama || ''; ws.getCell(row, 3).font = { name: TNR, bold: true, underline: true }; ws.getCell(row, 3).alignment = { horizontal: 'center', wrapText: true }; row++;
    ws.getCell(row, 1).value = `NIP. ${settings?.kepalaSekolahNip || ''}`;
    ws.mergeCells(row, 3, row, TC); ws.getCell(row, 3).value = `NIP. ${settings?.ketuaPanitiaNip || ''}`; ws.getCell(row, 3).alignment = { horizontal: 'center', wrapText: true };
  }
  finalizeWorkbook(wb);
  const buffer = await wb.xlsx.writeBuffer();
  downloadBuffer(buffer, 'Daftar_Hadir_Pengawas.xlsx');
}

export async function exportJadwalPengawas() {
  const settings = await getSettings();
  const hasil = await getHasil();
  const pengawasList = await db.pengawas.toArray();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Jadwal Pengawas');
  const allRooms = new Set<string>();
  const roomsByKelas = new Map<string, string[]>();
  for (const item of hasil) {
    for (const ruang of item.ruangan) {
      allRooms.add(ruang.namaRuang);
      if (!roomsByKelas.has(ruang.kelas)) roomsByKelas.set(ruang.kelas, []);
      const arr = roomsByKelas.get(ruang.kelas)!;
      if (!arr.includes(ruang.namaRuang)) arr.push(ruang.namaRuang);
    }
  }
  const sortedRooms = [...allRooms].sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));
  const sortedKelas = [...roomsByKelas.keys()].sort((a, b) => {
    const romanToNum = (s: string): number => { const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; let n = 0; const upper = s.toUpperCase(); for (let i = 0; i < upper.length; i++) { const cur = map[upper[i]] ?? 0; const next = map[upper[i + 1]] ?? 0; n += cur < next ? -cur : cur; } return n || parseInt(s) || 0; };
    return romanToNum(a) - romanToNum(b);
  });
  for (const k of sortedKelas) roomsByKelas.get(k)!.sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));
  const FIXED_COLS = 4; const TC = FIXED_COLS + sortedRooms.length;
  ws.getColumn(1).width = 5; ws.getColumn(2).width = 22; ws.getColumn(3).width = 16; ws.getColumn(4).width = 28;
  for (let i = 5; i <= TC; i++) ws.getColumn(i).width = 8;
  await addKopSurat(ws, settings, TC);
  let row = 7;
  ws.mergeCells(row, 1, row, TC);
  const t1 = ws.getCell(row, 1); t1.value = settings?.judulJadwalPengawas || 'JADWAL PENGAWAS'; t1.font = { name: TNR, bold: true, size: 13 }; t1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; ws.getRow(row).height = 22; row++;
  ws.mergeCells(row, 1, row, TC);
  const t2 = ws.getCell(row, 1); t2.value = `TAHUN PELAJARAN ${settings?.tahunPelajaran || ''}`; t2.font = { name: TNR, bold: true, size: 12 }; t2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; ws.getRow(row).height = 18; row += 2;
  ws.mergeCells(row, FIXED_COLS + 1, row, TC);
  const ruanganLabel = ws.getCell(row, FIXED_COLS + 1); ruanganLabel.value = 'RUANGAN'; ruanganLabel.font = { name: TNR, bold: true, size: 11 }; ruanganLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }; ruanganLabel.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const headerRow1 = row, headerRow2 = row + 1, headerRow3 = row + 2;
  for (let c = 1; c <= FIXED_COLS; c++) {
    ws.mergeCells(headerRow1, c, headerRow3, c);
    const cell = ws.getCell(headerRow1, c); cell.font = { name: TNR, bold: true, size: 10 }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } }; cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }
  ws.getCell(headerRow1, 1).value = 'No.'; ws.getCell(headerRow1, 2).value = 'HARI / TANGGAL'; ws.getCell(headerRow1, 3).value = 'WAKTU'; ws.getCell(headerRow1, 4).value = 'MATA PELAJARAN';
  let colCursor = FIXED_COLS + 1;
  for (const kelas of sortedKelas) {
    const rooms = roomsByKelas.get(kelas)!;
    ws.mergeCells(headerRow2, colCursor, headerRow2, colCursor + rooms.length - 1);
    const kc = ws.getCell(headerRow2, colCursor); kc.value = `KELAS ${kelas}`; kc.font = { name: TNR, bold: true, size: 10 }; kc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB2DFDB' } }; kc.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    for (let i = 0; i < rooms.length; i++) { const rc = ws.getCell(headerRow3, colCursor + i); rc.value = rooms[i]; rc.font = { name: TNR, bold: true, size: 9 }; rc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }; rc.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; }
    colCursor += rooms.length;
  }
  applyBorderAll(ws, headerRow1, headerRow3, 1, TC); ws.getRow(headerRow1).height = 18; ws.getRow(headerRow2).height = 18; ws.getRow(headerRow3).height = 18; row += 3;
  let no = 1;
  const hariGroups = new Map<number, JadwalHasil[]>();
  for (const item of hasil) { if (!hariGroups.has(item.hari)) hariGroups.set(item.hari, []); hariGroups.get(item.hari)!.push(item); }
  for (const [, items] of [...hariGroups.entries()].sort(([a], [b]) => a - b)) {
    const hariRowStart = row;
    for (let si = 0; si < items.length; si++) {
      const item = items[si]; ws.getRow(row).height = 24;
      if (si === 0) {
        if (items.length > 1) { ws.mergeCells(row, 1, row + items.length - 1, 1); ws.mergeCells(row, 2, row + items.length - 1, 2); }
        ws.getCell(row, 1).value = no++; ws.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        ws.getCell(row, 2).value = item.labelHari || `Hari ${item.hari}`; ws.getCell(row, 2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
      ws.getCell(row, 3).value = `${item.jamMulai} - ${item.jamSelesai}`; ws.getCell(row, 3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      ws.getCell(row, 4).value = item.namaMapel; ws.getCell(row, 4).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      for (let ri = 0; ri < sortedRooms.length; ri++) {
        const ruangName = sortedRooms[ri]; const ruangData = item.ruangan.find((r) => r.namaRuang === ruangName);
        const colIdx = FIXED_COLS + 1 + ri; const cell = ws.getCell(row, colIdx);
        if (ruangData) { cell.value = ruangData.pengawas.map((p) => p.kodeGuru).join('/'); cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; cell.font = { name: TNR, size: 9, bold: true }; }
      }
      applyBorderAll(ws, row, row, 1, TC); row++;
    }
    if (no % 2 === 0) { for (let r2 = hariRowStart; r2 < row; r2++) { for (let c = 1; c <= TC; c++) { const cell = ws.getCell(r2, c); if (!cell.fill || (cell.fill as ExcelJS.FillPattern).fgColor?.argb === 'FFFFFFFF') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } }; } } }
  }
  row += 2; ws.mergeCells(row, 1, row, TC); ws.getCell(row, 1).value = 'Kode Pengawas :'; ws.getCell(row, 1).font = { name: TNR, bold: true }; row++;
  const itemsPerRow = 6; let colL = 1; let legendRow = row;
  for (let i = 0; i < pengawasList.length; i++) { const p = pengawasList[i]; if (colL > itemsPerRow) { colL = 1; legendRow++; } ws.getCell(legendRow, colL).value = `${i + 1}. ${p.kodeGuru}  ${p.nama}`; ws.getCell(legendRow, colL).font = { name: TNR, size: 9 }; colL++; }
  row = legendRow + 2;
  ws.getCell(row, 1).value = 'Mengetahui,'; ws.mergeCells(row, Math.ceil(TC / 2) + 1, row, TC); ws.getCell(row, Math.ceil(TC / 2) + 1).value = 'Sekretaris,'; ws.getCell(row, Math.ceil(TC / 2) + 1).alignment = { horizontal: 'center', wrapText: true }; row++;
  ws.getCell(row, 1).value = `Kepala Sekolah,`; row += 4;
  ws.getCell(row, 1).value = settings?.kepalaSekolahNama || ''; ws.getCell(row, 1).font = { name: TNR, bold: true, underline: true };
  ws.mergeCells(row, Math.ceil(TC / 2) + 1, row, TC); ws.getCell(row, Math.ceil(TC / 2) + 1).value = settings?.sekretarisNama || ''; ws.getCell(row, Math.ceil(TC / 2) + 1).font = { name: TNR, bold: true, underline: true }; ws.getCell(row, Math.ceil(TC / 2) + 1).alignment = { horizontal: 'center', wrapText: true }; row++;
  ws.getCell(row, 1).value = `NIP. ${settings?.kepalaSekolahNip || ''}`; ws.mergeCells(row, Math.ceil(TC / 2) + 1, row, TC); ws.getCell(row, Math.ceil(TC / 2) + 1).value = `NIP. ${settings?.sekretarisNip || ''}`; ws.getCell(row, Math.ceil(TC / 2) + 1).alignment = { horizontal: 'center', wrapText: true };
  finalizeWorkbook(wb);
  const buffer = await wb.xlsx.writeBuffer();
  downloadBuffer(buffer, 'Jadwal_Pengawas.xlsx');
}

export async function exportDaftarHadirPeserta() {
  const settings = await getSettings();
  const hasil = await getHasil();
  const wb = new ExcelJS.Workbook();
  for (const item of hasil) {
    for (const ruang of item.ruangan) {
      const sheetName = `${ruang.namaRuang}-H${item.hari}S${item.sesi}`.slice(0, 31);
      const ws = wb.addWorksheet(sheetName);
      const TC = 7;
      ws.getColumn(1).width = 6; ws.getColumn(2).width = 14; ws.getColumn(3).width = 32; ws.getColumn(4).width = 12; ws.getColumn(5).width = 12; ws.getColumn(6).width = 9; ws.getColumn(7).width = 9;
      await addKopSurat(ws, settings, TC);
      let row = 7;
      ws.mergeCells(row, 1, row, TC); const t1 = ws.getCell(row, 1); t1.value = 'DAFTAR HADIR PESERTA'; t1.font = { name: TNR, bold: true, size: 14 }; t1.alignment = { horizontal: 'center', wrapText: true }; ws.getRow(row).height = 22; row++;
      ws.mergeCells(row, 1, row, TC); const t2 = ws.getCell(row, 1); t2.value = settings?.judulSingkat || ''; t2.font = { name: TNR, bold: false, size: 11 }; t2.alignment = { horizontal: 'center', wrapText: true }; ws.getRow(row).height = 18; row += 2;
      const kelasList = [...new Set(ruang.siswa.map(s => s.kelas))].sort((a, b) => a.localeCompare(b, 'id')).join(', ');
      const info = [
        ['HARI / TANGGAL', item.labelHari || item.tanggal, 'WAKTU', `${item.jamMulai} - ${item.jamSelesai} WIB`],
        ['MATA PELAJARAN', item.namaMapel, 'RUANG', `${ruang.namaRuang}`],
        ['KELAS', kelasList, '', ''],
      ];
      for (const [k1, v1, k2, v2] of info) {
        ws.getRow(row).height = 18; ws.getCell(row, 1).value = k1; ws.getCell(row, 1).font = { name: TNR, bold: true }; ws.getCell(row, 1).alignment = { vertical: 'middle', wrapText: true };
        ws.getCell(row, 3).value = `: ${v1}`; ws.getCell(row, 3).font = { name: TNR }; ws.getCell(row, 3).alignment = { vertical: 'middle', wrapText: true };
        if (k2) { ws.getCell(row, 4).value = k2; ws.getCell(row, 4).font = { name: TNR, bold: true }; ws.getCell(row, 4).alignment = { vertical: 'middle', wrapText: true }; ws.mergeCells(row, 5, row, TC); ws.getCell(row, 5).value = `: ${v2}`; ws.getCell(row, 5).font = { name: TNR }; ws.getCell(row, 5).alignment = { vertical: 'middle', wrapText: true }; }
        row++;
      }
      row++;
      const hdrs: [number, string][] = [[1, 'NO'], [2, 'NISN'], [3, 'NAMA'], [6, 'SKOR'], [7, 'Nilai']];
      ws.mergeCells(row, 4, row, 5); ws.getCell(row, 4).value = 'TANDA TANGAN';
      for (const [c, v] of hdrs) ws.getCell(row, c).value = v;
      for (let c = 1; c <= TC; c++) { const cell = ws.getCell(row, c); cell.font = { name: TNR, bold: true, size: 11 }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }; cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; }
      applyBorderAll(ws, row, row, 1, TC); ws.getRow(row).height = 24; row++;
      for (let i = 0; i < ruang.siswa.length; i++) {
        const s = ruang.siswa[i]; ws.getRow(row).height = 22; ws.getCell(row, 1).value = i + 1; ws.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; ws.getCell(row, 1).font = { name: TNR };
        ws.getCell(row, 2).value = s.nisn; ws.getCell(row, 2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; ws.getCell(row, 2).font = { name: TNR };
        ws.getCell(row, 3).value = s.nama; ws.getCell(row, 3).alignment = { vertical: 'middle', wrapText: true }; ws.getCell(row, 3).font = { name: TNR };
        const sigNum = i + 1; ws.getCell(row, 4).value = i % 2 === 0 ? sigNum : ''; ws.getCell(row, 4).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; ws.getCell(row, 4).font = { name: TNR };
        ws.getCell(row, 5).value = i % 2 !== 0 ? sigNum : ''; ws.getCell(row, 5).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true }; ws.getCell(row, 5).font = { name: TNR };
        ws.getCell(row, 6).value = ''; ws.getCell(row, 7).value = ''; applyBorderAll(ws, row, row, 1, TC);
        if (i % 2 !== 0) { for (let c = 1; c <= TC; c++) ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } }; }
        row++;
      }
      row += 2;
      const kota = settings?.kotaPenandatanganan || 'Pontianak'; const tgl = settings?.tanggalPenandatanganan || '';
      ws.mergeCells(row, 5, row, TC); ws.getCell(row, 5).value = `${kota}, ${tgl}`; ws.getCell(row, 5).alignment = { horizontal: 'center', wrapText: true }; row++;
      ws.getCell(row, 1).value = 'Korektor'; ws.mergeCells(row, 5, row, TC); ws.getCell(row, 5).value = 'Pengawas Ruang'; ws.getCell(row, 5).alignment = { horizontal: 'center', wrapText: true }; row += 4;
      ws.getCell(row, 1).value = '_________________';
      for (let pi = 0; pi < ruang.pengawas.length; pi++) {
        const p = ruang.pengawas[pi]; ws.mergeCells(row, 5, row, TC); ws.getCell(row, 5).value = p.nama; ws.getCell(row, 5).alignment = { horizontal: 'center', wrapText: true }; row++;
        if (pi === 0) ws.getCell(row, 1).value = 'NIP.'; ws.mergeCells(row, 5, row, TC); ws.getCell(row, 5).value = `NIP. ${p.nip}`; ws.getCell(row, 5).alignment = { horizontal: 'center', wrapText: true }; if (pi < ruang.pengawas.length - 1) row += 2; else row++;
      }
    }
  }
  finalizeWorkbook(wb);
  const buffer = await wb.xlsx.writeBuffer();
  downloadBuffer(buffer, 'Daftar_Hadir_Peserta.xlsx');
}
