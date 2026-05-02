import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import React from 'react'

const GOLD = '#D4AF37'
const CREAM = '#FAF5EB'
const BORDER = 'rgba(212,175,55,0.2)'
const CARD_BG = 'rgba(13,46,66,0.6)'

const RAP_DIVISI = [
  { nomor: 1, nama: 'PERSIAPAN' },
  { nomor: 2, nama: 'STRUKTUR' },
  { nomor: 3, nama: 'ARSITEKTUR' },
  { nomor: 4, nama: 'MEP' },
  { nomor: 5, nama: 'LAINNYA' },
  { nomor: 6, nama: 'MATERIAL' },
  { nomor: 7, nama: 'SEWA' },
  { nomor: 8, nama: 'MANAJEMEN' },
] as const

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

type RapItem = {
  id: string
  divisi: string
  sub_divisi: string | null
  deskripsi: string
  satuan: string | null
  volume: number | null
  harga_satuan: number | null
  total_rap: number | null
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

export default async function RapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, nama, kode')
    .eq('id', id)
    .single()

  if (projectError || !project) notFound()

  const { data: rapData } = await supabase
    .from('rap_items')
    .select('id, divisi, sub_divisi, deskripsi, satuan, volume, harga_satuan, total_rap')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  const items: RapItem[] = (rapData as RapItem[]) ?? []
  const grandTotal = items.reduce((s, i) => s + (i.total_rap ?? 0), 0)

  async function deleteRapItemAction(formData: FormData) {
    'use server'
    const itemId = formData.get('id') as string
    const projectId = formData.get('project_id') as string
    const supabase = await createServerSupabaseClient()
    await supabase.from('rap_items').delete().eq('id', itemId)
    redirect(`/dashboard/projects/${projectId}/rap`)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link href={`/dashboard/projects/${id}`} style={{ fontSize: '12px', color: CREAM, opacity: 0.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          ← Kembali ke Project
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '600', color: CREAM, margin: '0 0 6px 0' }}>
              RAP — {project.nama}
            </h1>
            <p style={{ fontSize: '13px', color: CREAM, opacity: 0.5, margin: 0 }}>
              Rencana Anggaran Pelaksanaan
            </p>
          </div>
          <code style={{ backgroundColor: 'rgba(212,175,55,0.1)', color: GOLD, padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}>
            {project.kode}
          </code>
        </div>
      </div>

      {/* Divisi sections */}
      {RAP_DIVISI.map(({ nomor, nama }) => {
        const divisiItems = items.filter(i => i.divisi === nama)
        const subtotal = divisiItems.reduce((s, i) => s + (i.total_rap ?? 0), 0)

        const subDivisiGroups: { subDivisi: string | null; items: RapItem[] }[] = []
        for (const item of divisiItems) {
          const existing = subDivisiGroups.find(g => g.subDivisi === item.sub_divisi)
          if (existing) existing.items.push(item)
          else subDivisiGroups.push({ subDivisi: item.sub_divisi, items: [item] })
        }

        let rowNo = 0

        return (
          <div key={nama} style={{ marginBottom: '32px' }}>
            {/* Divisi header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  backgroundColor: 'rgba(212,175,55,0.15)', color: GOLD,
                  border: `1px solid ${BORDER}`, borderRadius: '6px',
                  padding: '3px 10px', fontSize: '12px', fontWeight: '700',
                }}>
                  {nomor}
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: GOLD, margin: 0, letterSpacing: '1px' }}>
                  {nama}
                </h3>
              </div>
              <Link href={`/dashboard/projects/${id}/rap/tambah?divisi=${nama}`} style={{
                padding: '7px 14px', backgroundColor: 'rgba(212,175,55,0.12)',
                border: `1px solid ${BORDER}`, borderRadius: '8px',
                color: GOLD, textDecoration: 'none', fontSize: '12px', fontWeight: '600',
              }}>
                + Tambah Item RAP
              </Link>
            </div>

            <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['No', 'Deskripsi', 'Satuan', 'Volume', 'Harga Satuan', 'Total RAP', 'Aksi'].map(col => (
                      <th key={col} style={col === 'Aksi' ? { ...thStyle, textAlign: 'right' as const } : thStyle}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {divisiItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', opacity: 0.35, padding: '24px' }}>
                        Belum ada item RAP
                      </td>
                    </tr>
                  ) : (
                    <>
                      {subDivisiGroups.map(({ subDivisi, items: groupItems }, gIdx) => (
                        <React.Fragment key={subDivisi ?? `g${gIdx}`}>
                          {subDivisi && (
                            <tr style={{ backgroundColor: 'rgba(250,245,235,0.03)', borderBottom: `1px solid ${BORDER}` }}>
                              <td colSpan={7} style={{
                                ...tdStyle,
                                fontStyle: 'italic',
                                color: CREAM,
                                opacity: 0.65,
                                paddingTop: '10px',
                                paddingBottom: '10px',
                                fontSize: '12px',
                                letterSpacing: '0.3px',
                              }}>
                                {subDivisi}
                              </td>
                            </tr>
                          )}
                          {groupItems.map(item => {
                            rowNo++
                            const no = rowNo
                            return (
                              <tr key={item.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                                <td style={{ ...tdStyle, opacity: 0.55, width: '48px' }}>{no}</td>
                                <td style={{ ...tdStyle, maxWidth: '240px' }}>{item.deskripsi}</td>
                                <td style={{ ...tdStyle, opacity: 0.7 }}>{item.satuan ?? '—'}</td>
                                <td style={{ ...tdStyle, opacity: 0.7 }}>{item.volume ?? '—'}</td>
                                <td style={{ ...tdStyle, opacity: 0.8 }}>{item.harga_satuan != null ? formatRupiah(item.harga_satuan) : '—'}</td>
                                <td style={{ ...tdStyle, color: GOLD, fontWeight: '600' }}>{item.total_rap != null ? formatRupiah(item.total_rap) : '—'}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <Link href={`/dashboard/projects/${id}/rap/${item.id}/edit`} style={{
                                      padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                      textDecoration: 'none', backgroundColor: 'rgba(212,175,55,0.1)',
                                      border: `1px solid ${BORDER}`, color: GOLD,
                                    }}>
                                      Edit
                                    </Link>
                                    <form action={deleteRapItemAction} style={{ display: 'inline' }}>
                                      <input type="hidden" name="id" value={item.id} />
                                      <input type="hidden" name="project_id" value={id} />
                                      <button type="submit" style={{
                                        padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                        backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                        color: '#f87171', cursor: 'pointer',
                                      }}>
                                        Hapus
                                      </button>
                                    </form>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </React.Fragment>
                      ))}

                      {/* Subtotal */}
                      <tr style={{ backgroundColor: 'rgba(212,175,55,0.07)', borderTop: `1px solid ${BORDER}` }}>
                        <td colSpan={5} style={{ ...tdStyle, fontWeight: '700', fontSize: '12px', color: GOLD, opacity: 0.85, letterSpacing: '0.5px' }}>
                          SUBTOTAL {nama}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: '700', color: GOLD }}>{formatRupiah(subtotal)}</td>
                        <td />
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Grand Total */}
      <div style={{
        backgroundColor: 'rgba(212,175,55,0.12)',
        border: `1px solid rgba(212,175,55,0.4)`,
        borderRadius: '10px',
        overflow: 'auto',
        marginTop: '8px',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
          <tbody>
            <tr>
              <td colSpan={5} style={{ ...tdStyle, fontWeight: '800', fontSize: '13px', color: GOLD, letterSpacing: '1.5px', padding: '16px' }}>
                GRAND TOTAL RAP
              </td>
              <td style={{ ...tdStyle, fontWeight: '800', color: GOLD, fontSize: '14px', padding: '16px' }}>
                {formatRupiah(grandTotal)}
              </td>
              <td style={{ padding: '16px' }} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
