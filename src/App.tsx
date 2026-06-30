import { useState } from 'react';
import Sidebar, { PageKey } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PengaturanSekolah from './pages/PengaturanSekolah';
import MataPelajaran from './pages/MataPelajaran';
import DataSiswa from './pages/DataSiswa';
import DataPengawas from './pages/DataPengawas';
import KonfigurasiSumatif from './pages/KonfigurasiSumatif';
import JadwalHasil from './pages/JadwalHasil';
import EksporExcel from './pages/EksporExcel';
import BackupRiwayat from './pages/BackupRiwayat';

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');

  const pages: Record<PageKey, React.ReactNode> = {
    'dashboard': <Dashboard onNavigate={(p) => setActivePage(p as PageKey)} />,
    'pengaturan-sekolah': <PengaturanSekolah />,
    'mata-pelajaran': <MataPelajaran />,
    'data-siswa': <DataSiswa />,
    'data-pengawas': <DataPengawas />,
    'konfigurasi-sumatif': <KonfigurasiSumatif />,
    'jadwal-hasil': <JadwalHasil />,
    'ekspor-excel': <EksporExcel />,
    'backup-riwayat': <BackupRiwayat />,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {pages[activePage]}
        </div>
      </main>
    </div>
  );
}
