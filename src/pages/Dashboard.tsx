import { useEffect, useState } from 'react';
import { Users, UserCheck, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { db } from '../db/database';
import PageHeader from '../components/PageHeader';

interface Stats {
  siswa: number;
  pengawas: number;
  mapel: number;
  sesi: number;
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({ siswa: 0, pengawas: 0, mapel: 0, sesi: 0 });

  useEffect(() => {
    const load = async () => {
      const [siswa, pengawas, mapel, jadwal, konfig] = await Promise.all([
        db.siswa.count(),
        db.pengawas.count(),
        db.mataPelajaran.count(),
        db.jadwalMapel.count(),
        db.konfigurasiUmum.toArray(),
      ]);
      const sesiPerHari = konfig[0]?.sesiPerHari ?? 0;
      const totalHari = konfig[0]?.totalHari ?? 0;
      setStats({ siswa, pengawas, mapel, sesi: jadwal > 0 ? jadwal : sesiPerHari * totalHari });
    };
    load();
  }, []);

  const cards = [
    { label: 'SISWA', value: stats.siswa, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'PENGAWAS', value: stats.pengawas, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'MATA PELAJARAN', value: stats.mapel, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'SESI TERJADWAL', value: stats.sesi, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const steps = [
    { num: '01', title: 'Input Data', desc: 'Tambahkan data siswa, pengawas, dan mata pelajaran', page: 'data-siswa' },
    { num: '02', title: 'Konfigurasi', desc: 'Atur parameter sumatif, ruangan, dan jadwal mapel', page: 'konfigurasi-sumatif' },
    { num: '03', title: 'Generate Jadwal', desc: 'Otomasi penempatan siswa dan pengawas secara adil', page: 'jadwal-hasil' },
    { num: '04', title: 'Ekspor ke Excel', desc: 'Unduh daftar hadir dan jadwal siap cetak', page: 'ekspor-excel' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan data sumatif. Pilih menu di sidebar untuk mulai bekerja." />

      <div className="relative rounded-2xl overflow-hidden mb-8" style={{ background: 'linear-gradient(135deg, #1a4a2e 0%, #2d7a3e 60%, #3a9650 100%)' }}>
        <div className="px-8 py-8 relative z-10">
          <div className="text-green-300/80 text-xs font-semibold uppercase tracking-widest mb-2">Aplikasi Offline</div>
          <h2 className="text-white text-2xl font-bold mb-2 max-w-lg">Atur Penilaian Sumatif dalam 4 langkah.</h2>
          <p className="text-green-200/80 text-sm">Input data &rarr; Konfigurasi &rarr; Generate jadwal &rarr; Ekspor ke Excel.</p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
          <div className="w-32 h-32 border-8 border-white rounded-2xl rotate-12" />
          <div className="w-20 h-20 border-8 border-white rounded-2xl rotate-12 absolute -top-4 -right-4" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 tracking-wider">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={15} className={color} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Panduan Penggunaan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(({ num, title, desc, page }) => (
            <button key={num} onClick={() => onNavigate(page)} className="text-left p-4 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all duration-150 group">
              <div className="text-3xl font-black text-primary-500/20 mb-2 group-hover:text-primary-500/40 transition-colors">{num}</div>
              <div className="font-semibold text-gray-800 text-sm mb-1">{title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
              <div className="mt-3 flex items-center gap-1 text-primary-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Mulai</span><ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
