import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

const GOLD = '#D4AF37'
const CREAM = '#FAF5EB'
const BORDER = 'rgba(212,175,55,0.2)'
const CARD_BG = 'rgba(13,46,66,0.6)'

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
    AKTIF:   { backgroundColor: 'rgba(34,197,94,0.15)',  color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' },
    SELESAI: { backgroundColor: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)' },
    DITUNDA: { backgroundColor: 'rgba(234,179,8,0.15)',  color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' },
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
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: CREAM, margin: '0 0 6px 0' }}>Projects</h1>
          <p style={{ fontSize: '13px', color: CREAM, opacity: 0.5, margin: 0 }}>
            {projects?.length ?? 0} project terdaftar
          </p>
        </div>
        <Link href="/dashboard/projects/tambah" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: GOLD,
          color: '#0D2E42',
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
        <div style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', marginBottom: '20px', fontSize: '13px' }}>
          Gagal memuat data: {error.message}
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['Nama', 'Kode', 'Lokasi', 'Durasi', 'Status', 'Aksi'].map(col => (
                <th key={col} style={{
                  padding: '14px 20px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: GOLD,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  opacity: 0.85,
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!projects || projects.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: CREAM, opacity: 0.4, fontSize: '14px' }}>
                  Belum ada project. Klik &quot;Tambah Project&quot; untuk mulai.
                </td>
              </tr>
            ) : (
              projects.map((p: Project, i: number) => (
                <tr key={p.id} style={{ borderBottom: i < projects.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={{ padding: '16px 20px', color: CREAM, fontSize: '14px', fontWeight: '500' }}>{p.nama}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <code style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: GOLD, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                      {p.kode}
                    </code>
                  </td>
                  <td style={{ padding: '16px 20px', color: CREAM, opacity: 0.7, fontSize: '13px' }}>{p.lokasi ?? '—'}</td>
                  <td style={{ padding: '16px 20px', color: CREAM, opacity: 0.7, fontSize: '13px', whiteSpace: 'nowrap' }}>
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
                        color: CREAM,
                        opacity: 0.8,
                      }}>
                        Edit
                      </Link>
                      <Link href={`/dashboard/projects/${p.id}`} style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        backgroundColor: 'rgba(212,175,55,0.1)',
                        border: `1px solid ${BORDER}`,
                        color: GOLD,
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
