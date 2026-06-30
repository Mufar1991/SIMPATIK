import { useState } from 'react';
import { FileSpreadsheet, Download, CheckCircle, AlertCircle, Users, UserCheck, Calendar, LucideIcon } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { exportDaftarHadirPengawas, exportJadwalPengawas, exportDaftarHadirPeserta } from '../utils/excelExport';

interface ExportCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  buttonLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  action: () => Promise<void>;
}

export default function EksporExcel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (card: ExportCard) => {
    setLoading(card.id); setSuccess(null); setError(null);
    try {
      await card.action();
      setSuccess(card.id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal mengekspor.');
      setTimeout(() => setError(null), 5000);
    } finally { setLoading(null); }
  };

  const cards: ExportCard[] = [
    { id: 'jadwal', title: 'Jadwal Pengawas Ruangan', description: 'Ekspor jadwal pengawas dalam format matriks horizontal.', icon: Calendar, buttonLabel: 'Simpan Jadwal', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', action: exportJadwalPengawas },
    { id: 'hadir-pengawas', title: 'Daftar Hadir Pengawas', description: 'Ekspor daftar hadir pengawas per ruangan.', icon: UserCheck, buttonLabel: 'Simpan Daftar Hadir', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', action: exportDaftarHadirPengawas },
    { id: 'hadir-peserta', title: 'Daftar Hadir & Nilai Peserta', description: 'Ekspor daftar hadir siswa per ruangan.', icon: Users, buttonLabel: 'Simpan Daftar Peserta', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', action: exportDaftarHadirPeserta },
  ];

  return (
    <div>
      <PageHeader title="Ekspor Excel" description="Unduh dokumen siap cetak untuk keperluan pelaksanaan ujian sumatif." />
      {error && (
        <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />{error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const isLoading = loading === card.id;
          const isSuccess = success === card.id;
          return (
            <div key={card.id} className={`card p-6 flex flex-col border-2 ${card.borderColor} hover:shadow-md transition-all duration-200`}>
              <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center mb-4`}><Icon size={24} className={card.color} /></div>
              <h3 className="font-semibold text-gray-800 text-base mb-2">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-6">{card.description}</p>
              <button onClick={() => handleExport(card)} disabled={isLoading || loading !== null}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${isSuccess ? 'bg-green-500 text-white' : `${card.bgColor} ${card.color} hover:opacity-80 border ${card.borderColor}`} disabled:opacity-50 disabled:cursor-not-allowed`}>
                {isLoading ? (<><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Memproses...</>) : isSuccess ? (<><CheckCircle size={16} />Berhasil Diunduh!</>) : (<><Download size={16} />{card.buttonLabel}</>)}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-6 card p-5 bg-primary-50 border border-primary-200">
        <div className="flex items-start gap-3">
          <FileSpreadsheet size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-primary-800 text-sm mb-1">Catatan Ekspor</div>
            <ul className="text-sm text-primary-700 space-y-1 list-disc list-inside">
              <li>Pastikan jadwal sudah di-generate terlebih dahulu.</li>
              <li>File Excel akan otomatis terunduh ke folder Downloads.</li>
              <li>Data kop surat dan penandatangan diambil dari menu "Pengaturan Sekolah".</li>
              <li>Setiap ruangan ujian akan menghasilkan sheet tersendiri.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
