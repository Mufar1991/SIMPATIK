import { useEffect, useRef, useState } from 'react';
import { Archive, Download, Upload, Trash2, RotateCcw, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { db, BackupRecord } from '../db/database';
import PageHeader from '../components/PageHeader';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function BackupRiwayat() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const load = () => db.backup.orderBy('tanggal').reverse().toArray().then(setBackups);
  useEffect(() => { load(); }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const getAllData = async () => {
    const [siswa, pengawas, mapel, jadwalMapel, konfigurasi, hasilJadwal, pengaturan] = await Promise.all([
      db.siswa.toArray(),
      db.pengawas.toArray(),
      db.mataPelajaran.toArray(),
      db.jadwalMapel.toArray(),
      db.konfigurasiUmum.toArray(),
      db.hasilJadwal.toArray(),
      db.pengaturanSekolah.toArray(),
    ]);
    return { siswa, pengawas, mapel, jadwalMapel, konfigurasi, hasilJadwal, pengaturan };
  };

  const handleCreate = async () => {
    try {
      const data = await getAllData();
      const json = JSON.stringify(data);
      const tanggal = new Date().toISOString();
      const namaFile = `SIMPATIK_Backup_${tanggal.slice(0, 10)}.json`;
      await db.backup.add({ namaFile, tanggal, ukuran: json.length, dataJson: json });
      load();
      showMsg('success', 'Backup berhasil dibuat dan disimpan.');
    } catch { showMsg('error', 'Gagal membuat backup.'); }
  };

  const handleExport = async () => {
    try {
      const data = await getAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SIMPATIK_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg('success', 'File backup berhasil diunduh.');
    } catch { showMsg('error', 'Gagal mengekspor backup.'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await restoreData(data);
      showMsg('success', 'Data berhasil dipulihkan dari file.');
      e.target.value = '';
    } catch { showMsg('error', 'Gagal memuat file backup. Pastikan format file benar.'); }
  };

  const restoreData = async (data: {
    siswa?: unknown[]; pengawas?: unknown[]; mapel?: unknown[];
    jadwalMapel?: unknown[]; konfigurasi?: unknown[]; hasilJadwal?: unknown[]; pengaturan?: unknown[];
  }) => {
    if (data.siswa) { await db.siswa.clear(); for (const r of data.siswa) await db.siswa.add(r as never); }
    if (data.pengawas) { await db.pengawas.clear(); for (const r of data.pengawas) await db.pengawas.add(r as never); }
    if (data.mapel) { await db.mataPelajaran.clear(); for (const r of data.mapel) await db.mataPelajaran.add(r as never); }
    if (data.jadwalMapel) { await db.jadwalMapel.clear(); for (const r of data.jadwalMapel) await db.jadwalMapel.add(r as never); }
    if (data.konfigurasi) { await db.konfigurasiUmum.clear(); for (const r of data.konfigurasi) await db.konfigurasiUmum.add(r as never); }
    if (data.hasilJadwal) { await db.hasilJadwal.clear(); for (const r of data.hasilJadwal) await db.hasilJadwal.add(r as never); }
    if (data.pengaturan) { await db.pengaturanSekolah.clear(); for (const r of data.pengaturan) await db.pengaturanSekolah.add(r as never); }
  };

  const handleRestore = async (backup: BackupRecord) => {
    if (!confirm('Pulihkan data dari backup ini? Data saat ini akan tertimpa.')) return;
    try {
      const data = JSON.parse(backup.dataJson);
      await restoreData(data);
      showMsg('success', `Data berhasil dipulihkan dari "${backup.namaFile}".`);
    } catch { showMsg('error', 'Gagal memulihkan backup.'); }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Hapus backup ini?')) { await db.backup.delete(id); load(); }
  };

  return (
    <div>
      <PageHeader
        title="Backup & Riwayat"
        description="Cadangkan dan pulihkan data aplikasi SIMPATIK."
        actions={
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn-primary text-xs"><Archive size={14} />Buat Backup Sekarang</button>
            <button onClick={handleExport} className="btn-secondary text-xs"><Download size={14} />Ekspor Backup ke File...</button>
            <label className="btn-secondary text-xs cursor-pointer">
              <Upload size={14} />Impor Backup dari File...
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        }
      />

      {msg && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="mb-5 card p-5 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Database size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-blue-800 text-sm mb-1">Penyimpanan Otomatis</div>
            <p className="text-sm text-blue-700">
              Semua data aplikasi tersimpan otomatis di database lokal browser (IndexedDB).
              Gunakan fitur backup untuk keamanan ekstra atau perpindahan perangkat.
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Riwayat Backup</h3>
          <span className="text-sm text-gray-400">{backups.length} backup tersimpan</span>
        </div>
        {backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Archive size={40} className="mb-3 opacity-40" />
            <p className="font-medium">Belum ada riwayat backup</p>
            <p className="text-sm">Klik "Buat Backup Sekarang" untuk membuat backup pertama.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th w-10">No</th>
                <th className="table-th">Nama File</th>
                <th className="table-th">Tanggal Backup</th>
                <th className="table-th">Ukuran</th>
                <th className="table-th w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((row, i) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td text-gray-400 text-center">{i + 1}</td>
                  <td className="table-td font-medium text-sm">{row.namaFile}</td>
                  <td className="table-td text-sm text-gray-500">
                    {new Date(row.tanggal).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="table-td text-sm text-gray-500">{formatBytes(row.ukuran)}</td>
                  <td className="table-td">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleRestore(row)} className="flex items-center gap-1 px-2 py-1.5 hover:bg-green-50 rounded-lg text-green-600 text-xs font-medium transition-colors">
                        <RotateCcw size={12} />Pulihkan
                      </button>
                      <button onClick={() => handleDelete(row.id!)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
