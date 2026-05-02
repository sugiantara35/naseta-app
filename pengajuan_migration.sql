-- Sprint 4: Tabel pengajuan pembayaran
-- Jalankan di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pengajuan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spk_id UUID REFERENCES spk(id) ON DELETE CASCADE NOT NULL,
  jumlah_diajukan NUMERIC NOT NULL,
  jumlah_disetujui NUMERIC,
  status TEXT NOT NULL DEFAULT 'MENUNGGU_SM',
  catatan_pengaju TEXT,
  catatan_sm TEXT,
  catatan_finance TEXT,
  catatan_direktur TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pengajuan_spk_id_idx ON pengajuan(spk_id);
CREATE INDEX IF NOT EXISTS pengajuan_status_idx ON pengajuan(status);
