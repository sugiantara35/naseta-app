import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    AKTIF:     { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    BLACKLIST: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
  }
  return (
    <span style={{ ...(styles[status] ?? styles.AKTIF), padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
      {status}
    </span>
  )
}

function SpkStatusBadge({ status }: { status: string }) {
  const map: Record<string, React.CSSProperties> = {
    DRAFT:   { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' },
    AKTIF:   { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    SELESAI: { backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
  }
  return (
    <span style={{ ...(map[status] ?? map.DRAFT), padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
      {status}
    </span>
  )
}

function KategoriBadge({ kategori }: { kategori: string }) {
  const map: Record<string, React.CSSProperties> = {
    PERSIAPAN:  { backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
    STRUKTUR:   { backgroundColor: '#faf5ff', color: '#7c3aed', border: '1px solid #ddd6fe' },
    ARSITEKTUR: { backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
    MEP:        { backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
    MATERIAL:   { backgroundColor: '#fefce8', color: '#854d0e', border: '1px solid #fde68a' },
    SEWA:       { backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' },
    LAINNYA:    { backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' },
  }
  return (
    <span style={{ ...(map[kategori] ?? map.LAINNYA), padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
      {kategori}
    </span>
  )
}

type SpkRow = {
  id: string
  nomor_spk: string
  deskripsi: string
  divisi: string
  deal_spk: number | null
  status: string
  tanggal_spk: string | null
  projects: { id: string; nama: string; status: string } | null
  spk_payments: { jumlah: number }[]
}

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!vendor) notFound()

  const { data: spkList } = await supabase
    .from('spk')
    .select('id, nomor_spk, deskripsi, divisi, deal_spk, status, tanggal_spk, projects(id, nama, status), spk_payments(jumlah)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  const spks = (spkList ?? []) as unknown as SpkRow[]

  const activeProjectIds = new Set(
    spks
      .filter(s => s.projects?.status === 'AKTIF')
      .map(s => s.projects!.id)
  )
  const isOverwork = activeProjectIds.size > 3

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
    color: NAVY, letterSpacing: '1px', textTransform: 'uppercase',
  }
  const tdStyle: React.CSSProperties = { padding: '13px 16px', fontSize: '13px', color: NAVY, verticalAlign: 'middle' }

  return (
    <div>
      {/* Back */}
      <Link href="/dashboard/vendors"
        style={{ display: 'inline-block', color: SECONDARY, fontSize: '12px', textDecoration: 'none', marginBottom: '16px' }}>
        ← Kembali ke Vendors
      </Link>

      {/* Vendor Info Card */}
      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '700', color: NAVY, margin: 0 }}>{vendor.nama}</h1>
              <StatusBadge status={vendor.status} />
              {isOverwork && (
                <span style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                  ⚠ OVERWORK
                </span>
              )}
            </div>
            <code style={{ color: '#7a5c00', fontSize: '13px', fontFamily: 'monospace', fontWeight: '700', backgroundColor: 'rgba(212,175,55,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
              {vendor.kode}
            </code>
            {vendor.kategori && (
              <span style={{ marginLeft: '8px' }}>
                <KategoriBadge kategori={vendor.kategori} />
              </span>
            )}
          </div>
          <Link href={`/dashboard/vendors/${vendor.id}/edit`} style={{
            padding: '9px 20px', backgroundColor: NAVY, color: '#FAF5EB',
            borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', letterSpacing: '0.5px',
          }}>
            Edit Vendor
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Nama KTP', value: vendor.nama_ktp ?? '—' },
            { label: 'Alias', value: vendor.alias ?? '—' },
            { label: 'No. HP', value: vendor.kontak ?? '—' },
            { label: 'Alamat', value: vendor.alamat ?? '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: '10px', color: SECONDARY, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
              <p style={{ fontSize: '13px', color: NAVY, margin: 0, fontWeight: '500' }}>{value}</p>
            </div>
          ))}
        </div>

        {vendor.catatan && (
          <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#F5F0E8', borderRadius: '8px', border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: '10px', color: SECONDARY, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Catatan</p>
            <p style={{ fontSize: '13px', color: NAVY, margin: 0 }}>{vendor.catatan}</p>
          </div>
        )}

        {isOverwork && (
          <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa' }}>
            <p style={{ fontSize: '13px', color: '#c2410c', margin: 0, fontWeight: '500' }}>
              Vendor ini aktif di {activeProjectIds.size} project sekaligus (batas rekomendasi: 3).
            </p>
          </div>
        )}
      </div>

      {/* SPK History */}
      <h2 style={{ fontSize: '16px', fontWeight: '600', color: NAVY, margin: '0 0 14px 0' }}>
        Riwayat SPK ({spks.length})
      </h2>
      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#F5F0E8' }}>
              {['Project', 'Nomor SPK', 'Deskripsi', 'Deal SPK', 'Terbayar', 'Status'].map(col => (
                <th key={col} style={thStyle}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spks.length === 0 ? (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: SECONDARY, padding: '40px' }}>Belum ada SPK untuk vendor ini.</td></tr>
            ) : spks.map((s, i) => {
              const terbayar = s.spk_payments.reduce((sum, p) => sum + (p.jumlah ?? 0), 0)
              return (
                <tr key={s.id} style={{ borderBottom: i < spks.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={{ ...tdStyle, color: SECONDARY, fontSize: '12px' }}>
                    {s.projects ? (
                      <Link href={`/dashboard/projects/${s.projects.id}`} style={{ color: SECONDARY, textDecoration: 'none' }}>
                        {s.projects.nama}
                      </Link>
                    ) : '—'}
                  </td>
                  <td style={tdStyle}>
                    <Link href={`/dashboard/projects/${s.projects?.id}/spk/${s.id}`}
                      style={{ color: '#7a5c00', fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', textDecoration: 'none',
                        backgroundColor: 'rgba(212,175,55,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      {s.nomor_spk}
                    </Link>
                  </td>
                  <td style={{ ...tdStyle, color: SECONDARY }}>{s.deskripsi}</td>
                  <td style={{ ...tdStyle, fontWeight: '600' }}>{s.deal_spk != null ? formatRupiah(s.deal_spk) : '—'}</td>
                  <td style={{ ...tdStyle, color: '#166534', fontWeight: '600' }}>{formatRupiah(terbayar)}</td>
                  <td style={tdStyle}><SpkStatusBadge status={s.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
