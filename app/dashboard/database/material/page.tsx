import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'
const BASE_PATH = '/dashboard/database/material'

const KATEGORI_LABEL: Record<string, string> = {
  GALIAN_C:          'Galian C',
  BESI:              'Besi',
  KAYU:              'Kayu',
  MATERIAL_UMUM:     'Material Umum',
  KERAMIK_BATU_ALAM: 'Keramik & Batu Alam',
  MATERIAL_PEMIPAAN: 'Material Pemipaan',
  MATERIAL_LISTRIK:  'Material Listrik',
  MEP:               'MEP',
  LAINNYA:           'Lainnya',
}

const KATEGORI_STYLE: Record<string, React.CSSProperties> = {
  GALIAN_C:          { backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
  BESI:              { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' },
  KAYU:              { backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
  MATERIAL_UMUM:     { backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' },
  KERAMIK_BATU_ALAM: { backgroundColor: '#fdf4ff', color: '#7e22ce', border: '1px solid #e9d5ff' },
  MATERIAL_PEMIPAAN: { backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  MATERIAL_LISTRIK:  { backgroundColor: '#fefce8', color: '#a16207', border: '1px solid #fef08a' },
  MEP:               { backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
  LAINNYA:           { backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' },
}

function KategoriBadge({ kategori }: { kategori: string }) {
  const style = KATEGORI_STYLE[kategori] ?? KATEGORI_STYLE.LAINNYA
  const label = KATEGORI_LABEL[kategori] ?? kategori
  return (
    <span style={{ ...style, padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
      {label}
    </span>
  )
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

async function deleteItem(id: string) {
  'use server'
  const supabase = await createServerSupabaseClient()
  await supabase.from('harga_material').delete().eq('id', id)
  revalidatePath('/dashboard/database/material')
}

type HargaMaterial = {
  id: string
  nama_material: string
  kategori: string | null
  sub_kategori: string | null
  satuan: string | null
  harga: number | null
  berlaku_mulai: string | null
  catatan: string | null
}

const thStyle = {
  padding: '14px 20px', textAlign: 'left' as const, fontSize: '11px',
  fontWeight: '700', color: NAVY, letterSpacing: '1px', textTransform: 'uppercase' as const,
}
const tdStyle = { padding: '14px 20px', fontSize: '13px', color: NAVY, verticalAlign: 'middle' as const }

const KATEGORI_ORDER = ['GALIAN_C', 'BESI', 'KAYU', 'MATERIAL_UMUM', 'KERAMIK_BATU_ALAM', 'MATERIAL_PEMIPAAN', 'MATERIAL_LISTRIK', 'MEP', 'LAINNYA']

const SUB_KATEGORI_MAP: Record<string, string[]> = {
  GALIAN_C:          ['Pasir', 'Batu', 'Koral'],
  BESI:              ['Besi Ulir TS 420', 'Besi Ulir TS 280', 'Besi Polos TP 280'],
  KAYU:              ['Kayu Lepasan'],
  MATERIAL_UMUM:     ['Semen', 'Bata Ringan'],
  KERAMIK_BATU_ALAM: ['Batu Alam', 'Batu Andesit', 'Koral Hias'],
  MATERIAL_PEMIPAAN: ['Pipa AW', 'Pipa D', 'Aksesori Pipa'],
  MATERIAL_LISTRIK:  ['Kabel'],
}

const KATEGORI_TABS = [
  { value: null,               label: 'Semua' },
  { value: 'GALIAN_C',         label: 'Galian C' },
  { value: 'BESI',             label: 'Besi' },
  { value: 'KAYU',             label: 'Kayu' },
  { value: 'MATERIAL_UMUM',    label: 'Material Umum' },
  { value: 'KERAMIK_BATU_ALAM', label: 'Keramik & Batu Alam' },
  { value: 'MATERIAL_PEMIPAAN', label: 'Material Pemipaan' },
  { value: 'MATERIAL_LISTRIK', label: 'Material Listrik' },
  { value: 'MEP',              label: 'MEP' },
  { value: 'LAINNYA',          label: 'Lainnya' },
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

export default async function HargaMaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; sub_kategori?: string }>
}) {
  const sp = await searchParams
  const activeKategori = sp.kategori ?? null
  const activeSubKategori = sp.sub_kategori ?? null

  const supabase = await createServerSupabaseClient()
  const { data: rawItems, error } = await supabase
    .from('harga_material')
    .select('id, nama_material, kategori, sub_kategori, satuan, harga, berlaku_mulai, catatan')

  const allItems = (rawItems ?? []).slice().sort((a, b) => {
    const ai = KATEGORI_ORDER.indexOf(a.kategori ?? '')
    const bi = KATEGORI_ORDER.indexOf(b.kategori ?? '')
    const ka = ai === -1 ? KATEGORI_ORDER.length : ai
    const kb = bi === -1 ? KATEGORI_ORDER.length : bi
    if (ka !== kb) return ka - kb
    if ((a.sub_kategori ?? '') !== (b.sub_kategori ?? ''))
      return (a.sub_kategori ?? '').localeCompare(b.sub_kategori ?? '', 'id')
    return (a.nama_material ?? '').localeCompare(b.nama_material ?? '', 'id')
  })

  const byKategori = activeKategori === null
    ? allItems
    : allItems.filter(i => i.kategori === activeKategori)

  const items = activeSubKategori === null
    ? byKategori
    : byKategori.filter(i => i.sub_kategori === activeSubKategori)

  const subKategoriTabs = activeKategori ? (SUB_KATEGORI_MAP[activeKategori] ?? []) : []

  const kategoriHref = (val: string | null) =>
    val === null ? BASE_PATH : `${BASE_PATH}?kategori=${val}`

  const subKategoriHref = (val: string | null) =>
    val === null
      ? `${BASE_PATH}?kategori=${activeKategori}`
      : `${BASE_PATH}?kategori=${activeKategori}&sub_kategori=${encodeURIComponent(val)}`

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Harga Material</h1>
          <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>
            {items.length} item{activeKategori ? ` · ${KATEGORI_LABEL[activeKategori] ?? activeKategori}${activeSubKategori ? ` · ${activeSubKategori}` : ''}` : ' terdaftar'}
          </p>
        </div>
        <Link href={`${BASE_PATH}/tambah`} style={{
          display: 'inline-flex', alignItems: 'center', padding: '10px 20px',
          backgroundColor: NAVY, color: '#FAF5EB', borderRadius: '8px',
          fontSize: '13px', fontWeight: '700', textDecoration: 'none', letterSpacing: '0.5px',
        }}>
          + Tambah
        </Link>
      </div>

      {/* Kategori tabs — row 1 */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], borderBottom: `1px solid ${BORDER}`, marginBottom: activeKategori ? '0' : '20px' }}>
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          {KATEGORI_TABS.map(tab => {
            const active = activeKategori === tab.value
            const count = tab.value === null ? allItems.length : allItems.filter(i => i.kategori === tab.value).length
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
              const count = byKategori.filter(i => i.sub_kategori === sub).length
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
          {error.message}
        </div>
      )}

      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#F5F0E8' }}>
              {['No', 'Nama Material', 'Kategori', 'Sub Kategori', 'Satuan', 'Harga', 'Berlaku Mulai', 'Aksi'].map(col => (
                <th key={col} style={thStyle}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!items || items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: SECONDARY, fontSize: '14px' }}>
                  Belum ada data. Klik &quot;+ Tambah&quot; untuk mulai.
                </td>
              </tr>
            ) : items.map((item: HargaMaterial, i: number) => (
              <tr key={item.id} style={{ borderBottom: i < items.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <td style={{ ...tdStyle, color: SECONDARY, width: '48px' }}>{i + 1}</td>
                <td style={{ ...tdStyle, fontWeight: '500' }}>{item.nama_material}</td>
                <td style={tdStyle}>
                  {item.kategori ? <KategoriBadge kategori={item.kategori} /> : <span style={{ color: SECONDARY }}>—</span>}
                </td>
                <td style={{ ...tdStyle, color: SECONDARY, fontSize: '12px' }}>{item.sub_kategori ?? '—'}</td>
                <td style={{ ...tdStyle, color: SECONDARY }}>{item.satuan ?? '—'}</td>
                <td style={{ ...tdStyle, color: '#166534', fontWeight: '600' }}>
                  {item.harga != null ? formatRupiah(item.harga) : '—'}
                </td>
                <td style={{ ...tdStyle, color: SECONDARY }}>{item.berlaku_mulai ?? '—'}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href={`/dashboard/database/material/${item.id}/edit`} style={{
                      padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                      textDecoration: 'none', border: `1px solid ${BORDER}`, color: NAVY, backgroundColor: '#FFFFFF',
                    }}>
                      Edit
                    </Link>
                    <form action={deleteItem.bind(null, item.id)} style={{ display: 'inline' }}>
                      <button type="submit" style={{
                        padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                        border: '1px solid #fecaca', color: '#991b1b', backgroundColor: '#FFFFFF', cursor: 'pointer',
                      }}>
                        Hapus
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
