const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const CARD_BG = '#FFFFFF'
const BORDER = 'rgba(13,46,66,0.15)'

const stats = [
  { label: 'Total Projects', value: '—' },
  { label: 'Total Vendors', value: '—' },
  { label: 'Total SPK Aktif', value: '—' },
]

export default function DashboardPage() {
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{
            backgroundColor: CARD_BG,
            border: `1px solid ${BORDER}`,
            borderRadius: '12px',
            padding: '24px 28px',
            boxShadow: '0 1px 3px rgba(13,46,66,0.06)',
          }}>
            <p style={{ fontSize: '12px', color: SECONDARY, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {label}
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: GOLD, margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
