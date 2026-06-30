import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Download, Upload, Users, Search, AlertTriangle } from 'lucide-react';
import { db, Siswa } from '../db/database';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { downloadExcelTemplate, importExcelFile } from '../utils/excelHelpers';

export default function DataSiswa() {
  const [data, setData] = useState<Siswa[]>([]);
  const [filtered, setFiltered] = useState<Siswa[]>([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState({ nisn: '', nama: '', kelas: '' });
  const [editId, setEditId] = useState<number | null>(null);

  const load = () => db.siswa.orderBy('kelas').toArray().then((rows) => { setData(rows); setFiltered(rows); });
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(data.filter((r) => r.nisn.toLowerCase().includes(q) || r.nama.toLowerCase().includes(q) || r.kelas.toLowerCase().includes(q)));
  }, [search, data]);

  const openAdd = () => { setForm({ nisn: '', nama: '', kelas: '' }); setModal('add'); };
  const openEdit = (row: Siswa) => { setForm({ nisn: row.nisn, nama: row.nama, kelas: row.kelas }); setEditId(row.id!); setModal('edit'); };

  const handleSave = async () => {
    if (!form.nisn.trim() || !form.nama.trim() || !form.kelas.trim()) return;
    if (modal === 'add') await db.siswa.add(form);
    else if (editId !== null) await db.siswa.update(editId, form);
    setModal(null); load();
  };

  const handleDelete = async (id: number) => { if (confirm('Hapus siswa ini?')) { await db.siswa.delete(id); load(); } };

  const handleDeleteAll = async () => {
    if (confirm('Hapus SEMUA data siswa?')) { await db.siswa.clear(); load(); }
  };

  const handleTemplate = () => downloadExcelTemplate([['NISN', 'Nama', 'Kelas'], ['0123456789', 'Nama Siswa', 'VII A']], 'Template_Siswa.xlsx');

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await importExcelFile(file, { nisn: 0, nama: 1, kelas: 2 }, 1);
      for (const row of rows) {
        if (row.nisn && row.nama && row.kelas) await db.siswa.add({ nisn: String(row.nisn), nama: String(row.nama), kelas: String(row.kelas) });
      }
      load(); e.target.value = '';
    } catch { alert('Gagal membaca file Excel.'); }
  };

  const kelasList = [...new Set(data.map((s) => s.kelas))].sort();

  return (
    <div>
      <PageHeader title="Data Siswa" description="Kelola data peserta ujian sumatif." actions={
        <>
          <button onClick={handleTemplate} className="btn-secondary text-xs"><Download size={14} />Template Excel</button>
          <label className="btn-secondary text-xs cursor-pointer"><Upload size={14} />Impor Excel<input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} /></label>
          <button onClick={handleDeleteAll} className="btn-danger text-xs"><AlertTriangle size={14} />Hapus Semua</button>
          <button onClick={openAdd} className="btn-primary text-xs"><Plus size={14} />+ Tambah Siswa</button>
        </>
      } />
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Cari NISN, nama, atau kelas..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} siswa</span>
        {kelasList.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {kelasList.map((k) => (
              <span key={k} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium border border-primary-200">{k}: {data.filter(s => s.kelas === k).length}</span>
            ))}
          </div>
        )}
      </div>
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={40} className="mb-3 opacity-40" />
            <p className="font-medium">{search ? 'Tidak ditemukan' : 'Belum ada data siswa'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="table-th w-12">No</th><th className="table-th">NISN</th><th className="table-th">Nama Siswa</th><th className="table-th">Kelas</th><th className="table-th w-24 text-center">Aksi</th></tr></thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td text-gray-400 text-center">{i + 1}</td>
                    <td className="table-td font-mono text-sm">{row.nisn}</td>
                    <td className="table-td font-medium">{row.nama}</td>
                    <td className="table-td"><span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium border border-primary-100">{row.kelas}</span></td>
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
        <Modal title={modal === 'add' ? 'Tambah Siswa' : 'Edit Siswa'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            {[{ label: 'NISN', key: 'nisn' as const, placeholder: '0123456789' }, { label: 'Nama Siswa', key: 'nama' as const, placeholder: 'Nama lengkap' }, { label: 'Kelas', key: 'kelas' as const, placeholder: 'Contoh: VII A, VIII B' }].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input className="input-field" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2"><button onClick={() => setModal(null)} className="btn-secondary">Batal</button><button onClick={handleSave} className="btn-primary">Simpan</button></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
