import { useEffect, useState } from 'react';
import { RefreshCw, ChevronDown, ChevronRight, Users, UserCheck, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db, JadwalHasil } from '../db/database';
import { generateJadwal } from '../utils/scheduleGenerator';
import PageHeader from '../components/PageHeader';

export default function JadwalHasilPage() {
  const [hasil, setHasil] = useState<JadwalHasil[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    const rows = await db.hasilJadwal.toArray();
    if (rows.length > 0) { setHasil(rows[rows.length - 1].data); setGeneratedAt(rows[rows.length - 1].generatedAt); }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setLoading(true); setError('');
    try {
      const result = await generateJadwal();
      setHasil(result);
      setGeneratedAt(new Date().toISOString());
      setExpanded(new Set());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Terjadi kesalahan.'); }
    finally { setLoading(false); }
  };

  const toggle = (key: string) => setExpanded((s) => { const ns = new Set(s); ns.has(key) ? ns.delete(key) : ns.add(key); return ns; });

  const grouped = new Map<number, Map<number, JadwalHasil[]>>();
  for (const item of hasil) {
    if (!grouped.has(item.hari)) grouped.set(item.hari, new Map());
    const hariMap = grouped.get(item.hari)!;
    if (!hariMap.has(item.sesi)) hariMap.set(item.sesi, []);
    hariMap.get(item.sesi)!.push(item);
  }

  return (
    <div>
      <PageHeader title="Jadwal & Hasil" description="Generate dan lihat hasil penempatan siswa dan pengawas." actions={
        <button onClick={handleGenerate} disabled={loading} className="btn-primary">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />{loading ? 'Memproses...' : 'Generate Jadwal'}
        </button>
      } />
      {error && <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"><AlertCircle size={16} className="flex-shrink-0" />{error}</div>}
      {generatedAt && !error && <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm"><CheckCircle2 size={16} />Jadwal berhasil dibuat pada {new Date(generatedAt).toLocaleString('id-ID')}. Total sesi: {hasil.length}.</div>}
      {hasil.length === 0 && !error ? (
        <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
          <BookOpen size={48} className="mb-4 opacity-30" />
          <p className="font-medium text-gray-500">Belum ada jadwal dibuat</p>
          <p className="text-sm mt-1">Klik "Generate Jadwal" untuk memulai.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...grouped.entries()].sort(([a], [b]) => a - b).map(([hari, sesiMap]) => {
            const hariKey = `hari-${hari}`;
            const firstSesi = [...sesiMap.values()][0]?.[0];
            const isHariOpen = expanded.has(hariKey);
            return (
              <div key={hari} className="card overflow-hidden">
                <button onClick={() => toggle(hariKey)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold ${isHariOpen ? 'bg-primary-500' : 'bg-gray-400'}`}>{hari}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">Hari {hari}{firstSesi?.labelHari ? ` — ${firstSesi.labelHari}` : ''}</div>
                    <div className="text-xs text-gray-400">{firstSesi?.tanggal || ''} &bull; {sesiMap.size} sesi</div>
                  </div>
                  {isHariOpen ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                </button>
                {isHariOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {[...sesiMap.entries()].sort(([a], [b]) => a - b).map(([sesi, items]) => {
                      const sesiKey = `${hariKey}-sesi-${sesi}`;
                      const isSesiOpen = expanded.has(sesiKey);
                      return (
                        <div key={sesi}>
                          <button onClick={() => toggle(sesiKey)} className="w-full flex items-center gap-3 px-7 py-3 text-left hover:bg-gray-50 transition-colors">
                            <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">{sesi}</div>
                            <div className="flex-1 text-sm font-medium text-gray-700">Sesi {sesi} &bull; {items[0]?.jamMulai} – {items[0]?.jamSelesai} &bull; <span className="text-primary-600 font-semibold">{items[0]?.namaMapel}</span></div>
                            <span className="text-xs text-gray-400">{items[0]?.ruangan.length} ruang</span>
                            {isSesiOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                          </button>
                          {isSesiOpen && items[0] && (
                            <div className="bg-gray-50 px-7 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {items[0].ruangan.map((ruang) => (
                                <div key={ruang.namaRuang} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-primary-600 text-sm">{ruang.namaRuang}</span>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{[...new Set(ruang.siswa.map(s => s.kelas))].sort().join(', ')}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1"><Users size={12} /><span>{ruang.siswa.length} siswa</span></div>
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2"><UserCheck size={12} /><span>{ruang.pengawas.map((p) => p.kodeGuru).join(', ') || '-'}</span></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
