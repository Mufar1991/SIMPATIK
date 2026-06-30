import { useEffect, useRef, useState } from 'react';
import { Save, Upload, ImageIcon, CheckCircle } from 'lucide-react';
import { db, PengaturanSekolah as PengaturanType } from '../db/database';
import PageHeader from '../components/PageHeader';

const defaultSettings: Omit<PengaturanType, 'id'> = {
  baris1: 'PEMERINTAH KOTA',
  baris2: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  namaSekolah: '',
  alamat: '',
  logoBase64: '',
  tahunPelajaran: '2025/2026',
  judulSingkat: 'DAFTAR HADIR PESERTA PENILAIAN SUMATIF AKHIR TAHUN (PSAT) TAHUN PELAJARAN 2025/2026',
  judulHadirPengawas: 'DAFTAR HADIR PENGAWAS PENILAIAN SUMATIF AKHIR TAHUN (PSAT) TAHUN PELAJARAN 2025/2026',
  judulJadwalPengawas: 'JADWAL PENGAWAS PENILAIAN SUMATIF AKHIR TAHUN (PSAT) TAHUN PELAJARAN 2025/2026',
  kepalaSekolahNama: '',
  kepalaSekolahNip: '',
  ketuaPanitiaNama: '',
  ketuaPanitiaNip: '',
  sekretarisNama: '',
  sekretarisNip: '',
  tanggalPenandatanganan: '',
  kotaPenandatanganan: 'Pontianak',
};

export default function PengaturanSekolah() {
  const [form, setForm] = useState<Omit<PengaturanType, 'id'>>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [recordId, setRecordId] = useState<number | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.pengaturanSekolah.toArray().then((rows) => {
      if (rows.length > 0) { const { id, ...rest } = rows[0]; setRecordId(id); setForm(rest); }
    });
  }, []);

  const set = (key: keyof Omit<PengaturanType, 'id'>, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set('logoBase64', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (recordId !== undefined) await db.pengaturanSekolah.update(recordId, form);
    else { const id = await db.pengaturanSekolah.add(form); setRecordId(id as number); }
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const Field = ({ label, fieldKey, placeholder }: { label: string; fieldKey: keyof Omit<PengaturanType, 'id'>; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input className="input-field" value={(form[fieldKey] as string) || ''} onChange={(e) => set(fieldKey, e.target.value)} placeholder={placeholder} />
    </div>
  );

  return (
    <div>
      <PageHeader title="Pengaturan Sekolah" description="Logo, kop sekolah, dan pejabat penandatangan." actions={
        <button onClick={handleSave} className="btn-primary">{saved ? <CheckCircle size={16} /> : <Save size={16} />}{saved ? 'Tersimpan!' : 'Simpan Pengaturan'}</button>
      } />
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Kop Surat</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-full aspect-square max-w-[160px] rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                {form.logoBase64 ? <img src={form.logoBase64} alt="Logo" className="w-full h-full object-contain p-2" /> : <div className="text-center text-gray-400"><ImageIcon size={32} className="mx-auto mb-1" /><div className="text-xs">Belum ada logo</div></div>}
              </div>
              <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs py-1.5"><Upload size={14} />Pilih Logo</button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </div>
            <div className="lg:col-span-2 space-y-3">
              <Field label="Baris 1:" fieldKey="baris1" placeholder="Pemerintah Kota" />
              <Field label="Baris 2:" fieldKey="baris2" placeholder="Dinas Pendidikan" />
              <Field label="Nama Sekolah:" fieldKey="namaSekolah" placeholder="SMP NEGERI ..." />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat / Kontak:</label>
                <textarea className="input-field resize-none" rows={3} value={form.alamat} onChange={(e) => set('alamat', e.target.value)} placeholder="Jl. ... Telp. ..." />
              </div>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Judul Event</h3>
          <div className="space-y-3">
            <Field label="Tahun Pelajaran:" fieldKey="tahunPelajaran" placeholder="2025/2026" />
            <Field label="Judul Singkat:" fieldKey="judulSingkat" />
            <Field label="Judul Hadir Pengawas:" fieldKey="judulHadirPengawas" />
            <Field label="Judul Jadwal Pengawas:" fieldKey="judulJadwalPengawas" />
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Pejabat Penandatangan</h3>
          <div className="space-y-4">
            {[{ label: 'Kepala Sekolah', namaKey: 'kepalaSekolahNama' as const, nipKey: 'kepalaSekolahNip' as const }, { label: 'Ketua Panitia', namaKey: 'ketuaPanitiaNama' as const, nipKey: 'ketuaPanitiaNip' as const }, { label: 'Sekretaris', namaKey: 'sekretarisNama' as const, nipKey: 'sekretarisNip' as const }].map(({ label, namaKey, nipKey }) => (
              <div key={label} className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1"><span className="font-semibold">{label}</span> - Nama:</label><input className="input-field" value={form[namaKey] || ''} onChange={(e) => set(namaKey, e.target.value)} placeholder="Nama Lengkap" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">NIP:</label><input className="input-field" value={form[nipKey] || ''} onChange={(e) => set(nipKey, e.target.value)} placeholder="NIP" /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Tanggal Penandatanganan</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kota:" fieldKey="kotaPenandatanganan" placeholder="Pontianak" />
            <Field label="Tanggal:" fieldKey="tanggalPenandatanganan" placeholder="Juni 2026" />
          </div>
        </div>
      </div>
    </div>
  );
}
