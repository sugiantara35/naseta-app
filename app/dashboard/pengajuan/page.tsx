'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.15)'
const CARD_BG = '#FFFFFF'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

const STATUS_BADGE: Record<string, React.CSSProperties> = {
  MENUNGGU_SM:      { backgroundColor: '#fef9c3', color: '#854d0e' },
  DISETUJUI_SM:     { backgroundColor: '#dbeafe', color: '#1e40af' },
  RENUMERASI_SM:    { backgroundColor: '#dbeafe', color: '#1e40af' },
  DITOLAK_SM:       { backgroundColor: '#fee2e2', color: '#991b1b' },
  DITOLAK_FINANCE:  { backgroundColor: '#fee2e2', color: '#991b1b' },
  DITOLAK_DIREKTUR: { backgroundColor: '#fee2e2', color: '#991b1b' },
  DISETUJUI_FINANCE:   { backgroundColor: '#e0e7ff', color: '#3730a3' },
  DISETUJUI_DIREKTUR:  { backgroundColor: '#dcfce7', color: '#166534' },
  SELESAI:             { backgroundColor: '#f0fdf4', color: '#15803d' },
}

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU_SM:      'Menunggu SM',
  DISETUJUI_SM:     'Disetujui SM',
  RENUMERASI_SM:    'Renumerasi SM',
  DITOLAK_SM:       'Ditolak SM',
  DITOLAK_FINANCE:  'Ditolak Finance',
  DITOLAK_DIREKTUR: 'Ditolak Direktur',
  DISETUJUI_FINANCE:   'Disetujui Finance',
  DISETUJUI_DIREKTUR:  'Disetujui Direktur',
  SELESAI:             'Selesai',
}

function PengajuanStatusBadge({ status }: { status: string }) {
  const style = STATUS_BADGE[status] ?? { backgroundColor: '#f3f4f6', color: '#374151' }
  return (
    <span style={{ ...style, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

type PengajuanRow = {
  id: string
  jumlah_diajukan: number
  jumlah_disetujui: number | null
  status: string
  created_at: string
  spk: {
    nomor_spk: string
    divisi: string
    vendors: { nama: string } | null
    projects: { nama: string } | null
  } | null
}

const TABS = [
  { label: 'Semua', key: 'ALL' },
  { label: 'Menunggu SM', key: 'MENUNGGU_SM' },
  { label: 'Menunggu Finance', key: 'FINANCE' },
  { label: 'Menunggu Direktur', key: 'DISETUJUI_FINANCE' },
  { label: 'Selesai', key: 'SELESAI' },
  { label: 'Ditolak', key: 'DITOLAK' },
]

export default function PengajuanPage() {
  const router = useRouter()
  const [data, setData] = useState<PengajuanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL')

  useEffect(() => {
    async function fetchAll() {
      const supabase = createClient()
      const { data: rows } = await supabase
        .from('pengajuan')
        .select('*, spk:spk_id(nomor_spk, divisi, vendors(nama), projects(nama))')
        .order('created_at', { ascending: false })
      if (rows) setData(rows as PengajuanRow[])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const filtered =
    activeTab === 'ALL'     ? data
    : activeTab === 'FINANCE'  ? data.filter(r => ['DISETUJUI_SM', 'RENUMERASI_SM'].includes(r.status))
    : activeTab === 'DITOLAK'  ? data.filter(r => ['DITOLAK_SM', 'DITOLAK_FINANCE', 'DITOLAK_DIREKTUR'].includes(r.status))
    : data.filter(r => r.status === activeTab)

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
    color: NAVY, letterSpacing: '1px', textTransform: 'uppercase',
  }
  const tdStyle: React.CSSProperties = { padding: '13px 16px', fontSize: '13px', color: NAVY, verticalAlign: 'middle' }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Pengajuan Pembayaran</h1>
        <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>Daftar semua pengajuan dari seluruh proyek</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const count = tab.key === 'ALL'     ? data.length
            : tab.key === 'FINANCE'  ? data.filter(r => ['DISETUJUI_SM', 'RENUMERASI_SM'].includes(r.status)).length
            : tab.key === 'DITOLAK'  ? data.filter(r => ['DITOLAK_SM', 'DITOLAK_FINANCE', 'DITOLAK_DIREKTUR'].includes(r.status)).length
            : data.filter(r => r.status === tab.key).length
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: isActive ? 'none' : `1px solid ${BORDER}`,
                backgroundColor: isActive ? NAVY : CARD_BG,
                color: isActive ? '#FAF5EB' : SECONDARY,
                fontSize: '13px',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {tab.label}
              <span style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#F5F0E8',
                color: isActive ? '#FAF5EB' : SECONDARY,
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px', overflowX: 'auto', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: SECONDARY, fontSize: '14px' }}>Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: SECONDARY, fontSize: '14px' }}>Tidak ada pengajuan.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#F5F0E8' }}>
                {['No. SPK', 'Project', 'Vendor', 'Jumlah Diajukan', 'Jumlah Disetujui', 'Status', 'Aksi'].map(col => (
                  <th key={col} style={thStyle}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <td style={tdStyle}>
                    <code style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: '700', backgroundColor: 'rgba(212,175,55,0.12)', color: '#7a5c00', padding: '2px 6px', borderRadius: '4px' }}>
                      {row.spk?.nomor_spk ?? '—'}
                    </code>
                  </td>
                  <td style={{ ...tdStyle, color: SECONDARY }}>{row.spk?.projects?.nama ?? '—'}</td>
                  <td style={{ ...tdStyle, color: SECONDARY }}>{row.spk?.vendors?.nama ?? '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: '600' }}>{formatRupiah(row.jumlah_diajukan)}</td>
                  <td style={{ ...tdStyle, color: row.jumlah_disetujui != null ? '#166534' : SECONDARY, fontWeight: row.jumlah_disetujui != null ? '600' : '400' }}>
                    {row.jumlah_disetujui != null ? formatRupiah(row.jumlah_disetujui) : '—'}
                  </td>
                  <td style={tdStyle}>
                    <PengajuanStatusBadge status={row.status} />
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => router.push(`/dashboard/pengajuan/${row.id}`)}
                      style={{ padding: '6px 14px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '6px', color: NAVY, fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Lihat
                    </button>
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
