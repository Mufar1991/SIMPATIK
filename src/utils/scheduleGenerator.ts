import { db, JadwalHasil, RuanganDetail } from '../db/database';

export async function generateJadwal(): Promise<JadwalHasil[]> {
  const [jadwalMapelList, siswaNList, pengawasList, konfigArr, mapelArr] = await Promise.all([
    db.jadwalMapel.orderBy('hari').toArray(),
    db.siswa.toArray(),
    db.pengawas.toArray(),
    db.konfigurasiUmum.toArray(),
    db.mataPelajaran.toArray(),
  ]);

  if (!konfigArr.length) throw new Error('Konfigurasi belum disimpan.');
  if (!jadwalMapelList.length) throw new Error('Jadwal mata pelajaran belum dikonfigurasi.');

  const konfig = konfigArr[0];
  const kapasitas = konfig.kapasitasRuang;
  const pengawasPerRuang = konfig.pengawasPerRuang;
  const alokasi = konfig.alokasiRuang;

  const siswaByKelas = new Map<string, typeof siswaNList>();
  for (const s of siswaNList) {
    if (!siswaByKelas.has(s.kelas)) siswaByKelas.set(s.kelas, []);
    siswaByKelas.get(s.kelas)!.push(s);
  }

  for (const [kelas, list] of siswaByKelas) {
    siswaByKelas.set(kelas, [...list].sort((a, b) => a.nama.localeCompare(b.nama, 'id')));
  }

  const pengawasCount = new Map<number, number>();
  for (const p of pengawasList) pengawasCount.set(p.id!, 0);

  const hasil: JadwalHasil[] = [];

  for (const jadwal of jadwalMapelList) {
    const mapel = mapelArr.find((m) => m.id === jadwal.mapelId);
    const namaMapel = mapel?.nama || `Mapel ID ${jadwal.mapelId}`;
    const sesiNum = jadwal.sesi;
    const ruangan: RuanganDetail[] = [];

    for (const alokasiKelas of alokasi) {
      const kelasLabel = alokasiKelas.kelas;
      const siswaDiKelas: typeof siswaNList = [];
      for (const [kelas, list] of siswaByKelas) {
        if (kelas.toUpperCase().startsWith(kelasLabel.toUpperCase())) siswaDiKelas.push(...list);
      }
      if (siswaDiKelas.length === 0) continue;
      siswaDiKelas.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
      const totalRuang = alokasiKelas.ruangSelesai - alokasiKelas.ruangMulai + 1;
      let siswaIndex = 0;

      for (let r = 0; r < totalRuang; r++) {
        const namaRuang = `R${alokasiKelas.ruangMulai + r}`;
        const chunk = siswaDiKelas.slice(siswaIndex, siswaIndex + kapasitas);
        siswaIndex += kapasitas;
        if (chunk.length === 0) break;

        const eligible = pengawasList.filter((p) => {
          const count = pengawasCount.get(p.id!) ?? 0;
          return count < p.porsiMengawas && p.preferensiSesi.includes(sesiNum);
        });
        eligible.sort((a, b) => (pengawasCount.get(a.id!) ?? 0) - (pengawasCount.get(b.id!) ?? 0));
        const assigned = eligible.slice(0, pengawasPerRuang);
        if (assigned.length < pengawasPerRuang) {
          const fallback = pengawasList.filter((p) => !assigned.find((a) => a.id === p.id) && (pengawasCount.get(p.id!) ?? 0) < p.porsiMengawas).sort((a, b) => (pengawasCount.get(a.id!) ?? 0) - (pengawasCount.get(b.id!) ?? 0));
          assigned.push(...fallback.slice(0, pengawasPerRuang - assigned.length));
        }
        for (const p of assigned) pengawasCount.set(p.id!, (pengawasCount.get(p.id!) ?? 0) + 1);
        ruangan.push({
          namaRuang,
          kelas: kelasLabel,
          siswa: chunk.map((s) => ({ id: s.id!, nisn: s.nisn, nama: s.nama, kelas: s.kelas })),
          pengawas: assigned.map((p) => ({ id: p.id!, kodeGuru: p.kodeGuru, nama: p.nama, nip: p.nip })),
        });
      }
    }

    hasil.push({
      hari: jadwal.hari, sesi: jadwal.sesi, labelHari: jadwal.labelHari, tanggal: jadwal.tanggal,
      jamMulai: jadwal.jamMulai, jamSelesai: jadwal.jamSelesai, mapelId: jadwal.mapelId, namaMapel, ruangan,
    });
  }

  await db.hasilJadwal.clear();
  await db.hasilJadwal.add({ generatedAt: new Date().toISOString(), data: hasil });
  return hasil;
}
