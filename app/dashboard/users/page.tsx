import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { updateRoleAction } from './tambah/actions'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'
const GOLD = '#D4AF37'

const ROLES = ['ADMIN', 'ESTIMATOR', 'DIREKTUR', 'QS', 'SITE_MANAGER'] as const

const ROLE_BADGE: Record<string, React.CSSProperties> = {
  ADMIN:        { backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
  DIREKTUR:     { backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' },
  SITE_MANAGER: { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' },
  QS:           { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  ESTIMATOR:    { backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin', DIREKTUR: 'Direktur', SITE_MANAGER: 'Site Manager',
  QS: 'QS', ESTIMATOR: 'Estimator',
}

type ProfileRow = {
  id: string
  nama: string
  email: string | null
  role: string
  created_at: string
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
  color: NAVY, letterSpacing: '1px', textTransform: 'uppercase',
}
const tdStyle: React.CSSProperties = { padding: '14px 16px', fontSize: '13px', color: NAVY, verticalAlign: 'middle' }

export default async function UsersPage() {
  await requireRole(['ADMIN'])

  const supabase = await createServerSupabaseClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  const rows = (profiles as ProfileRow[]) ?? []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>User Management</h1>
          <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>{rows.length} user terdaftar</p>
        </div>
        <Link href="/dashboard/users/tambah" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '9px 18px', backgroundColor: NAVY, color: '#FAF5EB',
          borderRadius: '8px', fontSize: '13px', fontWeight: '700',
          textDecoration: 'none', letterSpacing: '0.3px',
        }}>
          + Tambah User
        </Link>
      </div>

      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        {rows.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: SECONDARY, fontSize: '14px' }}>
            Belum ada user. Klik &quot;Tambah User&quot; untuk mulai.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#F5F0E8' }}>
                {['Nama', 'Email', 'Role', 'Dibuat', 'Aksi'].map(col => (
                  <th key={col} style={thStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={{ ...tdStyle, fontWeight: '600' }}>{p.nama}</td>
                  <td style={{ ...tdStyle, color: SECONDARY }}>{p.email ?? '—'}</td>
                  <td style={tdStyle}>
                    <span style={{ ...(ROLE_BADGE[p.role] ?? {}), padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                      {ROLE_LABEL[p.role] ?? p.role}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: SECONDARY, whiteSpace: 'nowrap' }}>
                    {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={tdStyle}>
                    <form action={updateRoleAction} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="hidden" name="id" value={p.id} />
                      <select name="role" defaultValue={p.role} style={{
                        padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: '6px',
                        fontSize: '12px', color: NAVY, backgroundColor: '#F5F0E8', outline: 'none',
                      }}>
                        {ROLES.map(r => (
                          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                      </select>
                      <button type="submit" style={{
                        padding: '6px 12px', backgroundColor: NAVY, color: '#FAF5EB',
                        border: 'none', borderRadius: '6px', fontSize: '12px',
                        fontWeight: '600', cursor: 'pointer',
                      }}>
                        Simpan
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
