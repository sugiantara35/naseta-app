import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'
const BASE_PATH = '/dashboard/vendors'

type Vendor = {
  id: string
  nama: string
  kode: string
  kontak: string | null
  kategori: string | null
  sub_kategori: string | null
  status: 'AKTIF' | 'BLACKLIST'
  spk: { projects: { id: string; status: string } | null }[]
}

function StatusBadge({ status }: { status: Vendor['status'] }) {
  const styles: Record<string, React.CSSProperties> = {
    AKTIF:     { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    BLACKLIST: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
  }
  return (
    <span style={{ ...styles[status], padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>
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
    <span style={{ ...(map[kategori] ?? map.LAINNYA), padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
      {kategori}
    </span>
  )
}

const KATEGORI_ORDER = ['PERSIAPAN', 'STRUKTUR', 'ARSITEKTUR', 'MEP', 'SEWA', 'LAINNYA']

const SUB_KATEGORI_MAP: Record<string, string[]> = {
  PERSIAPAN:  ['Sumur Bor', 'Site Clearing', 'Bongkaran', 'Antitermite', 'Setting Out'],
  STRUKTUR:   ['Beton Bertulang', 'Struktur Baja', 'Struktur Kayu', 'Struktur Baja Ringan', 'Waterproofing'],
  ARSITEKTUR: ['Pasangan Dinding', 'Plester Aci', 'Pek Pasang Ceiling', 'Pasang Keramik / Granite Tile / Batu Alam', 'Finishing Cat dan Politur', 'Pek Daun Pintu Jendela', 'Aluminium'],
  MEP:        ['MEP'],
  SEWA:       ['Alat Berat'],
}

const KATEGORI_TABS = [
  { value: null,         label: 'Semua' },
  { value: 'PERSIAPAN',  label: 'Persiapan' },
  { value: 'STRUKTUR',   label: 'Struktur' },
  { value: 'ARSITEKTUR', label: 'Arsitektur' },
  { value: 'MEP',        label: 'MEP' },
  { value: 'SEWA',       label: 'Sewa' },
]

function tabStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 16px', fontSize: '13px', textDecoration: 'none',
    fontWeight: active ? '700' : '400',
    color: NAVY,
    opacity: active ? 1 : 0.4,
    borderBottom: active ? `2px solid ${NAVY}` : '2px solid transparent',
    marginBottom: '-1px', whiteSpace: 'nowrap' as const, transition: 'all 0.15s',
  }
}

function countBadgeStyle(active: boolean): React.CSSProperties {
  return {
    backgroundColor: active ? 'rgba(13,46,66,0.12)' : 'rgba(13,46,66,0.06)',
    color: SECONDARY,
    padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '600',
  }
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; sub_kategori?: string }>
}) {
  const sp = await searchParams
  const activeKategori = sp.kategori ?? null
  const activeSubKategori = sp.sub_kategori ?? null

  const supabase = await createServerSupabaseClient()
  const { data: rawVendors, error } = await supabase
    .from('vendors')
    .select('id, nama, kode, kontak, kategori, sub_kategori, status, spk(projects(id, status))')
    .order('created_at', { ascending: false })

  const allVendors = (rawVendors ?? []) as unknown as Vendor[]

  const byKategori = activeKategori === null
    ? allVendors
    : allVendors.filter(v => v.kategori === activeKategori)

  const vendors = activeSubKategori === null
    ? byKategori
    : byKategori.filter(v => v.sub_kategori === activeSubKategori)

  const subKategoriTabs = activeKategori ? (SUB_KATEGORI_MAP[activeKategori] ?? []) : []

  const kategoriHref = (val: string | null) =>
    val === null ? BASE_PATH : `${BASE_PATH}?kategori=${val}`

  const subKategoriHref = (val: string | null) =>
    val === null
      ? `${BASE_PATH}?kategori=${activeKategori}`
      : `${BASE_PATH}?kategori=${activeKategori}&sub_kategori=${encodeURIComponent(val)}`

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Vendors</h1>
          <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>
            {vendors.length} vendor{activeKategori ? ` · ${activeKategori}${activeSubKategori ? ` · ${activeSubKategori}` : ''}` : ' terdaftar'}
          </p>
        </div>
        <Link href="/dashboard/vendors/tambah" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', backgroundColor: NAVY, color: '#FAF5EB',
          borderRadius: '8px', fontSize: '13px', fontWeight: '700',
          textDecoration: 'none', letterSpacing: '0.5px',
        }}>
          + Tambah Vendor
        </Link>
      </div>

      {/* Kategori tabs — row 1 */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], borderBottom: `1px solid ${BORDER}`, marginBottom: activeKategori ? '0' : '20px' }}>
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          {KATEGORI_TABS.map(tab => {
            const active = activeKategori === tab.value
            const count = tab.value === null ? allVendors.length : allVendors.filter(v => v.kategori === tab.value).length
            return (
              <Link key={tab.label} href={kategoriHref(tab.value)} style={tabStyle(active)}>
                {tab.label}
                <span style={countBadgeStyle(active)}>{count}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Sub kategori tabs — row 2 */}
      {activeKategori && subKategoriTabs.length > 0 && (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], borderBottom: `1px solid ${BORDER}`, marginBottom: '20px', backgroundColor: 'rgba(13,46,66,0.02)' }}>
          <div style={{ display: 'flex', minWidth: 'max-content' }}>
            <Link href={subKategoriHref(null)} style={{ ...tabStyle(activeSubKategori === null), fontSize: '12px', padding: '8px 14px' }}>
              Semua
              <span style={countBadgeStyle(activeSubKategori === null)}>{byKategori.length}</span>
            </Link>
            {subKategoriTabs.map(sub => {
              const active = activeSubKategori === sub
              const count = byKategori.filter(v => v.sub_kategori === sub).length
              return (
                <Link key={sub} href={subKategoriHref(sub)} style={{ ...tabStyle(active), fontSize: '12px', padding: '8px 14px' }}>
                  {sub}
                  <span style={countBadgeStyle(active)}>{count}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
      {activeKategori && subKategoriTabs.length === 0 && <div style={{ marginBottom: '20px' }} />}

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '20px', fontSize: '13px' }}>
          Gagal memuat data: {error.message}
        </div>
      )}

      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#F5F0E8' }}>
              {['Nama', 'Kode', 'Kontak', 'Kategori', 'Sub Kategori', 'Status', 'Aksi'].map(col => (
                <th key={col} style={{
                  padding: '14px 20px', textAlign: 'left', fontSize: '11px',
                  fontWeight: '700', color: NAVY, letterSpacing: '1px', textTransform: 'uppercase',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: SECONDARY, fontSize: '14px' }}>
                  Belum ada vendor. Klik &quot;Tambah Vendor&quot; untuk mulai.
                </td>
              </tr>
            ) : (
              vendors.map((v: Vendor, i: number) => {
                const activeProjectIds = new Set(
                  v.spk.flatMap(s =>
                    s.projects && s.projects.status === 'AKTIF' ? [s.projects.id] : []
                  )
                )
                const isOverwork = activeProjectIds.size > 3

                return (
                  <tr key={v.id} style={{ borderBottom: i < vendors.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <td style={{ padding: '16px 20px', color: NAVY, fontSize: '14px', fontWeight: '500' }}>
                      <Link href={`/dashboard/vendors/${v.id}`} style={{ color: NAVY, textDecoration: 'none', fontWeight: '600' }}>
                        {v.nama}
                      </Link>
                      {isOverwork && (
                        <span style={{ marginLeft: '8px', backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa',
                          padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>
                          ⚠ OVERWORK
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <code style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#7a5c00', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', fontWeight: '600' }}>
                        {v.kode}
                      </code>
                    </td>
                    <td style={{ padding: '16px 20px', color: SECONDARY, fontSize: '13px' }}>{v.kontak ?? '—'}</td>
                    <td style={{ padding: '16px 20px' }}>
                      {v.kategori ? <KategoriBadge kategori={v.kategori} /> : <span style={{ color: SECONDARY, fontSize: '13px' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px 20px', color: SECONDARY, fontSize: '12px' }}>{v.sub_kategori ?? '—'}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <StatusBadge status={v.status} />
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <Link href={`/dashboard/vendors/${v.id}/edit`} style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                        textDecoration: 'none', border: `1px solid ${BORDER}`, color: NAVY, backgroundColor: '#FFFFFF',
                      }}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
