import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'

const KATEGORI_LABEL: Record<string, string> = {
  GALIAN_C:      'Galian C',
  BESI:          'Besi',
  KAYU:          'Kayu',
  MATERIAL_UMUM: 'Material Umum',
  MEP:           'MEP',
  LAINNYA:       'Lainnya',
}

const KATEGORI_STYLE: Record<string, React.CSSProperties> = {
  GALIAN_C:      { backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
  BESI:          { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' },
  KAYU:          { backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
  MATERIAL_UMUM: { backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' },
  MEP:           { backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
  LAINNYA:       { backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' },
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

export default async function HargaMaterialPage() {
  const supabase = await createServerSupabaseClient()
  const { data: items, error } = await supabase
    .from('harga_material')
    .select('id, nama_material, kategori, satuan, harga, berlaku_mulai, catatan')
    .order('nama_material', { ascending: true })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Harga Material</h1>
          <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>{items?.length ?? 0} item terdaftar</p>
        </div>
        <Link href="/dashboard/database/material/tambah" style={{
          display: 'inline-flex', alignItems: 'center', padding: '10px 20px',
          backgroundColor: NAVY, color: '#FAF5EB', borderRadius: '8px',
          fontSize: '13px', fontWeight: '700', textDecoration: 'none', letterSpacing: '0.5px',
        }}>
          + Tambah
        </Link>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', marginBottom: '20px', fontSize: '13px' }}>
          {error.message}
        </div>
      )}

      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#F5F0E8' }}>
              {['No', 'Nama Material', 'Kategori', 'Satuan', 'Harga', 'Berlaku Mulai', 'Aksi'].map(col => (
                <th key={col} style={thStyle}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!items || items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: SECONDARY, fontSize: '14px' }}>
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
