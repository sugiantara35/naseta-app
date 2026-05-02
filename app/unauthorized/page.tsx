import Link from 'next/link'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'

export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F0E8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${BORDER}`,
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(13,46,66,0.08)',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: '700', color: NAVY, margin: '0 0 10px 0' }}>
          Akses Ditolak
        </h1>
        <p style={{ fontSize: '14px', color: SECONDARY, margin: '0 0 28px 0', lineHeight: '1.6' }}>
          Anda tidak memiliki izin untuk mengakses halaman ini.
          Silakan hubungi administrator jika menurut Anda ini adalah kesalahan.
        </p>

        <Link href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '10px 24px', backgroundColor: NAVY, color: '#FAF5EB',
          borderRadius: '8px', fontSize: '13px', fontWeight: '700',
          textDecoration: 'none', letterSpacing: '0.3px',
        }}>
          ← Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
