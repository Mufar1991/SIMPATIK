import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Download, Upload, UserCheck, AlertTriangle } from 'lucide-react';
import { db, Pengawas } from '../db/database';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { downloadExcelTemplate, importExcelFile } from '../utils/excelHelpers';

const emptyForm = { nip: '', kodeGuru: '', nama: '', mapelAsal: '', porsiMengawas: 4, preferensiSesi: [1, 2] as number[] };

export default function DataPengawas() {
  const [data, setData] = useState<Pengawas[]>([]);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<number | null>(null);

  const load = () => db.pengawas.orderBy('kodeGuru').toArray().then(setData);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...emptyForm, preferensiSesi: [1, 2] }); setModal('add'); };
  const openEdit = (row: Pengawas) => {
    setForm({ nip: row.nip, kodeGuru: row.kodeGuru, nama: row.nama, mapelAsal: row.mapelAsal, porsiMengawas: row.porsiMengawas, preferensiSesi: [...row.preferensiSesi] });
    setEditId(row.id!); setModal('edit');
  };

  const handleSave = async () => {
    if (!form.kodeGuru.trim() || !form.nama.trim()) return;
    const payload = { ...form };
    if (modal === 'add') await db.pengawas.add(payload);
    else if (editId !== null) await db.pengawas.update(editId, payload);
    setModal(null); load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Hapus pengawas ini?')) { await db.pengawas.delete(id); load(); }
  };

  const handleDeleteAll = async () => {
    if (confirm('Hapus SEMUA data pengawas?')) { await db.pengawas.clear(); load(); }
  };

  const handleTemplate = () => {
    downloadExcelTemplate(
      [['NIP', 'Kode Guru', 'Nama', 'Mapel Asal', 'Porsi Mengawas', 'Preferensi Sesi (1/2/1,2)'],
       ['19910101 201903 1 006', 'MF', 'Muhammad Farid, S.Pd', 'Informatika', 4, '1,2']],
      'Template_Pengawas.xlsx'
    );
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importExcelFile(file, { nip: 0, kodeGuru: 1, nama: 2, mapelAsal: 3, porsiMengawas: 4, preferensiSesi: 5 }, 1);
      for (const row of rows) {
        if (row.kodeGuru && row.nama) {
          const sesiStr = String(row.preferensiSesi || '1,2');
          const preferensiSesi = sesiStr.split(',').map(Number).filter((n) => n === 1 || n === 2);
          await db.pengawas.add({
            nip: String(row.nip || ''),
            kodeGuru: String(row.kodeGuru),
            nama: String(row.nama),
            mapelAsal: String(row.mapelAsal || ''),
            porsiMengawas: Number(row.porsiMengawas) || 4,
            preferensiSesi: preferensiSesi.length > 0 ? preferensiSesi : [1, 2],
          });
        }
      }
      load(); e.target.value = '';
    } catch { alert('Gagal membaca file Excel.'); }
  };

  const toggleSesi = (sesi: number) => {
    setForm((f) => {
      const curr = f.preferensiSesi;
      const next = curr.includes(sesi) ? curr.filter((s) => s !== sesi) : [...curr, sesi].sort();
      return { ...f, preferensiSesi: next.length === 0 ? [sesi] : next };
    });
  };

  return (
    <div>
      <PageHeader
        title="Data Pengawas"
        description="Kelola daftar guru yang bertugas sebagai pengawas ujian."
        actions={
          <>
            <button onClick={handleTemplate} className="btn-secondary text-xs"><Download size={14} />Template Excel</button>
            <label className="btn-secondary text-xs cursor-pointer">
              <Upload size={14} />Impor Excel
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={handleDeleteAll} className="btn-danger text-xs"><AlertTriangle size={14} />Hapus Semua</button>
            <button onClick={openAdd} className="btn-primary text-xs"><Plus size={14} />+ Tambah Pengawas</button>
          </>
        }
      />

      <div className="card overflow-hidden">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UserCheck size={40} className="mb-3 opacity-40" />
            <p className="font-medium">Belum ada data pengawas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th w-10">No</th>
                  <th className="table-th">NIP</th>
                  <th className="table-th">Kode</th>
                  <th className="table-th">Nama</th>
                  <th className="table-th">Mapel Asal</th>
                  <th className="table-th text-center">Porsi</th>
                  <th className="table-th text-center">Sesi</th>
                  <th className="table-th w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td text-gray-400 text-center">{i + 1}</td>
                    <td className="table-td font-mono text-xs">{row.nip}</td>
                    <td className="table-td">
                      <span className="font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded font-mono text-sm">{row.kodeGuru}</span>
                    </td>
                    <td className="table-td font-medium">{row.nama}</td>
                    <td className="table-td text-gray-500 text-sm">{row.mapelAsal}</td>
                    <td className="table-td text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">{row.porsiMengawas}</span>
                    </td>
                    <td className="table-td text-center">
                      <div className="flex justify-center gap-1">
                        {[1, 2].map((s) => (
                          <span key={s} className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center border ${row.preferensiSesi.includes(s) ? 'bg-primary-500 text-white border-primary-500' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(row.id!)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Tambah Pengawas' : 'Edit Pengawas'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Guru *</label>
                <input className="input-field font-mono uppercase" value={form.kodeGuru} onChange={(e) => setForm({ ...form, kodeGuru: e.target.value.toUpperCase() })} placeholder="MF" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                <input className="input-field" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} placeholder="19xx..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
              <input className="input-field" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama, S.Pd" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mapel Asal</label>
              <input className="input-field" value={form.mapelAsal} onChange={(e) => setForm({ ...form, mapelAsal: e.target.value })} placeholder="Matematika" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porsi Mengawas (maks. kali)</label>
              <input type="number" min={1} max={20} className="input-field" value={form.porsiMengawas} onChange={(e) => setForm({ ...form, porsiMengawas: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferensi Sesi</label>
              <div className="flex gap-3">
                {[1, 2].map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.preferensiSesi.includes(s)} onChange={() => toggleSesi(s)} className="w-4 h-4 accent-primary-500" />
                    <span className="text-sm">Sesi {s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModal(null)} className="btn-secondary">Batal</button>
              <button onClick={handleSave} className="btn-primary">Simpan</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
