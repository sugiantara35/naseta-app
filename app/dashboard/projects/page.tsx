import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'

type Project = {
  id: string
  nama: string
  kode: string
  lokasi: string | null
  durasi_mulai: string | null
  durasi_selesai: string | null
  status: 'AKTIF' | 'SELESAI' | 'DITUNDA'
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const styles: Record<string, React.CSSProperties> = {
    AKTIF:   { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    SELESAI: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' },
    DITUNDA: { backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
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

export default async function ProjectsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, nama, kode, lokasi, durasi_mulai, durasi_selesai, status')
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Projects</h1>
          <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>
            {projects?.length ?? 0} project terdaftar
          </p>
        </div>
        <Link href="/dashboard/projects/tambah" style={{
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
          + Tambah Project
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
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#F5F0E8' }}>
              {['Nama', 'Kode', 'Lokasi', 'Durasi', 'Status', 'Aksi'].map(col => (
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
            {!projects || projects.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: SECONDARY, fontSize: '14px' }}>
                  Belum ada project. Klik &quot;Tambah Project&quot; untuk mulai.
                </td>
              </tr>
            ) : (
              projects.map((p: Project, i: number) => (
                <tr key={p.id} style={{ borderBottom: i < projects.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={{ padding: '16px 20px', color: NAVY, fontSize: '14px', fontWeight: '500' }}>{p.nama}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <code style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: '#7a5c00', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', fontWeight: '600' }}>
                      {p.kode}
                    </code>
                  </td>
                  <td style={{ padding: '16px 20px', color: SECONDARY, fontSize: '13px' }}>{p.lokasi ?? '—'}</td>
                  <td style={{ padding: '16px 20px', color: SECONDARY, fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {p.durasi_mulai && p.durasi_selesai
                      ? `${p.durasi_mulai} – ${p.durasi_selesai}`
                      : p.durasi_mulai ?? '—'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link href={`/dashboard/projects/${p.id}/edit`} style={{
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
                      <Link href={`/dashboard/projects/${p.id}`} style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        backgroundColor: 'rgba(212,175,55,0.15)',
                        border: '1px solid rgba(212,175,55,0.4)',
                        color: '#7a5c00',
                      }}>
                        Detail
                      </Link>
                    </div>
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
