import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Download, Upload, BookOpen } from 'lucide-react';
import { db, MataPelajaran as MapelType } from '../db/database';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { downloadExcelTemplate, importExcelFile } from '../utils/excelHelpers';

interface MapelForm { kode: string; nama: string; }

export default function MataPelajaran() {
  const [data, setData] = useState<MapelType[]>([]);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<MapelForm>({ kode: '', nama: '' });
  const [editId, setEditId] = useState<number | null>(null);

  const load = () => db.mataPelajaran.orderBy('kode').toArray().then(setData);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ kode: '', nama: '' }); setModal('add'); };
  const openEdit = (row: MapelType) => { setForm({ kode: row.kode, nama: row.nama }); setEditId(row.id!); setModal('edit'); };

  const handleSave = async () => {
    if (!form.kode.trim() || !form.nama.trim()) return;
    if (modal === 'add') await db.mataPelajaran.add(form);
    else if (editId !== null) await db.mataPelajaran.update(editId, form);
    setModal(null); load();
  };

  const handleDelete = async (id: number) => { if (confirm('Hapus mata pelajaran ini?')) { await db.mataPelajaran.delete(id); load(); } };

  const handleTemplate = () => downloadExcelTemplate([['Kode', 'Nama Mapel'], ['MTK', 'Matematika'], ['IPA', 'Ilmu Pengetahuan Alam']], 'Template_Mapel.xlsx');

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importExcelFile(file, { kode: 0, nama: 1 }, 1);
      for (const row of rows) { if (row.kode && row.nama) await db.mataPelajaran.add({ kode: String(row.kode), nama: String(row.nama) }); }
      load(); e.target.value = '';
    } catch { alert('Gagal membaca file Excel.'); }
  };

  return (
    <div>
      <PageHeader title="Mata Pelajaran" description="Kelola daftar mata pelajaran yang diujikan." actions={
        <>
          <button onClick={handleTemplate} className="btn-secondary text-xs"><Download size={14} />Template Excel</button>
          <label className="btn-secondary text-xs cursor-pointer"><Upload size={14} />Impor Excel<input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} /></label>
          <button onClick={openAdd} className="btn-primary text-xs"><Plus size={14} />+ Tambah Mapel</button>
        </>
      } />
      <div className="card overflow-hidden">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BookOpen size={40} className="mb-3 opacity-40" />
            <p className="font-medium">Belum ada mata pelajaran</p>
          </div>
        ) : (
          <table className="w-full">
            <thead><tr><th className="table-th w-12">No</th><th className="table-th">Kode</th><th className="table-th">Nama Mata Pelajaran</th><th className="table-th w-24 text-center">Aksi</th></tr></thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td text-gray-400 text-center">{i + 1}</td>
                  <td className="table-td font-mono font-medium text-primary-600">{row.kode}</td>
                  <td className="table-td">{row.nama}</td>
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
        )}
      </div>
      {modal && (
        <Modal title={modal === 'add' ? 'Tambah Mata Pelajaran' : 'Edit Mata Pelajaran'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Kode Mapel</label><input className="input-field" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} placeholder="Contoh: MTK, IPA, BIN" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Mata Pelajaran</label><input className="input-field" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap mata pelajaran" /></div>
            <div className="flex justify-end gap-2 pt-2"><button onClick={() => setModal(null)} className="btn-secondary">Batal</button><button onClick={handleSave} className="btn-primary">Simpan</button></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
