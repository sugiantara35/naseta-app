const GOLD = '#D4AF37'
const CREAM = '#FAF5EB'
const CARD_BG = 'rgba(13,46,66,0.6)'
const BORDER = 'rgba(212,175,55,0.2)'

const stats = [
  { label: 'Total Projects', value: '—' },
  { label: 'Total Vendors', value: '—' },
  { label: 'Total SPK Aktif', value: '—' },
]

export default function DashboardPage() {
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: CREAM, margin: '0 0 6px 0' }}>
          Selamat datang di Naseta
        </h1>
        <p style={{ fontSize: '13px', color: CREAM, opacity: 0.5, margin: 0 }}>
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
          }}>
            <p style={{ fontSize: '12px', color: CREAM, opacity: 0.55, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
