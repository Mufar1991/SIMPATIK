import {
  LayoutDashboard, Settings, BookOpen, Users, UserCheck,
  ClipboardList, Calendar, FileSpreadsheet, Archive,
  ChevronRight, LucideIcon,
} from 'lucide-react';

export type PageKey =
  | 'dashboard'
  | 'pengaturan-sekolah'
  | 'mata-pelajaran'
  | 'data-siswa'
  | 'data-pengawas'
  | 'konfigurasi-sumatif'
  | 'jadwal-hasil'
  | 'ekspor-excel'
  | 'backup-riwayat';

interface NavItem {
  key: PageKey;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'pengaturan-sekolah', label: 'Pengaturan Sekolah', icon: Settings },
  { key: 'mata-pelajaran', label: 'Mata Pelajaran', icon: BookOpen },
  { key: 'data-siswa', label: 'Data Siswa', icon: Users },
  { key: 'data-pengawas', label: 'Data Pengawas', icon: UserCheck },
  { key: 'konfigurasi-sumatif', label: 'Konfigurasi Sumatif', icon: ClipboardList },
  { key: 'jadwal-hasil', label: 'Jadwal & Hasil', icon: Calendar },
  { key: 'ekspor-excel', label: 'Ekspor Excel', icon: FileSpreadsheet },
  { key: 'backup-riwayat', label: 'Backup & Riwayat', icon: Archive },
];

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 min-w-[256px] flex flex-col h-screen bg-[#0f301e] text-white overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white">
          <img src="/logo.png" alt="SIMPATIK" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="font-bold text-base leading-tight tracking-wide">SIMPATIK</div>
          <div className="text-[9px] text-green-300/70 leading-tight">Sistem Informasi Manajemen Penilaian Sumatif Elektronik</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map(({ key, label, icon: Icon }) => {
          const isActive = activePage === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-green-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {isActive && <ChevronRight size={14} className="opacity-70" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="px-3 text-center">
          <div className="text-[10px] text-green-400/50 leading-relaxed">
            v1.0.0 - Offline Edition
          </div>
          <div className="text-[9px] text-green-400/40 leading-relaxed">
            Hak Cipta Aplikasi : Muhammad Farid, S.Pd. Gr
          </div>
        </div>
      </div>
    </aside>
  );
}
