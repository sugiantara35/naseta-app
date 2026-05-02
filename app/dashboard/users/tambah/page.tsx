'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserAction } from './actions'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'

const ROLES = [
  { value: 'QS',           label: 'QS (Quantity Surveyor)' },
  { value: 'SITE_MANAGER', label: 'Site Manager' },
  { value: 'ESTIMATOR',    label: 'Estimator' },
  { value: 'DIREKTUR',     label: 'Direktur' },
  { value: 'ADMIN',        label: 'Admin' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', backgroundColor: '#FFFFFF',
  border: `1px solid rgba(13,46,66,0.2)`, borderRadius: '8px', color: NAVY,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', color: SECONDARY,
  marginBottom: '8px', letterSpacing: '1px',
  textTransform: 'uppercase', fontWeight: '600',
}

export default function TambahUserPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createUserAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success, server action redirects — no need to handle here
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <button onClick={() => router.push('/dashboard/users')}
        style={{ background: 'none', border: 'none', color: SECONDARY, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
        ← Kembali ke User Management
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Tambah User</h1>
        <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>Buat akun baru dan tetapkan role</p>
      </div>

      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Nama Lengkap *</label>
              <input name="nama" type="text" placeholder="Budi Santoso" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role *</label>
              <select name="role" required style={{ ...inputStyle, backgroundColor: '#F5F0E8' }}>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Email *</label>
            <input name="email" type="email" placeholder="budi@example.com" required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Password *</label>
            <input name="password" type="password" placeholder="Min. 8 karakter" required minLength={8} style={inputStyle} />
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading} style={{
              padding: '11px 28px', backgroundColor: loading ? 'rgba(13,46,66,0.4)' : NAVY,
              color: '#FAF5EB', border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
            }}>
              {loading ? 'Membuat akun...' : 'Buat User'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard/users')} style={{
              padding: '11px 20px', backgroundColor: 'transparent', color: SECONDARY,
              border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
            }}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
