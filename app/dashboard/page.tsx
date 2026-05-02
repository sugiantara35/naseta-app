import { createServerSupabaseClient } from '@/lib/supabase-server'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const CARD_BG = '#FFFFFF'
const BORDER = 'rgba(13,46,66,0.15)'

async function getPengajuanCounts() {
  try {
    const supabase = await createServerSupabaseClient()
    const [sm, finance, direktur] = await Promise.all([
      supabase.from('pengajuan_pembayaran').select('id', { count: 'exact', head: true }).eq('status', 'MENUNGGU_SM'),
      supabase.from('pengajuan_pembayaran').select('id', { count: 'exact', head: true }).in('status', ['DISETUJUI_SM', 'RENUMERASI_SM']),
      supabase.from('pengajuan_pembayaran').select('id', { count: 'exact', head: true }).eq('status', 'DISETUJUI_FINANCE'),
    ])
    return {
      menungguSM: sm.count ?? 0,
      menungguFinance: finance.count ?? 0,
      menungguDirektur: direktur.count ?? 0,
    }
  } catch {
    return { menungguSM: 0, menungguFinance: 0, menungguDirektur: 0 }
  }
}

export default async function DashboardPage() {
  const counts = await getPengajuanCounts()

  const topStats = [
    { label: 'Total Projects', value: '—' },
    { label: 'Total Vendors', value: '—' },
    { label: 'Total SPK Aktif', value: '—' },
  ]

  const pengajuanStats = [
    { label: 'Pengajuan Menunggu', value: String(counts.menungguSM), accent: '#854d0e', bg: '#fef9c3', borderColor: '#fde68a' },
    { label: 'Menunggu Finance', value: String(counts.menungguFinance), accent: '#1e40af', bg: '#dbeafe', borderColor: '#bfdbfe' },
    { label: 'Menunggu Direktur', value: String(counts.menungguDirektur), accent: '#3730a3', bg: '#e0e7ff', borderColor: '#c7d2fe' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>
          Selamat datang di Naseta
        </h1>
        <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>
          Portal SPK Vendor — PT Upadana Semesta
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {topStats.map(({ label, value }) => (
          <div key={label} style={{
            backgroundColor: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: '12px',
            padding: '20px 20px',
            boxShadow: '0 1px 3px rgba(13,46,66,0.06)',
            minWidth: 0,
          }}>
            <p style={{ fontSize: '11px', color: SECONDARY, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: '1.4', wordBreak: 'break-word' }}>
              {label}
            </p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: GOLD, margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        {pengajuanStats.map(({ label, value, accent, bg, borderColor }) => (
          <div key={label} style={{
            backgroundColor: bg,
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            padding: '20px 20px',
            boxShadow: '0 1px 3px rgba(13,46,66,0.06)',
            minWidth: 0,
          }}>
            <p style={{ fontSize: '11px', color: accent, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', lineHeight: '1.4', wordBreak: 'break-word' }}>
              {label}
            </p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: accent, margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
