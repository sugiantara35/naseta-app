-- Sprint 4: Tabel pengajuan_pembayaran pembayaran
-- Jalankan di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pengajuan_pembayaran (
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

CREATE INDEX IF NOT EXISTS pengajuan_pembayaran_spk_id_idx ON pengajuan_pembayaran(spk_id);
CREATE INDEX IF NOT EXISTS pengajuan_pembayaran_status_idx ON pengajuan_pembayaran(status);
