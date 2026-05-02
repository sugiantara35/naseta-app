import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'

type Vendor = {
  id: string
  nama: string
  kode: string
  kontak: string | null
  kategori: string | null
  status: 'AKTIF' | 'BLACKLIST'
}

function StatusBadge({ status }: { status: Vendor['status'] }) {
  const styles: Record<string, React.CSSProperties> = {
    AKTIF:     { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    BLACKLIST: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
  }
  return (
    <span style={{
      ...styles[status],
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.5px',
    }}>
      {status}
    </span>
  )
}

export default async function VendorsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, nama, kode, kontak, kategori, status')
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Vendors</h1>
          <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>
            {vendors?.length ?? 0} vendor terdaftar
          </p>
        </div>
        <Link href="/dashboard/vendors/tambah" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: NAVY,
          color: '#FAF5EB',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '700',
          textDecoration: 'none',
          letterSpacing: '0.5px',
        }}>
          + Tambah Vendor
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '20px', fontSize: '13px' }}>
          Gagal memuat data: {error.message}
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#F5F0E8' }}>
              {['Nama', 'Kode', 'Kontak', 'Kategori', 'Status', 'Aksi'].map(col => (
                <th key={col} style={{
                  padding: '14px 20px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: NAVY,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!vendors || vendors.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: SECONDARY, fontSize: '14px' }}>
                  Belum ada vendor. Klik &quot;Tambah Vendor&quot; untuk mulai.
                </td>
              </tr>
            ) : (
              vendors.map((v: Vendor, i: number) => (
                <tr key={v.id} style={{ borderBottom: i < vendors.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={{ padding: '16px 20px', color: NAVY, fontSize: '14px', fontWeight: '500' }}>{v.nama}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <code style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#7a5c00', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', fontWeight: '600' }}>
                      {v.kode}
                    </code>
                  </td>
                  <td style={{ padding: '16px 20px', color: SECONDARY, fontSize: '13px' }}>{v.kontak ?? '—'}</td>
                  <td style={{ padding: '16px 20px', color: SECONDARY, fontSize: '13px' }}>{v.kategori ?? '—'}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <StatusBadge status={v.status} />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <Link href={`/dashboard/vendors/${v.id}/edit`} style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      border: `1px solid ${BORDER}`,
                      color: NAVY,
                      backgroundColor: '#FFFFFF',
                    }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
