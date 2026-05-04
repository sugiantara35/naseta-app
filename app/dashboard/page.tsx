import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const CARD_BG = '#FFFFFF'
const BORDER = 'rgba(13,46,66,0.15)'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PENGAJUAN_BADGE: Record<string, React.CSSProperties> = {
  MENUNGGU_SM:       { backgroundColor: '#fef9c3', color: '#854d0e' },
  DISETUJUI_SM:      { backgroundColor: '#dbeafe', color: '#1e40af' },
  RENUMERASI_SM:     { backgroundColor: '#dbeafe', color: '#1e40af' },
  DITOLAK_SM:        { backgroundColor: '#fee2e2', color: '#991b1b' },
  DITOLAK_FINANCE:   { backgroundColor: '#fee2e2', color: '#991b1b' },
  DITOLAK_DIREKTUR:  { backgroundColor: '#fee2e2', color: '#991b1b' },
  DISETUJUI_FINANCE: { backgroundColor: '#e0e7ff', color: '#3730a3' },
  DISETUJUI_DIREKTUR:{ backgroundColor: '#dcfce7', color: '#166534' },
  SELESAI:           { backgroundColor: '#f0fdf4', color: '#15803d' },
}

const PENGAJUAN_LABEL: Record<string, string> = {
  MENUNGGU_SM: 'Menunggu SM', DISETUJUI_SM: 'Disetujui SM',
  RENUMERASI_SM: 'Renumerasi SM', DITOLAK_SM: 'Ditolak SM',
  DITOLAK_FINANCE: 'Ditolak Finance', DITOLAK_DIREKTUR: 'Ditolak Direktur',
  DISETUJUI_FINANCE: 'Disetujui Finance', DISETUJUI_DIREKTUR: 'Disetujui Direktur',
  SELESAI: 'Selesai',
}

type DraftSpk = {
  id: string; nomor_spk: string; divisi: string; deal_spk: number | null
  projects: { id: string; nama: string } | null
  vendors: { nama: string } | null
}

type PengajuanRow = {
  id: string; status: string; jumlah_diajukan: number; created_at: string
  spk: { nomor_spk: string; projects: { nama: string } | null } | null
}

type OverridePendingRow = {
  id: string; jumlah_over: number; alasan_request: string; created_at: string
  spk: { nomor_spk: string; projects: { id: string; nama: string } | null } | null
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  let userRole = ''
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    userRole = profile?.role ?? ''
  }

  const [
    { count: totalProjects },
    { count: totalVendorAktif },
    { count: totalSpkAktif },
    { count: pengajuanMenunggu },
    { data: activeProjects },
  ] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('status', 'AKTIF'),
    supabase.from('spk').select('id', { count: 'exact', head: true }).eq('status', 'AKTIF'),
    supabase.from('pengajuan_pembayaran').select('id', { count: 'exact', head: true })
      .in('status', ['MENUNGGU_SM', 'DISETUJUI_SM', 'DISETUJUI_FINANCE']),
    supabase.from('projects').select('id, nama, kode').eq('status', 'AKTIF').order('created_at', { ascending: false }),
  ])

  const activeProjectIds = (activeProjects ?? []).map(p => p.id)
  const rapByProject: Record<string, number> = {}
  const realisasiByProject: Record<string, number> = {}

  if (activeProjectIds.length > 0) {
    const [{ data: rapData }, { data: spkData }] = await Promise.all([
      supabase.from('rap_items').select('project_id, total_rap').in('project_id', activeProjectIds),
      supabase.from('spk').select('project_id, deal_spk')
        .in('project_id', activeProjectIds)
        .in('status', ['AKTIF', 'SELESAI']),
    ])
    for (const r of rapData ?? []) {
      rapByProject[r.project_id] = (rapByProject[r.project_id] ?? 0) + (r.total_rap ?? 0)
    }
    for (const s of spkData ?? []) {
      realisasiByProject[s.project_id] = (realisasiByProject[s.project_id] ?? 0) + (s.deal_spk ?? 0)
    }
  }

  const canSeeApproval = ['ADMIN', 'SITE_MANAGER', 'DIREKTUR'].includes(userRole)
  const canSeeOverride = ['ADMIN', 'DIREKTUR'].includes(userRole)

  let draftSpkList: DraftSpk[] = []
  let overridePendingList: OverridePendingRow[] = []

  await Promise.all([
    canSeeApproval
      ? supabase
          .from('spk')
          .select('id, nomor_spk, divisi, deal_spk, projects(id, nama), vendors(nama)')
          .eq('status', 'DRAFT')
          .order('created_at', { ascending: false })
          .limit(5)
          .then(({ data }) => { draftSpkList = (data as unknown as DraftSpk[]) ?? [] })
      : Promise.resolve(),
    canSeeOverride
      ? supabase
          .from('rap_overrides')
          .select('id, jumlah_over, alasan_request, created_at, spk:spk_id(nomor_spk, projects:project_id(id, nama))')
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false })
          .limit(5)
          .then(({ data }) => { overridePendingList = (data as unknown as OverridePendingRow[]) ?? [] })
      : Promise.resolve(),
  ])

  const { data: pengajuanTerbaru } = await supabase
    .from('pengajuan_pembayaran')
    .select('id, status, jumlah_diajukan, created_at, spk:spk_id(nomor_spk, projects(nama))')
    .order('created_at', { ascending: false })
    .limit(5)
  const pengajuanList = (pengajuanTerbaru as unknown as PengajuanRow[]) ?? []

  const kpiCards = [
    { label: 'TOTAL PROJECTS', value: totalProjects ?? 0, icon: '📁' },
    { label: 'TOTAL VENDOR AKTIF', value: totalVendorAktif ?? 0, icon: '🏢' },
    { label: 'TOTAL SPK AKTIF', value: totalSpkAktif ?? 0, icon: '📋' },
    { label: 'PENGAJUAN MENUNGGU', value: pengajuanMenunggu ?? 0, icon: '⏳' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>
          Selamat datang di Naseta
        </h1>
        <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>
          Portal SPK Vendor — PT Upadana Semesta
        </p>
      </div>

      {/* Section 1 — KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {kpiCards.map(({ label, value, icon }) => (
          <div key={label} style={{
            backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px',
            padding: '22px 22px 18px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', color: SECONDARY, margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', lineHeight: '1.4' }}>
                {label}
              </p>
              <span style={{ fontSize: '18px' }}>{icon}</span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: '800', color: NAVY, margin: '0 0 10px 0' }}>
              {value}
            </p>
            <div style={{ height: '3px', backgroundColor: 'rgba(212,175,55,0.2)', borderRadius: '2px' }}>
              <div style={{ height: '3px', width: '40px', backgroundColor: GOLD, borderRadius: '2px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Section 2 — Status Project Aktif */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: NAVY, margin: '0 0 16px 0', letterSpacing: '0.3px' }}>
          Status Project Aktif
        </h2>
        <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
          {(activeProjects ?? []).length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: SECONDARY, fontSize: '13px' }}>
              Belum ada project aktif
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F5F0E8', borderBottom: `1px solid ${BORDER}` }}>
                  {['Project', 'Total RAP', 'Realisasi', 'Progress', 'Status'].map(col => (
                    <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: NAVY, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(activeProjects ?? []).map(project => {
                  const rap = rapByProject[project.id] ?? 0
                  const realisasi = realisasiByProject[project.id] ?? 0
                  const pct = rap > 0 ? Math.min(100, Math.round((realisasi / rap) * 100)) : 0
                  const ratio = rap > 0 ? realisasi / rap : 0
                  const statusLabel = ratio > 1 ? 'OVERBUDGET' : ratio >= 0.8 ? 'WARNING' : 'AMAN'
                  const statusStyle: React.CSSProperties = ratio > 1
                    ? { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }
                    : ratio >= 0.8
                    ? { backgroundColor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }
                    : { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }

                  return (
                    <tr key={project.id} style={{ borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: NAVY, verticalAlign: 'middle' }}>
                        <Link href={`/dashboard/projects/${project.id}`} style={{ textDecoration: 'none', color: NAVY }}>
                          <div style={{ fontWeight: '600' }}>{project.nama}</div>
                          <div style={{ fontSize: '11px', color: SECONDARY, marginTop: '2px', fontFamily: 'monospace' }}>{project.kode}</div>
                        </Link>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: SECONDARY, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {rap > 0 ? formatRupiah(rap) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: realisasi > rap && rap > 0 ? '#dc2626' : SECONDARY, verticalAlign: 'middle', fontWeight: realisasi > 0 ? '600' : '400', whiteSpace: 'nowrap' }}>
                        {realisasi > 0 ? formatRupiah(realisasi) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', minWidth: '140px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                            <div style={{
                              height: '8px', borderRadius: '4px', width: `${pct}%`,
                              backgroundColor: ratio > 1 ? '#dc2626' : ratio >= 0.8 ? '#f59e0b' : GOLD,
                              transition: 'width 0.3s',
                            }} />
                          </div>
                          <span style={{ fontSize: '11px', color: SECONDARY, fontWeight: '600', minWidth: '32px', textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span style={{ ...statusStyle, padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Section 3 — SPK Menunggu Approval (role-gated) */}
      {canSeeApproval && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: NAVY, margin: '0 0 16px 0', letterSpacing: '0.3px' }}>
            SPK Menunggu Persetujuan Anda
          </h2>
          <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
            {draftSpkList.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: SECONDARY, fontSize: '13px' }}>
                Tidak ada SPK menunggu persetujuan
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F5F0E8', borderBottom: `1px solid ${BORDER}` }}>
                    {['No SPK', 'Project', 'Kategori', 'Vendor', 'Deal SPK', ''].map(col => (
                      <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: NAVY, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {draftSpkList.map(spk => (
                    <tr key={spk.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: NAVY, fontWeight: '600', fontFamily: 'monospace' }}>{spk.nomor_spk}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: NAVY }}>{spk.projects?.nama ?? '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: SECONDARY }}>{spk.divisi}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: SECONDARY }}>{spk.vendors?.nama ?? '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: NAVY, fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {spk.deal_spk != null ? formatRupiah(spk.deal_spk) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {spk.projects?.id && (
                          <Link href={`/dashboard/projects/${spk.projects.id}?tab=APPROVAL`} style={{
                            padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                            backgroundColor: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)',
                            color: '#7a5c00', textDecoration: 'none',
                          }}>
                            Lihat
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Section 3b — Override Menunggu Persetujuan (ADMIN/DIREKTUR only) */}
      {canSeeOverride && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: NAVY, margin: 0, letterSpacing: '0.3px' }}>
              Override Menunggu Persetujuan
            </h2>
            <Link href="/dashboard/override" style={{ fontSize: '12px', color: SECONDARY, textDecoration: 'none' }}>
              Lihat semua →
            </Link>
          </div>
          <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
            {overridePendingList.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: SECONDARY, fontSize: '13px' }}>
                Tidak ada request override pending
              </div>
            ) : (
              <div>
                {overridePendingList.map((ov, i) => (
                  <Link
                    key={ov.id}
                    href="/dashboard/override"
                    style={{
                      display: 'block', textDecoration: 'none',
                      padding: '16px 20px',
                      borderBottom: i < overridePendingList.length - 1 ? `1px solid ${BORDER}` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <code style={{
                            backgroundColor: 'rgba(212,175,55,0.15)', color: '#7a5c00',
                            padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                            fontFamily: 'monospace', fontWeight: '600',
                          }}>
                            {ov.spk?.nomor_spk ?? '—'}
                          </code>
                          {ov.spk?.projects?.nama && (
                            <span style={{ fontSize: '13px', color: NAVY, fontWeight: '500' }}>
                              {ov.spk.projects.nama}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '12px', color: SECONDARY, margin: 0 }}>
                          {ov.alasan_request.length > 80
                            ? ov.alasan_request.slice(0, 80) + '...'
                            : ov.alasan_request}
                        </p>
                      </div>
                      <span style={{
                        backgroundColor: 'rgba(245,158,11,0.15)', color: '#B45309',
                        border: '1px solid rgba(245,158,11,0.4)',
                        borderRadius: '8px', padding: '4px 12px',
                        fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap',
                      }}>
                        Over {formatRupiah(ov.jumlah_over)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 4 — Pengajuan Pembayaran Terbaru */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: NAVY, margin: 0, letterSpacing: '0.3px' }}>
            Pengajuan Pembayaran Terbaru
          </h2>
          <Link href="/dashboard/pengajuan" style={{ fontSize: '12px', color: SECONDARY, textDecoration: 'none' }}>
            Lihat semua →
          </Link>
        </div>
        <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
          {pengajuanList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: SECONDARY, fontSize: '13px' }}>
              Belum ada pengajuan
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F5F0E8', borderBottom: `1px solid ${BORDER}` }}>
                  {['SPK', 'Project', 'Jumlah', 'Status', 'Tanggal'].map(col => (
                    <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: NAVY, letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pengajuanList.map(row => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: NAVY, fontFamily: 'monospace', fontWeight: '600' }}>
                      <Link href="/dashboard/pengajuan" style={{ textDecoration: 'none', color: NAVY }}>
                        {row.spk?.nomor_spk ?? '—'}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: SECONDARY }}>
                      {row.spk?.projects?.nama ?? '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: NAVY, fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {formatRupiah(row.jumlah_diajukan)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        ...(PENGAJUAN_BADGE[row.status] ?? { backgroundColor: '#f3f4f6', color: '#374151' }),
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                      }}>
                        {PENGAJUAN_LABEL[row.status] ?? row.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: SECONDARY, whiteSpace: 'nowrap' }}>
                      {formatDate(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
