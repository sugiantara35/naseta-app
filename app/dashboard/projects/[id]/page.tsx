import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const GOLD = '#D4AF37'
const CREAM = '#FAF5EB'
const BORDER = 'rgba(212,175,55,0.2)'
const CARD_BG = 'rgba(13,46,66,0.6)'

const DIVISI_TABS = ['PERSIAPAN', 'STRUKTUR', 'ARSITEKTUR', 'MEP', 'LAINNYA'] as const
const ALL_TABS = ['REKAPITULASI', ...DIVISI_TABS, 'MATERIAL'] as const
type Tab = typeof ALL_TABS[number]

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function tabLabel(tab: string) {
  if (tab === 'REKAPITULASI') return 'Rekapitulasi'
  return tab.charAt(0) + tab.slice(1).toLowerCase()
}

function ProjectStatusBadge({ status }: { status: string }) {
  const map: Record<string, React.CSSProperties> = {
    AKTIF:   { backgroundColor: 'rgba(34,197,94,0.15)',  color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' },
    SELESAI: { backgroundColor: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)' },
    DITUNDA: { backgroundColor: 'rgba(234,179,8,0.15)',  color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' },
  }
  return (
    <span style={{ ...(map[status] ?? map.DITUNDA), padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
      {status}
    </span>
  )
}

function SpkStatusBadge({ status }: { status: string }) {
  const map: Record<string, React.CSSProperties> = {
    DRAFT:   { backgroundColor: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)' },
    AKTIF:   { backgroundColor: 'rgba(34,197,94,0.15)',   color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' },
    SELESAI: { backgroundColor: 'rgba(212,175,55,0.15)',  color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' },
  }
  return (
    <span style={{ ...(map[status] ?? map.DRAFT), padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
      {status}
    </span>
  )
}

type SpkRow = {
  id: string
  nomor_spk: string
  deskripsi: string
  divisi: string
  pp_rap: number | null
  deal_spk: number | null
  status: string
  tanggal_spk: string | null
  vendors: { nama: string } | null
  spk_payments: { jumlah: number }[]
  rap_item_id: string | null
  rap_items: { id: string; deskripsi: string; total_rap: number | null } | null
}

type RapItemRow = {
  id: string
  divisi: string
  deskripsi: string
  total_rap: number | null
}

type MaterialRow = {
  id: string
  deskripsi: string
  qty: number | null
  satuan: string | null
  harga_satuan: number | null
  total: number | null
  vendors: { nama: string } | null
}

const thStyle: React.CSSProperties = {
  padding: '13px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '600',
  color: GOLD,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  opacity: 0.85,
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '13px',
  color: CREAM,
  verticalAlign: 'middle',
}

function spkTerbayar(spk: SpkRow) {
  return (spk.spk_payments ?? []).reduce((s, p) => s + (p.jumlah ?? 0), 0)
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const activeTab: Tab = (ALL_TABS.includes(sp.tab as Tab) ? sp.tab : 'REKAPITULASI') as Tab

  const supabase = await createServerSupabaseClient()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (projectError || !project) notFound()

  let spkList: SpkRow[] = []
  let allSpk: SpkRow[] = []
  let materialList: MaterialRow[] = []
  let rapItemsList: RapItemRow[] = []

  if (activeTab === 'REKAPITULASI') {
    const { data } = await supabase
      .from('spk')
      .select('id, nomor_spk, deskripsi, divisi, pp_rap, deal_spk, status, tanggal_spk, vendors(nama), spk_payments(jumlah), rap_item_id, rap_items(id, deskripsi, total_rap)')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    allSpk = (data as unknown as SpkRow[]) ?? []

    const { data: rapData } = await supabase
      .from('rap_items')
      .select('id, divisi, deskripsi, total_rap')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    rapItemsList = (rapData as RapItemRow[]) ?? []
  } else if (activeTab === 'MATERIAL') {
    const { data } = await supabase
      .from('material_purchases')
      .select('id, deskripsi, qty, satuan, harga_satuan, total, vendors(nama)')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
    materialList = (data as unknown as MaterialRow[]) ?? []
  } else {
    const { data } = await supabase
      .from('spk')
      .select('id, nomor_spk, deskripsi, divisi, pp_rap, deal_spk, status, tanggal_spk, vendors(nama), spk_payments(jumlah)')
      .eq('project_id', id)
      .eq('divisi', activeTab)
      .order('created_at', { ascending: false })
    spkList = (data as unknown as SpkRow[]) ?? []
  }

  // Group allSpk by divisi for REKAPITULASI
  const rekapByDivisi = DIVISI_TABS.map((divisi, idx) => ({
    divisi,
    nomor: idx + 1,
    rows: allSpk.filter(s => s.divisi === divisi),
  }))

  return (
    <div>
      {/* Back + Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/projects" style={{ fontSize: '12px', color: CREAM, opacity: 0.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          ← Kembali ke Projects
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '600', color: CREAM, margin: '0 0 6px 0' }}>{project.nama}</h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <code style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: GOLD, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                {project.kode}
              </code>
              {project.lokasi && <span style={{ fontSize: '13px', color: CREAM, opacity: 0.55 }}>{project.lokasi}</span>}
              {project.durasi_mulai && (
                <span style={{ fontSize: '13px', color: CREAM, opacity: 0.55 }}>
                  {project.durasi_mulai}{project.durasi_selesai ? ` – ${project.durasi_selesai}` : ''}
                </span>
              )}
              <ProjectStatusBadge status={project.status} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/dashboard/projects/${id}/rap`} style={{
              padding: '8px 16px', backgroundColor: 'rgba(212,175,55,0.12)',
              border: `1px solid ${BORDER}`, borderRadius: '8px',
              color: GOLD, textDecoration: 'none', fontSize: '13px', fontWeight: '600',
            }}>
              RAP
            </Link>
            <Link href={`/dashboard/projects/${id}/edit`} style={{
              padding: '8px 16px', border: `1px solid ${BORDER}`, borderRadius: '8px',
              color: CREAM, textDecoration: 'none', fontSize: '13px', opacity: 0.7,
            }}>
              Edit Project
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${BORDER}` }}>
        {ALL_TABS.map(tab => {
          const active = tab === activeTab
          return (
            <Link key={tab} href={`/dashboard/projects/${id}?tab=${tab}`} style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: active ? '600' : '400',
              color: active ? GOLD : CREAM,
              opacity: active ? 1 : 0.55,
              textDecoration: 'none',
              borderBottom: active ? `2px solid ${GOLD}` : '2px solid transparent',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}>
              {tabLabel(tab)}
            </Link>
          )
        })}
      </div>

      {/* ── REKAPITULASI ── */}
      {activeTab === 'REKAPITULASI' && (() => {
        const grandPpRap    = allSpk.reduce((s, spk) => s + (spk.pp_rap ?? 0), 0)
        const grandDeal     = allSpk.reduce((s, spk) => s + (spk.deal_spk ?? 0), 0)
        const grandTerbayar = allSpk.reduce((s, spk) => s + spkTerbayar(spk), 0)
        const grandSaldo    = grandDeal - grandTerbayar

        return (
          <div>
            {rekapByDivisi.map(({ divisi, nomor, rows }) => {
              const subPpRap    = rows.reduce((s, spk) => s + (spk.pp_rap ?? 0), 0)
              const subDeal     = rows.reduce((s, spk) => s + (spk.deal_spk ?? 0), 0)
              const subTerbayar = rows.reduce((s, spk) => s + spkTerbayar(spk), 0)
              const subSaldo    = subDeal - subTerbayar

              return (
                <div key={divisi} style={{ marginBottom: '28px' }}>
                  {/* Divisi header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <span style={{
                      backgroundColor: 'rgba(212,175,55,0.15)', color: GOLD,
                      border: `1px solid ${BORDER}`, borderRadius: '6px',
                      padding: '3px 10px', fontSize: '12px', fontWeight: '700',
                    }}>
                      {nomor}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: GOLD, margin: 0, letterSpacing: '1px' }}>
                      {divisi}
                    </h3>
                  </div>

                  <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          {['No. SPK', 'Deskripsi', 'RAP Rujukan', 'Vendor', 'PP/RAP', 'Deal SPK', 'Terbayar', 'Saldo'].map(col => (
                            <th key={col} style={thStyle}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', opacity: 0.35, padding: '24px' }}>
                              Belum ada SPK
                            </td>
                          </tr>
                        ) : rows.map((spk, i) => {
                          const terbayar = spkTerbayar(spk)
                          const saldo = (spk.deal_spk ?? 0) - terbayar
                          return (
                            <tr key={spk.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                              <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: GOLD }}>{spk.nomor_spk}</td>
                              <td style={{ ...tdStyle, maxWidth: '200px' }}>{spk.deskripsi}</td>
                              <td style={{ ...tdStyle, maxWidth: '180px', opacity: 0.7, fontSize: '12px', fontStyle: 'italic' }}>
                                {spk.rap_items?.deskripsi ?? '—'}
                              </td>
                              <td style={{ ...tdStyle, opacity: 0.7 }}>{spk.vendors?.nama ?? '—'}</td>
                              <td style={{ ...tdStyle, opacity: 0.7 }}>{spk.pp_rap != null ? formatRupiah(spk.pp_rap) : '—'}</td>
                              <td style={tdStyle}>{spk.deal_spk != null ? formatRupiah(spk.deal_spk) : '—'}</td>
                              <td style={{ ...tdStyle, color: '#4ade80' }}>{formatRupiah(terbayar)}</td>
                              <td style={{ ...tdStyle, color: saldo < 0 ? '#f87171' : CREAM, fontWeight: '600' }}>{formatRupiah(saldo)}</td>
                            </tr>
                          )
                        })}

                        {/* Subtotal row */}
                        <tr style={{ backgroundColor: 'rgba(212,175,55,0.07)', borderTop: `1px solid ${BORDER}` }}>
                          <td colSpan={4} style={{ ...tdStyle, fontWeight: '700', fontSize: '12px', color: GOLD, opacity: 0.85, letterSpacing: '0.5px' }}>
                            SUBTOTAL {divisi}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: '700', opacity: 0.8 }}>{formatRupiah(subPpRap)}</td>
                          <td style={{ ...tdStyle, fontWeight: '700' }}>{formatRupiah(subDeal)}</td>
                          <td style={{ ...tdStyle, fontWeight: '700', color: '#4ade80' }}>{formatRupiah(subTerbayar)}</td>
                          <td style={{ ...tdStyle, fontWeight: '700', color: subSaldo < 0 ? '#f87171' : CREAM }}>{formatRupiah(subSaldo)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}

            {/* Grand Total SPK */}
            <div style={{
              backgroundColor: 'rgba(212,175,55,0.12)',
              border: `1px solid rgba(212,175,55,0.4)`,
              borderRadius: '10px',
              overflow: 'auto',
              marginTop: '8px',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <tbody>
                  <tr>
                    <td colSpan={4} style={{ ...tdStyle, fontWeight: '800', fontSize: '13px', color: GOLD, letterSpacing: '1.5px', padding: '16px 16px' }}>
                      GRAND TOTAL
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '800', color: GOLD, fontSize: '14px', padding: '16px 16px' }}>{formatRupiah(grandPpRap)}</td>
                    <td style={{ ...tdStyle, fontWeight: '800', color: GOLD, fontSize: '14px', padding: '16px 16px' }}>{formatRupiah(grandDeal)}</td>
                    <td style={{ ...tdStyle, fontWeight: '800', color: '#4ade80', fontSize: '14px', padding: '16px 16px' }}>{formatRupiah(grandTerbayar)}</td>
                    <td style={{ ...tdStyle, fontWeight: '800', color: grandSaldo < 0 ? '#f87171' : GOLD, fontSize: '14px', padding: '16px 16px' }}>{formatRupiah(grandSaldo)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Saldo RAP per item */}
            {rapItemsList.length > 0 && (() => {
              const grandRapTotal = rapItemsList.reduce((s, r) => s + (r.total_rap ?? 0), 0)
              const grandRapTerpakai = rapItemsList.reduce((s, r) => {
                const terpakai = allSpk.filter(spk => spk.rap_item_id === r.id).reduce((a, spk) => a + (spk.deal_spk ?? 0), 0)
                return s + terpakai
              }, 0)
              const grandRapSaldo = grandRapTotal - grandRapTerpakai

              return (
                <div style={{ marginTop: '32px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: GOLD, margin: '0 0 12px 0', letterSpacing: '1px' }}>
                    SALDO RAP PER ITEM
                  </h3>
                  <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                          {['Divisi', 'Deskripsi RAP', 'Total RAP', 'Terpakai (Deal SPK)', 'Saldo RAP'].map(col => (
                            <th key={col} style={thStyle}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rapItemsList.map((rap, i) => {
                          const terpakai = allSpk
                            .filter(spk => spk.rap_item_id === rap.id)
                            .reduce((a, spk) => a + (spk.deal_spk ?? 0), 0)
                          const saldoRap = (rap.total_rap ?? 0) - terpakai
                          return (
                            <tr key={rap.id} style={{ borderBottom: i < rapItemsList.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                              <td style={{ ...tdStyle, fontSize: '11px', opacity: 0.7, whiteSpace: 'nowrap' }}>{rap.divisi}</td>
                              <td style={{ ...tdStyle, maxWidth: '260px' }}>{rap.deskripsi}</td>
                              <td style={{ ...tdStyle, color: GOLD, opacity: 0.85 }}>{rap.total_rap != null ? formatRupiah(rap.total_rap) : '—'}</td>
                              <td style={{ ...tdStyle, color: '#f87171' }}>{formatRupiah(terpakai)}</td>
                              <td style={{ ...tdStyle, fontWeight: '700', color: saldoRap < 0 ? '#f87171' : '#4ade80' }}>{formatRupiah(saldoRap)}</td>
                            </tr>
                          )
                        })}

                        {/* RAP Grand total row */}
                        <tr style={{ backgroundColor: 'rgba(212,175,55,0.07)', borderTop: `1px solid ${BORDER}` }}>
                          <td colSpan={2} style={{ ...tdStyle, fontWeight: '700', fontSize: '12px', color: GOLD, opacity: 0.85, letterSpacing: '0.5px' }}>
                            TOTAL RAP
                          </td>
                          <td style={{ ...tdStyle, fontWeight: '700', color: GOLD }}>{formatRupiah(grandRapTotal)}</td>
                          <td style={{ ...tdStyle, fontWeight: '700', color: '#f87171' }}>{formatRupiah(grandRapTerpakai)}</td>
                          <td style={{ ...tdStyle, fontWeight: '700', color: grandRapSaldo < 0 ? '#f87171' : '#4ade80' }}>{formatRupiah(grandRapSaldo)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
          </div>
        )
      })()}

      {/* ── MATERIAL ── */}
      {activeTab === 'MATERIAL' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <Link href={`/dashboard/projects/${id}/material/tambah`} style={{
              padding: '9px 18px', backgroundColor: GOLD, color: '#0D2E42',
              borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none',
            }}>
              + Tambah Material
            </Link>
          </div>
          <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Deskripsi', 'Vendor', 'Qty', 'Satuan', 'Harga Satuan', 'Total'].map(col => (
                    <th key={col} style={thStyle}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materialList.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', opacity: 0.4, padding: '40px' }}>Belum ada data material.</td></tr>
                ) : materialList.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: i < materialList.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <td style={tdStyle}>{m.deskripsi}</td>
                    <td style={{ ...tdStyle, opacity: 0.7 }}>{m.vendors?.nama ?? '—'}</td>
                    <td style={{ ...tdStyle, opacity: 0.7 }}>{m.qty ?? '—'}</td>
                    <td style={{ ...tdStyle, opacity: 0.7 }}>{m.satuan ?? '—'}</td>
                    <td style={{ ...tdStyle, opacity: 0.7 }}>{m.harga_satuan != null ? formatRupiah(m.harga_satuan) : '—'}</td>
                    <td style={{ ...tdStyle, color: GOLD, fontWeight: '600' }}>{m.total != null ? formatRupiah(m.total) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DIVISI TABS (PERSIAPAN, STRUKTUR, dll) ── */}
      {DIVISI_TABS.includes(activeTab as typeof DIVISI_TABS[number]) && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <Link href={`/dashboard/projects/${id}/spk/tambah?divisi=${activeTab}`} style={{
              padding: '9px 18px', backgroundColor: GOLD, color: '#0D2E42',
              borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none',
            }}>
              + Tambah SPK
            </Link>
          </div>
          <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['No. SPK', 'Deskripsi', 'Vendor', 'PP/RAP', 'Deal SPK', 'Terbayar', 'Saldo', 'Status', 'Aksi'].map(col => (
                    <th key={col} style={thStyle}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spkList.length === 0 ? (
                  <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', opacity: 0.4, padding: '40px' }}>
                    Belum ada SPK untuk divisi ini.
                  </td></tr>
                ) : spkList.map((spk, i) => {
                  const terbayar = spkTerbayar(spk)
                  const saldo = (spk.deal_spk ?? 0) - terbayar
                  return (
                    <tr key={spk.id} style={{ borderBottom: i < spkList.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: GOLD }}>{spk.nomor_spk}</td>
                      <td style={{ ...tdStyle, maxWidth: '200px' }}>{spk.deskripsi}</td>
                      <td style={{ ...tdStyle, opacity: 0.7 }}>{spk.vendors?.nama ?? '—'}</td>
                      <td style={{ ...tdStyle, opacity: 0.7 }}>{spk.pp_rap != null ? formatRupiah(spk.pp_rap) : '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>{spk.deal_spk != null ? formatRupiah(spk.deal_spk) : '—'}</td>
                      <td style={{ ...tdStyle, color: '#4ade80' }}>{formatRupiah(terbayar)}</td>
                      <td style={{ ...tdStyle, color: saldo < 0 ? '#f87171' : CREAM, fontWeight: '600' }}>{formatRupiah(saldo)}</td>
                      <td style={tdStyle}><SpkStatusBadge status={spk.status} /></td>
                      <td style={tdStyle}>
                        <Link href={`/dashboard/projects/${id}/spk/${spk.id}`} style={{
                          padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                          textDecoration: 'none', backgroundColor: 'rgba(212,175,55,0.1)', border: `1px solid ${BORDER}`, color: GOLD,
                        }}>
                          Detail
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {spkList.length > 0 && (() => {
            const totalDeal     = spkList.reduce((s, spk) => s + (spk.deal_spk ?? 0), 0)
            const totalTerbayar = spkList.reduce((s, spk) => s + spkTerbayar(spk), 0)
            const totalSaldo    = totalDeal - totalTerbayar
            return (
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Deal SPK', value: totalDeal, color: CREAM },
                  { label: 'Total Terbayar', value: totalTerbayar, color: '#4ade80' },
                  { label: 'Total Saldo', value: totalSaldo, color: totalSaldo < 0 ? '#f87171' : GOLD },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '12px 20px', flex: 1, minWidth: '160px' }}>
                    <p style={{ fontSize: '11px', color: CREAM, opacity: 0.5, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
                    <p style={{ fontSize: '18px', fontWeight: '700', color, margin: 0 }}>{formatRupiah(value)}</p>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
