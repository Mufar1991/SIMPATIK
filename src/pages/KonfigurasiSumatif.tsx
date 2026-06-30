import { useEffect, useState } from 'react';
import { Save, Plus, Edit2, Trash2, Download, Upload, CheckCircle, X } from 'lucide-react';
import { db, JadwalMapel, KonfigurasiUmum, AlokasiRuangKelas } from '../db/database';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { downloadExcelTemplate, importExcelFile } from '../utils/excelHelpers';

const defaultConfig: Omit<KonfigurasiUmum, 'id'> = {
  namaEvent: 'Penilaian Sumatif Akhir Tahun (PSAT)',
  totalHari: 5,
  sesiPerHari: 2,
  kapasitasRuang: 32,
  pengawasPerRuang: 2,
  alokasiRuang: [
    { kelas: 'VII', ruangMulai: 1, ruangSelesai: 7 },
    { kelas: 'VIII', ruangMulai: 8, ruangSelesai: 13 },
    { kelas: 'IX', ruangMulai: 14, ruangSelesai: 19 },
  ],
};

interface JadwalForm { hari: number; sesi: number; mapelId: number; labelHari: string; tanggal: string; jamMulai: string; jamSelesai: string; }
const emptyJadwal: JadwalForm = { hari: 1, sesi: 1, mapelId: 0, labelHari: '', tanggal: '', jamMulai: '07.15', jamSelesai: '09.15' };

export default function KonfigurasiSumatif() {
  const [config, setConfig] = useState<Omit<KonfigurasiUmum, 'id'>>(defaultConfig);
  const [configId, setConfigId] = useState<number | undefined>();
  const [jadwal, setJadwal] = useState<JadwalMapel[]>([]);
  const [mapelList, setMapelList] = useState<{ id: number; kode: string; nama: string }[]>([]);
  const [jadwalModal, setJadwalModal] = useState<'add' | 'edit' | null>(null);
  const [jadwalForm, setJadwalForm] = useState<JadwalForm>({ ...emptyJadwal });
  const [jadwalEditId, setJadwalEditId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const loadAll = async () => {
    const [cfg, jdw, mpl] = await Promise.all([db.konfigurasiUmum.toArray(), db.jadwalMapel.orderBy('hari').toArray(), db.mataPelajaran.orderBy('kode').toArray()]);
    if (cfg.length > 0) { const { id, ...rest } = cfg[0]; setConfigId(id); setConfig(rest); }
    setJadwal(jdw); setMapelList(mpl as { id: number; kode: string; nama: string }[]);
  };

  useEffect(() => { loadAll(); }, []);

  const handleSaveConfig = async () => {
    if (configId !== undefined) await db.konfigurasiUmum.update(configId, config);
    else { const id = await db.konfigurasiUmum.add(config); setConfigId(id as number); }
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const updateAlokasi = (idx: number, key: keyof AlokasiRuangKelas, value: string | number) => {
    setConfig((c) => { const arr = [...c.alokasiRuang]; arr[idx] = { ...arr[idx], [key]: key === 'kelas' ? value : Number(value) }; return { ...c, alokasiRuang: arr }; });
  };

  const addAlokasi = () => setConfig((c) => ({ ...c, alokasiRuang: [...c.alokasiRuang, { kelas: '', ruangMulai: 1, ruangSelesai: 1 }] }));
  const removeAlokasi = (idx: number) => setConfig((c) => ({ ...c, alokasiRuang: c.alokasiRuang.filter((_, i) => i !== idx) }));

  const openAddJadwal = () => { setJadwalForm({ ...emptyJadwal }); setJadwalModal('add'); };
  const openEditJadwal = (row: JadwalMapel) => { setJadwalForm({ hari: row.hari, sesi: row.sesi, mapelId: row.mapelId, labelHari: row.labelHari, tanggal: row.tanggal, jamMulai: row.jamMulai, jamSelesai: row.jamSelesai }); setJadwalEditId(row.id!); setJadwalModal('edit'); };

  const handleSaveJadwal = async () => {
    if (!jadwalForm.mapelId) return;
    if (jadwalModal === 'add') await db.jadwalMapel.add(jadwalForm);
    else if (jadwalEditId !== null) await db.jadwalMapel.update(jadwalEditId, jadwalForm);
    setJadwalModal(null); loadAll();
  };

  const handleDeleteJadwal = async (id: number) => { if (confirm('Hapus jadwal ini?')) { await db.jadwalMapel.delete(id); loadAll(); } };

  const hariNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const handleJadwalTemplate = () => downloadExcelTemplate([['Hari', 'Sesi', 'Kode Mapel', 'Label Hari', 'Tanggal', 'Jam Mulai', 'Jam Selesai'], [1, 1, 'MTK', 'Senin, 02 Juni 2026', '02/06/2026', '07.15', '09.15']], 'Template_Jadwal.xlsx');

  const handleJadwalImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importExcelFile(file, { hari: 0, sesi: 1, kodeMapel: 2, labelHari: 3, tanggal: 4, jamMulai: 5, jamSelesai: 6 }, 1);
      for (const row of rows) {
        const mapel = mapelList.find((m) => m.kode === String(row.kodeMapel));
        if (mapel && row.hari && row.sesi) {
          await db.jadwalMapel.add({ hari: Number(row.hari), sesi: Number(row.sesi), mapelId: mapel.id, labelHari: String(row.labelHari || ''), tanggal: String(row.tanggal || ''), jamMulai: String(row.jamMulai || ''), jamSelesai: String(row.jamSelesai || '') });
        }
      }
      loadAll(); e.target.value = '';
    } catch { alert('Gagal membaca file Excel.'); }
  };

  return (
    <div>
      <PageHeader title="Konfigurasi Sumatif" description="Parameter umum, alokasi ruang, dan jadwal mata pelajaran." actions={
        <button onClick={handleSaveConfig} className="btn-primary">{saved ? <CheckCircle size={16} /> : <Save size={16} />}{saved ? 'Tersimpan!' : 'Simpan Konfigurasi'}</button>
      } />
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Parameter Umum</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3"><label className="block text-sm font-medium text-gray-700 mb-1">Nama Event</label><input className="input-field" value={config.namaEvent} onChange={(e) => setConfig({ ...config, namaEvent: e.target.value })} /></div>
            {[{ label: 'Total Hari', key: 'totalHari' as const }, { label: 'Sesi per Hari', key: 'sesiPerHari' as const }, { label: 'Kapasitas Ruang (Siswa Max)', key: 'kapasitasRuang' as const }, { label: 'Pengawas per Ruang', key: 'pengawasPerRuang' as const }].map(({ label, key }) => (
              <div key={key}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type="number" min={1} className="input-field" value={config[key]} onChange={(e) => setConfig({ ...config, [key]: Number(e.target.value) })} /></div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
            <h3 className="font-semibold text-gray-800">Alokasi Ruang per Kelas</h3>
            <button onClick={addAlokasi} className="btn-secondary text-xs py-1"><Plus size={12} />Tambah Kelas</button>
          </div>
          <div className="space-y-3">
            {config.alokasiRuang.map((al, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div><label className="block text-xs text-gray-500 mb-1">Kelas</label><input className="input-field text-sm" value={al.kelas} onChange={(e) => updateAlokasi(idx, 'kelas', e.target.value)} placeholder="VII" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Ruang Mulai</label><input type="number" min={1} className="input-field text-sm" value={al.ruangMulai} onChange={(e) => updateAlokasi(idx, 'ruangMulai', e.target.value)} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Ruang Selesai</label><input type="number" min={1} className="input-field text-sm" value={al.ruangSelesai} onChange={(e) => updateAlokasi(idx, 'ruangSelesai', e.target.value)} /></div>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap mt-4">→ R{al.ruangMulai} – R{al.ruangSelesai}</div>
                <button onClick={() => removeAlokasi(idx)} className="mt-4 p-1.5 hover:bg-red-50 rounded text-red-400"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
            <h3 className="font-semibold text-gray-800">Jadwal Mata Pelajaran</h3>
            <div className="flex gap-2">
              <button onClick={handleJadwalTemplate} className="btn-secondary text-xs py-1"><Download size={12} />Template</button>
              <label className="btn-secondary text-xs py-1 cursor-pointer"><Upload size={12} />Impor<input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleJadwalImport} /></label>
              <button onClick={openAddJadwal} className="btn-primary text-xs py-1"><Plus size={12} />+ Tambah</button>
            </div>
          </div>
          {jadwal.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Belum ada jadwal. Klik "+ Tambah" atau impor dari Excel.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className="table-th">Hari</th><th className="table-th">Sesi</th><th className="table-th">Mata Pelajaran</th><th className="table-th">Label Hari/Tgl</th><th className="table-th">Tanggal</th><th className="table-th">Jam Mulai</th><th className="table-th">Jam Selesai</th><th className="table-th w-20 text-center">Aksi</th></tr></thead>
                <tbody>
                  {jadwal.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="table-td">{hariNames[row.hari] || `Hari ${row.hari}`}</td>
                      <td className="table-td text-center">{row.sesi}</td>
                      <td className="table-td font-medium">{mapelList.find((m) => m.id === row.mapelId)?.nama || `ID ${row.mapelId}`}</td>
                      <td className="table-td text-sm text-gray-500">{row.labelHari}</td>
                      <td className="table-td text-sm">{row.tanggal}</td>
                      <td className="table-td font-mono text-sm">{row.jamMulai}</td>
                      <td className="table-td font-mono text-sm">{row.jamSelesai}</td>
                      <td className="table-td">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => openEditJadwal(row)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500"><Edit2 size={13} /></button>
                          <button onClick={() => handleDeleteJadwal(row.id!)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {jadwalModal && (
        <Modal title={jadwalModal === 'add' ? 'Tambah Jadwal' : 'Edit Jadwal'} onClose={() => setJadwalModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Hari ke-</label><input type="number" min={1} className="input-field" value={jadwalForm.hari} onChange={(e) => setJadwalForm({ ...jadwalForm, hari: Number(e.target.value) })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Sesi</label><select className="input-field" value={jadwalForm.sesi} onChange={(e) => setJadwalForm({ ...jadwalForm, sesi: Number(e.target.value) })}>{[1, 2, 3].map((s) => <option key={s} value={s}>Sesi {s}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label><select className="input-field" value={jadwalForm.mapelId} onChange={(e) => setJadwalForm({ ...jadwalForm, mapelId: Number(e.target.value) })}><option value={0}>-- Pilih Mapel --</option>{mapelList.map((m) => <option key={m.id} value={m.id}>{m.kode} - {m.nama}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Label Hari / Tanggal</label><input className="input-field" value={jadwalForm.labelHari} onChange={(e) => setJadwalForm({ ...jadwalForm, labelHari: e.target.value })} placeholder="Senin, 02 Juni 2026" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input className="input-field" value={jadwalForm.tanggal} onChange={(e) => setJadwalForm({ ...jadwalForm, tanggal: e.target.value })} placeholder="02/06/2026" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label><input className="input-field" value={jadwalForm.jamMulai} onChange={(e) => setJadwalForm({ ...jadwalForm, jamMulai: e.target.value })} placeholder="07.15" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label><input className="input-field" value={jadwalForm.jamSelesai} onChange={(e) => setJadwalForm({ ...jadwalForm, jamSelesai: e.target.value })} placeholder="09.15" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2"><button onClick={() => setJadwalModal(null)} className="btn-secondary">Batal</button><button onClick={handleSaveJadwal} className="btn-primary">Simpan</button></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
