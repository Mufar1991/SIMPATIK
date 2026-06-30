import Dexie, { Table } from 'dexie';

export interface MataPelajaran {
  id?: number;
  kode: string;
  nama: string;
}

export interface Siswa {
  id?: number;
  nisn: string;
  nama: string;
  kelas: string;
}

export interface Pengawas {
  id?: number;
  nip: string;
  kodeGuru: string;
  nama: string;
  mapelAsal: string;
  porsiMengawas: number;
  preferensiSesi: number[];
}

export interface JadwalMapel {
  id?: number;
  hari: number;
  sesi: number;
  mapelId: number;
  labelHari: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
}

export interface KonfigurasiUmum {
  id?: number;
  namaEvent: string;
  totalHari: number;
  sesiPerHari: number;
  kapasitasRuang: number;
  pengawasPerRuang: number;
  alokasiRuang: AlokasiRuangKelas[];
}

export interface AlokasiRuangKelas {
  kelas: string;
  ruangMulai: number;
  ruangSelesai: number;
}

export interface HasilJadwal {
  id?: number;
  generatedAt: string;
  data: JadwalHasil[];
}

export interface JadwalHasil {
  hari: number;
  sesi: number;
  labelHari: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  mapelId: number;
  namaMapel: string;
  ruangan: RuanganDetail[];
}

export interface RuanganDetail {
  namaRuang: string;
  kelas: string;
  siswa: { id: number; nisn: string; nama: string; kelas: string }[];
  pengawas: { id: number; kodeGuru: string; nama: string; nip: string }[];
}

export interface PengaturanSekolah {
  id?: number;
  baris1: string;
  baris2: string;
  namaSekolah: string;
  alamat: string;
  logoBase64?: string;
  tahunPelajaran: string;
  judulSingkat: string;
  judulHadirPengawas: string;
  judulJadwalPengawas: string;
  kepalaSekolahNama: string;
  kepalaSekolahNip: string;
  ketuaPanitiaNama: string;
  ketuaPanitiaNip: string;
  sekretarisNama: string;
  sekretarisNip: string;
  tanggalPenandatanganan: string;
  kotaPenandatanganan: string;
}

export interface BackupRecord {
  id?: number;
  namaFile: string;
  tanggal: string;
  ukuran: number;
  dataJson: string;
}

export class SimpatikDB extends Dexie {
  mataPelajaran!: Table<MataPelajaran>;
  siswa!: Table<Siswa>;
  pengawas!: Table<Pengawas>;
  jadwalMapel!: Table<JadwalMapel>;
  konfigurasiUmum!: Table<KonfigurasiUmum>;
  hasilJadwal!: Table<HasilJadwal>;
  pengaturanSekolah!: Table<PengaturanSekolah>;
  backup!: Table<BackupRecord>;

  constructor() {
    super('SimpatikDB');
    this.version(1).stores({
      mataPelajaran: '++id, kode, nama',
      siswa: '++id, nisn, nama, kelas',
      pengawas: '++id, nip, kodeGuru, nama',
      jadwalMapel: '++id, hari, sesi, mapelId',
      konfigurasiUmum: '++id',
      hasilJadwal: '++id',
      pengaturanSekolah: '++id',
      backup: '++id, tanggal',
    });
  }
}

export const db = new SimpatikDB();
