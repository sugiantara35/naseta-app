import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OverrideActionButtons } from './OverrideActionButtons'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  PENDING:  { backgroundColor: 'rgba(245,158,11,0.15)', color: '#B45309', border: '1px solid rgba(245,158,11,0.4)' },
  APPROVED: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  REJECTED: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Menunggu', APPROVED: 'Disetujui', REJECTED: 'Ditolak',
}

type SpkItemRow = {
  id: string
  rap_item_id: string | null
  deskripsi: string
  satuan: string | null
  volume: number | null
  harga_satuan: number | null
  total_item: number | null
}

type OverrideRow = {
  id: string
  jumlah_over: number
  alasan_request: string
  alasan_keputusan: string | null
  status: string
  created_at: string
  decided_at: string | null
  requested_by: string
  approved_by: string | null
  spk: {
    id: string
    nomor_spk: string
    deskripsi: string
    divisi: string
    projects: { id: string; nama: string } | null
    vendors: { nama: string } | null
    spk_items: SpkItemRow[]
  } | null
}

export default async function OverridePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const sp = await searchParams
  const tab = ['PENDING', 'APPROVED', 'REJECTED'].includes(sp.tab ?? '')
    ? (sp.tab as string)
    : 'PENDING'

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!['ADMIN', 'DIREKTUR'].includes(profileData?.role ?? '')) redirect('/dashboard')

  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
    { data: rawOverrides },
  ] = await Promise.all([
    supabase.from('rap_overrides').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('rap_overrides').select('id', { count: 'exact', head: true }).eq('status', 'APPROVED'),
    supabase.from('rap_overrides').select('id', { count: 'exact', head: true }).eq('status', 'REJECTED'),
    supabase
      .from('rap_overrides')
      .select(`
        id, jumlah_over, alasan_request, alasan_keputusan, status, created_at, decided_at, requested_by, approved_by,
        spk:spk_id (
          id, nomor_spk, deskripsi, divisi,
          projects:project_id ( id, nama ),
          vendors:vendor_id ( nama ),
          spk_items ( id, rap_item_id, deskripsi, satuan, volume, harga_satuan, total_item )
        )
      `)
      .eq('status', tab)
      .order('created_at', { ascending: false }),
  ])

  const overrideList = (rawOverrides as unknown as OverrideRow[]) ?? []

  const userIds = [
    ...new Set([
      ...overrideList.map(d => d.requested_by).filter(Boolean),
      ...overrideList.map(d => d.approved_by).filter(Boolean) as string[],
    ]),
  ]
  let profileMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles').select('id, nama').in('id', userIds)
    profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id as string, p.nama as string]))
  }

  const tabs = [
    { key: 'PENDING', label: 'Menunggu', count: pendingCount ?? 0 },
    { key: 'APPROVED', label: 'Disetujui', count: approvedCount ?? 0 },
    { key: 'REJECTED', label: 'Ditolak', count: rejectedCount ?? 0 },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>
          Override Direktur
        </h1>
        <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>
          Persetujuan SPK yang melebihi RAP
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '24px',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        {tabs.map(t => {
          const active = t.key === tab
          return (
            <Link
              key={t.key}
              href={`/dashboard/override?tab=${t.key}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', fontSize: '13px',
                fontWeight: active ? '600' : '400',
                color: active ? GOLD : SECONDARY,
                textDecoration: 'none',
                borderBottom: active ? `2px solid ${GOLD}` : '2px solid transparent',
                marginBottom: '-1px', whiteSpace: 'nowrap',
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span style={{
                  backgroundColor: t.key === 'PENDING' ? '#dc2626' : 'rgba(13,46,66,0.15)',
                  color: t.key === 'PENDING' ? '#FFFFFF' : SECONDARY,
                  borderRadius: '10px', fontSize: '10px', fontWeight: '700',
                  padding: '1px 7px',
                }}>
                  {t.count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Cards */}
      {overrideList.length === 0 ? (
        <div style={{
          backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px',
          padding: '60px', textAlign: 'center', color: SECONDARY, fontSize: '14px',
          boxShadow: '0 1px 3px rgba(13,46,66,0.06)',
        }}>
          {tab === 'PENDING'
            ? 'Tidak ada override yang menunggu persetujuan.'
            : tab === 'APPROVED'
            ? 'Belum ada override yang disetujui.'
            : 'Belum ada override yang ditolak.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {overrideList.map(ov => {
            const spk = ov.spk
            const requesterName = profileMap[ov.requested_by] ?? ov.requested_by
            const approverName = ov.approved_by ? (profileMap[ov.approved_by] ?? ov.approved_by) : null
            const items = spk?.spk_items ?? []

            return (
              <div
                key={ov.id}
                style={{
                  backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px',
                  padding: '24px 28px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)',
                }}
              >
                {/* Card header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      ...(STATUS_STYLE[ov.status] ?? STATUS_STYLE.PENDING),
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                    }}>
                      {STATUS_LABEL[ov.status] ?? ov.status}
                    </span>
                    {spk?.projects && (
                      <span style={{ fontSize: '13px', color: SECONDARY }}>
                        Project: <strong style={{ color: NAVY }}>{spk.projects.nama}</strong>
                      </span>
                    )}
                    {spk && (
                      <code style={{
                        backgroundColor: 'rgba(212,175,55,0.15)', color: '#7a5c00',
                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                        fontFamily: 'monospace', fontWeight: '600',
                      }}>
                        {spk.nomor_spk}
                      </code>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px', color: SECONDARY,
                    backgroundColor: 'rgba(13,46,66,0.07)', borderRadius: '4px', padding: '2px 8px',
                  }}>
                    {spk?.divisi}
                  </span>
                </div>

                {/* Vendor + Deskripsi SPK */}
                <div style={{ marginBottom: '16px' }}>
                  {spk?.vendors?.nama && (
                    <p style={{ fontSize: '13px', color: SECONDARY, margin: '0 0 4px 0' }}>
                      Vendor: <strong style={{ color: NAVY }}>{spk.vendors.nama}</strong>
                    </p>
                  )}
                  {spk?.deskripsi && (
                    <p style={{ fontSize: '14px', color: NAVY, margin: 0, fontWeight: '500' }}>
                      {spk.deskripsi}
                    </p>
                  )}
                </div>

                {/* Items */}
                {items.length > 0 && (
                  <div style={{
                    backgroundColor: '#F5F0E8', borderRadius: '8px', padding: '14px 16px',
                    marginBottom: '16px',
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: SECONDARY, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
                      Detail Item
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map(item => {
                        const total = item.total_item ?? ((item.volume ?? 0) * (item.harga_satuan ?? 0))
                        return (
                          <div key={item.id} style={{ fontSize: '13px', color: NAVY }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                              <span>
                                <span style={{ color: '#7a5c00', fontFamily: 'monospace', fontSize: '11px' }}>
                                  {item.rap_item_id ? '◆' : '◇'}
                                </span>
                                {' '}{item.deskripsi}
                                {item.volume != null && item.satuan && (
                                  <span style={{ color: SECONDARY, fontSize: '12px' }}>
                                    {' '}— {item.volume} {item.satuan}
                                    {item.harga_satuan != null && ` × ${formatRupiah(item.harga_satuan)}`}
                                  </span>
                                )}
                              </span>
                              {total > 0 && (
                                <span style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                                  {formatRupiah(total)}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Total Over */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: '8px', padding: '10px 16px', marginBottom: '16px',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: SECONDARY, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Total Over RAP
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#dc2626' }}>
                    {formatRupiah(ov.jumlah_over)}
                  </span>
                </div>

                {/* Alasan request */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: SECONDARY, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                    Alasan Request
                  </p>
                  <p style={{
                    fontSize: '13px', color: NAVY, margin: 0,
                    backgroundColor: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: '6px', padding: '10px 14px', fontStyle: 'italic',
                  }}>
                    "{ov.alasan_request}"
                  </p>
                </div>

                {/* Meta: requester + date */}
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: SECONDARY, flexWrap: 'wrap', marginBottom: tab === 'PENDING' ? '16px' : '0' }}>
                  <span>Diminta oleh: <strong>{requesterName}</strong></span>
                  <span>·</span>
                  <span>{formatDate(ov.created_at)}</span>
                </div>

                {/* Keputusan info (APPROVED/REJECTED) */}
                {ov.status !== 'PENDING' && ov.alasan_keputusan && (
                  <div style={{
                    marginTop: '12px', padding: '10px 14px',
                    backgroundColor: ov.status === 'APPROVED' ? 'rgba(22,163,74,0.07)' : 'rgba(220,38,38,0.07)',
                    border: `1px solid ${ov.status === 'APPROVED' ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}`,
                    borderRadius: '6px', fontSize: '12px', color: SECONDARY,
                  }}>
                    <span style={{ fontWeight: '700' }}>
                      {ov.status === 'APPROVED' ? 'Alasan disetujui' : 'Alasan ditolak'}:
                    </span>
                    {' '}{ov.alasan_keputusan}
                    {approverName && (
                      <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                        — oleh {approverName}
                        {ov.decided_at && `, ${formatDate(ov.decided_at)}`}
                      </span>
                    )}
                  </div>
                )}

                {/* Action buttons (PENDING only) */}
                {tab === 'PENDING' && (
                  <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '16px' }}>
                    <OverrideActionButtons overrideId={ov.id} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
